import React, { useState } from 'react';
import { Wallet, PiggyBank, TrendingUp, Banknote, Info, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, formatPercentage, CURRENCIES } from '../../services/financialEngine';
import { cn } from '../../lib/utils';

export const SurplusAllocation = () => {
  const { 
    financialData, 
    updateFinancialData, 
    summary,
    currency 
  } = useFinancial();
  
  // Modo: 'percentage' ou 'fixed'
  const [mode, setMode] = useState('fixed');

  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';
  const surplus = summary.monthlySurplus;

  // Initialize surplus allocation if not exists
  const surplusAllocation = financialData.surplusAllocation || {
    investments: 100,
    emergencyFund: 0,
    savingsGoals: 0,
    keepCash: 0,
  };

  // Valores fixos (armazenados separadamente)
  const fixedAmounts = financialData.fixedSurplusAmounts || {
    investments: 0,
    emergencyFund: 0,
    savingsGoals: 0,
    keepCash: 0,
  };

  const handleAllocationChange = (field, value) => {
    const remaining = 100 - value;
    const otherFields = ['investments', 'emergencyFund', 'savingsGoals', 'keepCash'].filter(f => f !== field);
    const currentOthers = otherFields.reduce((sum, f) => sum + (surplusAllocation[f] || 0), 0);

    let newAllocation;
    if (currentOthers === 0) {
      const each = Math.floor(remaining / 3);
      newAllocation = { [field]: value };
      otherFields.forEach((f, i) => {
        newAllocation[f] = i === 0 ? remaining - (each * 2) : each;
      });
    } else {
      const scale = remaining / currentOthers;
      newAllocation = { [field]: value };
      otherFields.forEach(f => {
        newAllocation[f] = Math.round((surplusAllocation[f] || 0) * scale);
      });
    }

    updateFinancialData({ surplusAllocation: newAllocation });
  };

  // Atualiza valor fixo direto
  const handleFixedAmountChange = (field, amount) => {
    const newFixedAmounts = {
      ...fixedAmounts,
      [field]: Math.max(0, amount),
    };
    
    // Atualiza os valores fixos
    updateFinancialData({ fixedSurplusAmounts: newFixedAmounts });
    
    // Também atualiza a porcentagem para manter consistência
    if (surplus > 0) {
      const percentage = Math.min(100, Math.max(0, (amount / surplus) * 100));
      handleAllocationChange(field, Math.round(percentage));
    }
  };

  const totalAllocation = (surplusAllocation.investments || 0) + 
                          (surplusAllocation.emergencyFund || 0) + 
                          (surplusAllocation.savingsGoals || 0) + 
                          (surplusAllocation.keepCash || 0);

  const totalFixedAmount = Object.values(fixedAmounts).reduce((sum, val) => sum + (val || 0), 0);

  const allocationItems = [
    {
      field: 'investments',
      label: 'Investimentos',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      colorText: 'text-emerald-400',
      description: 'Valor destinado aos investimentos configurados',
    },
    {
      field: 'emergencyFund',
      label: 'Reserva de Emergência',
      icon: Wallet,
      color: 'bg-blue-500',
      colorText: 'text-blue-400',
      description: 'Dinheiro guardado para imprevistos',
    },
    {
      field: 'savingsGoals',
      label: 'Metas de Poupança',
      icon: PiggyBank,
      color: 'bg-purple-500',
      colorText: 'text-purple-400',
      description: 'Poupança para objetivos específicos',
    },
    {
      field: 'keepCash',
      label: 'Manter em Conta',
      icon: Banknote,
      color: 'bg-amber-500',
      colorText: 'text-amber-400',
      description: 'Dinheiro disponível para uso imediato',
    },
  ];

  return (
    <Card className="card-grid-border" data-testid="surplus-allocation">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Destino da Sobra
        </CardTitle>
        <CardDescription className="text-xs">
          Sobra mensal: <span className="font-mono font-semibold">{formatCurrency(surplus, currency)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {surplus <= 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Sem sobra para distribuir</p>
            <p className="text-xs mt-1">Ajuste sua renda ou despesas</p>
          </div>
        ) : (
          <>
            {/* Mode Toggle */}
            <Tabs value={mode} onValueChange={setMode} className="w-full">
              <TabsList className="grid grid-cols-2 w-full h-9">
                <TabsTrigger value="fixed" className="text-xs gap-1">
                  <DollarSign className="h-3 w-3" />
                  Valor Fixo
                </TabsTrigger>
                <TabsTrigger value="percentage" className="text-xs gap-1">
                  <Percent className="h-3 w-3" />
                  Porcentagem
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Allocation Items */}
            <div className="space-y-4">
              {allocationItems.map((item) => {
                const Icon = item.icon;
                const percentValue = surplusAllocation[item.field] || 0;
                const fixedValue = fixedAmounts[item.field] || 0;
                const calculatedAmount = (surplus * percentValue) / 100;

                return (
                  <div key={item.field} className="space-y-2">
                    {/* Label Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'p-1.5 rounded-lg',
                          item.color.replace('bg-', 'bg-') + '/20'
                        )}>
                          <Icon className={cn('h-3.5 w-3.5', item.colorText)} />
                        </div>
                        <Label className="text-xs font-medium">{item.label}</Label>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] h-5">
                        {mode === 'fixed' 
                          ? formatCurrency(fixedValue || calculatedAmount, currency)
                          : formatPercentage(percentValue, 0)
                        }
                      </Badge>
                    </div>
                    
                    {/* Input based on mode */}
                    {mode === 'fixed' ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          value={fixedValue || ''}
                          onChange={(e) => handleFixedAmountChange(item.field, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="pl-9 h-10 text-sm font-mono"
                          data-testid={`surplus-${item.field}-input`}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[percentValue]}
                          onValueChange={([val]) => handleAllocationChange(item.field, val)}
                          max={100}
                          step={5}
                          className="flex-1"
                          data-testid={`surplus-${item.field}-slider`}
                        />
                        <div className="w-14 text-right">
                          <span className="font-mono text-sm">{percentValue}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Visual allocation bar */}
            <div className="h-3 rounded-full overflow-hidden flex bg-muted">
              {allocationItems.map((item) => {
                const value = mode === 'fixed' 
                  ? (totalFixedAmount > 0 ? ((fixedAmounts[item.field] || 0) / totalFixedAmount) * 100 : 0)
                  : surplusAllocation[item.field] || 0;
                if (value === 0) return null;
                return (
                  <div 
                    key={item.field}
                    className={cn(item.color, 'transition-all duration-300')} 
                    style={{ width: `${value}%` }} 
                  />
                );
              })}
            </div>

            {/* Summary */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total destinado:</span>
                <span className="font-mono font-semibold">
                  {mode === 'fixed' 
                    ? formatCurrency(totalFixedAmount, currency)
                    : formatCurrency(surplus, currency)
                  }
                </span>
              </div>
              {mode === 'fixed' && totalFixedAmount < surplus && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Restante:</span>
                  <span className="font-mono text-amber-400">
                    {formatCurrency(surplus - totalFixedAmount, currency)}
                  </span>
                </div>
              )}
              {mode === 'fixed' && totalFixedAmount > surplus && (
                <p className="text-[10px] text-rose-400">
                  ⚠️ Total excede a sobra disponível
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SurplusAllocation;
