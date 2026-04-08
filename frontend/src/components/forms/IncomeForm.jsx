import React from 'react';
import { DollarSign, Calendar, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useFinancial } from '../../contexts/FinancialContext';
import { CURRENCIES } from '../../services/financialEngine';

export const IncomeForm = () => {
  const { 
    financialData, 
    updateFinancialData, 
    currency 
  } = useFinancial();

  const currencySymbol = CURRENCIES[currency]?.symbol || 'R$';

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    updateFinancialData({ [field]: numValue });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const durations = [6, 12, 18, 24, 36, 48, 60];

  return (
    <Card className="card-grid-border" data-testid="income-form">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Configuração Base
        </CardTitle>
        <CardDescription>
          Defina sua renda, patrimônio inicial e período de análise
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Monthly Income */}
        <div className="space-y-2">
          <Label htmlFor="monthly-income" className="text-sm font-medium">
            Renda Mensal Líquida
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {currencySymbol}
            </span>
            <Input
              id="monthly-income"
              type="number"
              value={financialData.monthlyIncome || ''}
              onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
              className="pl-10 font-mono"
              placeholder="0,00"
              data-testid="monthly-income-input"
            />
          </div>
        </div>

        {/* Initial Patrimony */}
        <div className="space-y-2">
          <Label htmlFor="initial-patrimony" className="text-sm font-medium">
            Patrimônio Inicial
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {currencySymbol}
            </span>
            <Input
              id="initial-patrimony"
              type="number"
              value={financialData.initialPatrimony || ''}
              onChange={(e) => handleInputChange('initialPatrimony', e.target.value)}
              className="pl-10 font-mono"
              placeholder="0,00"
              data-testid="initial-patrimony-input"
            />
          </div>
        </div>

        {/* Start Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Ano Inicial
            </Label>
            <Select
              value={financialData.startDate?.slice(0, 4) || currentYear.toString()}
              onValueChange={(year) => {
                const month = financialData.startDate?.slice(5, 7) || '01';
                updateFinancialData({ startDate: `${year}-${month}` });
              }}
            >
              <SelectTrigger data-testid="start-year-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Mês Inicial</Label>
            <Select
              value={financialData.startDate?.slice(5, 7) || '01'}
              onValueChange={(month) => {
                const year = financialData.startDate?.slice(0, 4) || currentYear.toString();
                updateFinancialData({ startDate: `${year}-${month}` });
              }}
            >
              <SelectTrigger data-testid="start-month-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = (i + 1).toString().padStart(2, '0');
                  const monthName = new Date(2024, i, 1).toLocaleDateString('pt-BR', { month: 'short' });
                  return (
                    <SelectItem key={month} value={month}>
                      {monthName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5" />
            Duração (meses)
          </Label>
          <Select
            value={financialData.durationMonths?.toString() || '12'}
            onValueChange={(val) => updateFinancialData({ durationMonths: parseInt(val) })}
          >
            <SelectTrigger data-testid="duration-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durations.map(d => (
                <SelectItem key={d} value={d.toString()}>
                  {d} meses ({(d / 12).toFixed(1)} anos)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reinvest FII */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Reinvestir dividendos FII</Label>
            <p className="text-xs text-muted-foreground">
              Automaticamente reinvestir rendimentos de FIIs
            </p>
          </div>
          <Switch
            checked={financialData.reinvestFii ?? true}
            onCheckedChange={(checked) => updateFinancialData({ reinvestFii: checked })}
            data-testid="reinvest-fii-switch"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeForm;
