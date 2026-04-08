import React from 'react';
import { TrendingUp, Percent, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatPercentage } from '../../services/financialEngine';

const AllocationSlider = ({ label, value, onChange, color, description }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <Label className="text-sm font-medium">{label}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {formatPercentage(value, 0)}
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        max={100}
        step={5}
        className="cursor-pointer"
      />
    </div>
  );
};

const RateInput = ({ label, value, onChange, suffix = '% a.a.', tooltip }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm">{label}</Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="pr-14 font-mono text-sm"
          step="0.25"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  );
};

export const InvestmentForm = () => {
  const {
    financialData,
    updateAllocation,
    settings,
    updateRates,
  } = useFinancial();

  const allocation = financialData.allocation || { cdi: 40, selic: 20, cdb: 20, fii: 20 };
  const rates = settings.rates || { cdi: 13.75, cdiPercentage: 100, selic: 13.75, cdb: 12.5, fii: 0.8 };

  const totalAllocation = (allocation.cdi || 0) + (allocation.selic || 0) + (allocation.cdb || 0) + (allocation.fii || 0);
  const isValidAllocation = totalAllocation === 100;

  const handleAllocationChange = (type, value) => {
    const remaining = 100 - value;
    const otherTypes = ['cdi', 'selic', 'cdb', 'fii'].filter(t => t !== type);
    const currentOthers = otherTypes.reduce((sum, t) => sum + (allocation[t] || 0), 0);
    
    if (currentOthers === 0) {
      // Distribute remaining equally
      const each = Math.floor(remaining / 3);
      const updates = { [type]: value };
      otherTypes.forEach((t, i) => {
        updates[t] = i === 0 ? remaining - (each * 2) : each;
      });
      updateAllocation(updates);
    } else {
      // Proportionally adjust others
      const scale = remaining / currentOthers;
      const updates = { [type]: value };
      otherTypes.forEach(t => {
        updates[t] = Math.round((allocation[t] || 0) * scale);
      });
      updateAllocation(updates);
    }
  };

  return (
    <Card className="card-grid-border" data-testid="investment-form">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Investimentos
        </CardTitle>
        <CardDescription>
          Configure sua alocação e taxas de rendimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Allocation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Alocação da Carteira</h4>
            <Badge 
              variant={isValidAllocation ? 'default' : 'destructive'}
              className="font-mono text-xs"
            >
              {formatPercentage(totalAllocation, 0)} / 100%
            </Badge>
          </div>

          <div className="space-y-5">
            <AllocationSlider
              label="CDI"
              value={allocation.cdi || 0}
              onChange={(val) => handleAllocationChange('cdi', val)}
              color="bg-blue-500"
              description="Certificado de Depósito Interbancário. Baixo risco, alta liquidez."
            />
            <AllocationSlider
              label="Tesouro Selic"
              value={allocation.selic || 0}
              onChange={(val) => handleAllocationChange('selic', val)}
              color="bg-emerald-500"
              description="Título público federal. Risco soberano, liquidez diária."
            />
            <AllocationSlider
              label="CDB"
              value={allocation.cdb || 0}
              onChange={(val) => handleAllocationChange('cdb', val)}
              color="bg-purple-500"
              description="Certificado de Depósito Bancário. Risco de crédito, geralmente maior rentabilidade."
            />
            <AllocationSlider
              label="FII"
              value={allocation.fii || 0}
              onChange={(val) => handleAllocationChange('fii', val)}
              color="bg-amber-500"
              description="Fundos Imobiliários. Renda passiva mensal, exposição ao mercado imobiliário."
            />
          </div>

          {/* Allocation visual bar */}
          <div className="h-3 rounded-full overflow-hidden flex bg-muted">
            {allocation.cdi > 0 && (
              <div 
                className="bg-blue-500 transition-all duration-300" 
                style={{ width: `${allocation.cdi}%` }} 
              />
            )}
            {allocation.selic > 0 && (
              <div 
                className="bg-emerald-500 transition-all duration-300" 
                style={{ width: `${allocation.selic}%` }} 
              />
            )}
            {allocation.cdb > 0 && (
              <div 
                className="bg-purple-500 transition-all duration-300" 
                style={{ width: `${allocation.cdb}%` }} 
              />
            )}
            {allocation.fii > 0 && (
              <div 
                className="bg-amber-500 transition-all duration-300" 
                style={{ width: `${allocation.fii}%` }} 
              />
            )}
          </div>
        </div>

        {/* Rates Configuration */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="rates" className="border-none">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2 text-sm">
                <Percent className="h-4 w-4" />
                Configurar Taxas de Mercado
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <RateInput
                  label="Taxa CDI"
                  value={rates.cdi}
                  onChange={(val) => updateRates({ cdi: val })}
                  tooltip="Taxa CDI anual de referência"
                />
                <div className="space-y-2">
                  <Label className="text-sm">% do CDI</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={rates.cdiPercentage}
                      onChange={(e) => updateRates({ cdiPercentage: parseFloat(e.target.value) || 100 })}
                      className="pr-8 font-mono text-sm"
                      data-testid="cdi-percentage-input"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <RateInput
                  label="Tesouro Selic"
                  value={rates.selic}
                  onChange={(val) => updateRates({ selic: val })}
                  tooltip="Taxa anual do Tesouro Selic"
                />
                <RateInput
                  label="CDB"
                  value={rates.cdb}
                  onChange={(val) => updateRates({ cdb: val })}
                  tooltip="Taxa anual média do CDB"
                />
                <RateInput
                  label="FII (yield)"
                  value={rates.fii}
                  onChange={(val) => updateRates({ fii: val })}
                  suffix="% a.m."
                  tooltip="Dividend yield mensal médio dos FIIs"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default InvestmentForm;
