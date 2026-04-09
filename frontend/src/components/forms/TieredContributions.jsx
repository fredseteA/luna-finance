import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '../ui/tooltip';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, generateId } from '../../services/financialEngine';
import { cn } from '../../lib/utils';

/**
 * TieredContributions — configura faixas de aporte mensal ao longo do tempo.
 *
 * Permite modelar eventos futuros que aumentam (ou diminuem) a sobra disponível
 * para investir: encerramento de um financiamento, aumento salarial, filho
 * saindo de escola particular, etc.
 *
 * Cada faixa define:
 *   - Mês de início (fromMonth, 1-based)
 *   - Mês de fim (toMonth, opcional — vazio = até o fim da projeção)
 *   - Valor fixo mensal a investir nesse período
 *
 * A projeção usa o valor da faixa ativa em vez do percentual de surplusAllocation.
 * Se não houver faixa ativa num mês, usa o comportamento padrão (surplusAllocation).
 */

const monthLabel = (monthNumber, startDate) => {
  if (!startDate || !monthNumber) return `Mês ${monthNumber}`;
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + monthNumber - 1);
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
};

const TierRow = ({ tier, index, onUpdate, onRemove, startDate, currency, durationMonths }) => {
  const [localAmount, setLocalAmount] = useState(String(tier.amount || ''));

  const handleAmountBlur = () => {
    const val = parseFloat(localAmount) || 0;
    onUpdate(tier.id, { amount: val });
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-border/40 bg-muted/30">
      {/* Cabeçalho da faixa */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] font-mono">
          Faixa {index + 1}
        </Badge>
        <button
          onClick={() => onRemove(tier.id)}
          className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Período */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Mês início</Label>
          <Input
            type="number"
            min={1}
            max={durationMonths}
            value={tier.fromMonth ?? ''}
            onChange={(e) => onUpdate(tier.id, { fromMonth: parseInt(e.target.value) || 1 })}
            className="h-9 text-sm font-mono"
            placeholder="1"
          />
          {tier.fromMonth && (
            <p className="text-[10px] text-muted-foreground">
              {monthLabel(tier.fromMonth, startDate)}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Mês fim (opcional)</Label>
          <Input
            type="number"
            min={tier.fromMonth ?? 1}
            max={durationMonths}
            value={tier.toMonth ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value);
              onUpdate(tier.id, { toMonth: val });
            }}
            className="h-9 text-sm font-mono"
            placeholder="fim"
          />
          {tier.toMonth ? (
            <p className="text-[10px] text-muted-foreground">
              {monthLabel(tier.toMonth, startDate)}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">até o fim</p>
          )}
        </div>
      </div>

      {/* Valor de aporte */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Aporte mensal nesse período</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            R$
          </span>
          <Input
            type="number"
            min={0}
            value={localAmount}
            onChange={(e) => setLocalAmount(e.target.value)}
            onBlur={handleAmountBlur}
            className="pl-9 h-9 text-sm font-mono"
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Preview legível */}
      {tier.fromMonth && tier.amount > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5">
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span>
            A partir de {monthLabel(tier.fromMonth, startDate)}
            {tier.toMonth ? ` até ${monthLabel(tier.toMonth, startDate)}` : ' em diante'}
            {': '}
            <span className="font-semibold text-foreground">
              {formatCurrency(tier.amount, currency)}
            </span>
            /mês investido
          </span>
        </div>
      )}
    </div>
  );
};

export const TieredContributions = () => {
  const { financialData, updateFinancialData, settings } = useFinancial();

  const tiers = financialData.tieredContributions || [];
  const startDate = financialData.startDate || new Date().toISOString().slice(0, 7);
  const durationMonths = financialData.durationMonths || 12;
  const currency = settings.currency || 'BRL';

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const fromMonth = lastTier
      ? (lastTier.toMonth ? lastTier.toMonth + 1 : Math.min((lastTier.fromMonth || 1) + 3, durationMonths))
      : 1;

    const newTier = {
      id: generateId(),
      fromMonth,
      toMonth: null,
      amount: 0,
      label: '',
    };
    updateFinancialData({ tieredContributions: [...tiers, newTier] });
  };

  const updateTier = (id, changes) => {
    updateFinancialData({
      tieredContributions: tiers.map(t => t.id === id ? { ...t, ...changes } : t),
    });
  };

  const removeTier = (id) => {
    updateFinancialData({
      tieredContributions: tiers.filter(t => t.id !== id),
    });
  };

  const hasOverlap = () => {
    for (let i = 0; i < tiers.length; i++) {
      for (let j = i + 1; j < tiers.length; j++) {
        const a = tiers[i];
        const b = tiers[j];
        const aFrom = a.fromMonth ?? 1;
        const aTo = a.toMonth ?? Infinity;
        const bFrom = b.fromMonth ?? 1;
        const bTo = b.toMonth ?? Infinity;
        if (aFrom <= bTo && aTo >= bFrom) return true;
      }
    }
    return false;
  };

  return (
    <Card className="card-grid-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Aportes por período
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Configure valores de aporte diferentes para períodos específicos.
                      Útil quando você sabe que a partir de um mês terá mais dinheiro disponível —
                      como o encerramento de um financiamento, academia ou mensalidade escolar.
                      O valor da faixa substitui o percentual configurado no "Destino da Sobra".
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Opcional — quando não configurado, usa o percentual do Destino da Sobra
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Aviso de sobreposição */}
        {hasOverlap() && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-xs">
              Duas faixas se sobrepõem. Em meses com sobreposição, a última faixa da lista vence.
            </p>
          </div>
        )}

        {/* Lista de faixas */}
        {tiers.length === 0 ? (
          <div className="text-center py-5 text-muted-foreground">
            <p className="text-sm">Nenhuma faixa configurada</p>
            <p className="text-xs mt-1">
              A projeção usa o percentual do Destino da Sobra em todos os meses.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tiers.map((tier, index) => (
              <TierRow
                key={tier.id}
                tier={tier}
                index={index}
                onUpdate={updateTier}
                onRemove={removeTier}
                startDate={startDate}
                currency={currency}
                durationMonths={durationMonths}
              />
            ))}
          </div>
        )}

        {/* Botão adicionar */}
        <Button
          variant="outline"
          size="sm"
          onClick={addTier}
          className="w-full gap-2 border-dashed"
          disabled={tiers.length >= 6}
        >
          <Plus className="h-4 w-4" />
          Adicionar faixa de aporte
        </Button>

        {tiers.length >= 6 && (
          <p className="text-[10px] text-muted-foreground text-center">
            Máximo de 6 faixas atingido
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TieredContributions;