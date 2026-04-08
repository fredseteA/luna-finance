import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Calendar, TrendingUp, Zap, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, formatPercentage } from '../../services/financialEngine';
import { simulateAdditionalContribution } from '../../services/simulationEngine';

export const FinancialGoal = () => {
  const { financialData, settings, summary, projection, currency } = useFinancial();
  const [targetAmount, setTargetAmount] = useState(100000);
  const [additionalContribution, setAdditionalContribution] = useState(100);

  // Calculate time to reach goal
  const goalAnalysis = useMemo(() => {
    if (!projection || projection.length === 0 || summary.monthlySurplus <= 0) {
      return null;
    }

    const { initialPatrimony } = financialData;
    const investmentPercentage = (financialData.surplusAllocation?.investments || 100) / 100;
    const monthlyContribution = summary.monthlySurplus * investmentPercentage;
    
    // Calculate weighted average monthly return
    const allocation = financialData.allocation || { cdi: 25, selic: 25, cdb: 25, fii: 25 };
    const rates = settings.rates;
    
    const annualToMonthly = (rate) => Math.pow(1 + rate / 100, 1 / 12) - 1;
    
    const weightedMonthlyReturn = 
      (allocation.cdi / 100) * annualToMonthly(rates.cdi * (rates.cdiPercentage / 100)) +
      (allocation.selic / 100) * annualToMonthly(rates.selic) +
      (allocation.cdb / 100) * annualToMonthly(rates.cdb) +
      (allocation.fii / 100) * (rates.fii / 100);

    // Simulate month by month
    let currentPatrimony = initialPatrimony;
    let months = 0;
    const maxMonths = 600;

    while (currentPatrimony < targetAmount && months < maxMonths) {
      currentPatrimony = currentPatrimony * (1 + weightedMonthlyReturn) + monthlyContribution;
      months++;
    }

    if (months >= maxMonths) {
      return {
        reachable: false,
        months: Infinity,
        reason: 'Meta muito alta para as condições atuais',
      };
    }

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);

    // Calculate progress
    const progress = Math.min(100, (initialPatrimony / targetAmount) * 100);

    return {
      reachable: true,
      months,
      years: (months / 12).toFixed(1),
      targetDate,
      targetDateFormatted: targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      progress,
      monthlyContribution,
      remainingAmount: targetAmount - initialPatrimony,
    };
  }, [financialData, settings.rates, summary.monthlySurplus, targetAmount, projection]);

  // Simulate additional contribution impact
  const contributionImpact = useMemo(() => {
    if (!goalAnalysis?.reachable || additionalContribution <= 0) return null;

    const currentMonths = goalAnalysis.months;
    const { initialPatrimony } = financialData;
    const investmentPercentage = (financialData.surplusAllocation?.investments || 100) / 100;
    const newMonthlyContribution = (summary.monthlySurplus + additionalContribution) * investmentPercentage;
    
    const allocation = financialData.allocation || { cdi: 25, selic: 25, cdb: 25, fii: 25 };
    const rates = settings.rates;
    const annualToMonthly = (rate) => Math.pow(1 + rate / 100, 1 / 12) - 1;
    
    const weightedMonthlyReturn = 
      (allocation.cdi / 100) * annualToMonthly(rates.cdi * (rates.cdiPercentage / 100)) +
      (allocation.selic / 100) * annualToMonthly(rates.selic) +
      (allocation.cdb / 100) * annualToMonthly(rates.cdb) +
      (allocation.fii / 100) * (rates.fii / 100);

    let currentPatrimony = initialPatrimony;
    let months = 0;

    while (currentPatrimony < targetAmount && months < 600) {
      currentPatrimony = currentPatrimony * (1 + weightedMonthlyReturn) + newMonthlyContribution;
      months++;
    }

    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + months);

    return {
      newMonths: months,
      monthsSaved: currentMonths - months,
      newDate,
      newDateFormatted: newDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    };
  }, [goalAnalysis, additionalContribution, financialData, settings.rates, summary.monthlySurplus, targetAmount]);

  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€';

  return (
    <Card className="card-grid-border" data-testid="financial-goal">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Meta Financeira
        </CardTitle>
        <CardDescription>
          Defina seu objetivo e veja quando vai alcançá-lo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Target Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="target-amount">Valor da Meta</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {currencySymbol}
            </span>
            <Input
              id="target-amount"
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
              className="pl-10 font-mono"
              data-testid="goal-target-input"
            />
          </div>
          {/* Quick select buttons */}
          <div className="flex flex-wrap gap-2">
            {[50000, 100000, 250000, 500000, 1000000].map(value => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                className="text-xs font-mono"
                onClick={() => setTargetAmount(value)}
              >
                {formatCurrency(value, currency)}
              </Button>
            ))}
          </div>
        </div>

        {/* Goal Analysis */}
        {goalAnalysis ? (
          goalAnalysis.reachable ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso atual</span>
                  <span className="font-mono">{goalAnalysis.progress.toFixed(1)}%</span>
                </div>
                <Progress value={goalAnalysis.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(financialData.initialPatrimony, currency)}</span>
                  <span>{formatCurrency(targetAmount, currency)}</span>
                </div>
              </div>

              {/* Time Estimate */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo estimado</p>
                    <p className="text-2xl font-mono font-bold">
                      {goalAnalysis.months} meses
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({goalAnalysis.years} anos)
                      </span>
                    </p>
                    <p className="text-sm text-primary">
                      Meta em {goalAnalysis.targetDateFormatted}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Contribution Simulator */}
              <div className="space-y-3 pt-3 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <Label className="text-sm font-medium">Acelere sua meta</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  E se você aumentasse {formatCurrency(additionalContribution, currency)}/mês?
                </p>
                <Slider
                  value={[additionalContribution]}
                  onValueChange={([val]) => setAdditionalContribution(val)}
                  min={50}
                  max={2000}
                  step={50}
                  className="cursor-pointer"
                  data-testid="additional-contribution-slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(50, currency)}</span>
                  <span className="font-mono font-medium text-foreground">
                    +{formatCurrency(additionalContribution, currency)}/mês
                  </span>
                  <span>{formatCurrency(2000, currency)}</span>
                </div>

                {contributionImpact && contributionImpact.monthsSaved > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Economia de {contributionImpact.monthsSaved} meses!
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nova data: {contributionImpact.newDateFormatted}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Monthly Info */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Aporte mensal atual</p>
                  <p className="font-mono font-medium">
                    {formatCurrency(goalAnalysis.monthlyContribution, currency)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Falta acumular</p>
                  <p className="font-mono font-medium">
                    {formatCurrency(goalAnalysis.remainingAmount, currency)}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-6">
              <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{goalAnalysis.reason}</p>
              <p className="text-xs mt-1">Aumente sua taxa de poupança ou reduza a meta</p>
            </div>
          )
        ) : (
          <div className="text-center py-6">
            <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Configure sua renda e despesas para calcular
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialGoal;
