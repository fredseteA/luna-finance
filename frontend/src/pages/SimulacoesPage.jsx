import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, TrendingDown, AlertTriangle, 
  DollarSign, Clock 
} from 'lucide-react';
import { AutoSimulation } from '../components/simulation/AutoSimulation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useFinancial } from '../contexts/FinancialContext';
import { simulateAdditionalContribution } from '../services/simulationEngine';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const SimulacoesPage = () => {
  const { mounted, financialData, settings, formatCurrency } = useFinancial();
  const [additionalAmount, setAdditionalAmount] = useState(500);
  const [incomeReduction, setIncomeReduction] = useState(30);

  const config = useMemo(() => ({
    ...financialData,
    rates: settings.rates,
  }), [financialData, settings.rates]);

  const additionalSimulation = useMemo(() => {
    if (financialData.monthlyIncome <= 0) return null;
    return simulateAdditionalContribution(config, additionalAmount);
  }, [config, additionalAmount, financialData.monthlyIncome]);

  const incomeLossSimulation = useMemo(() => {
    if (financialData.monthlyIncome <= 0) return null;
    const reducedIncome = financialData.monthlyIncome * (1 - incomeReduction / 100);
    const totalExpenses = 
      financialData.fixedCosts.reduce((sum, c) => sum + (c.amount || 0), 0) +
      financialData.variableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    return {
      originalIncome: financialData.monthlyIncome,
      reducedIncome,
      totalExpenses,
      newSurplus: reducedIncome - totalExpenses,
      survivableMonths: totalExpenses > 0 ? financialData.initialPatrimony / totalExpenses : Infinity,
    };
  }, [financialData, incomeReduction]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="pt-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Simulações
        </h1>
        <p className="text-sm text-muted-foreground">Teste diferentes cenários</p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="auto" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-12">
          <TabsTrigger value="auto" className="text-xs gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Auto
          </TabsTrigger>
          <TabsTrigger value="contribution" className="text-xs gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            Aporte
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Risco
          </TabsTrigger>
        </TabsList>

        {/* Auto Tab */}
        <TabsContent value="auto" className="mt-4">
          <motion.div variants={itemVariants}>
            <AutoSimulation />
          </motion.div>
        </TabsContent>

        {/* Contribution Tab */}
        <TabsContent value="contribution" className="mt-4 space-y-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Aporte Extra Mensal
                </CardTitle>
                <CardDescription className="text-xs">
                  Simule o impacto de investir mais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Valor adicional</Label>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(additionalAmount)}
                    </Badge>
                  </div>
                  <Slider
                    value={[additionalAmount]}
                    onValueChange={(v) => setAdditionalAmount(v[0])}
                    min={100}
                    max={5000}
                    step={100}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>R$ 100</span>
                    <span>R$ 5.000</span>
                  </div>
                </div>

                {additionalSimulation && (
                  <div className="space-y-2 pt-3 border-t border-border/40">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                        <p className="text-[10px] text-muted-foreground">Atual</p>
                        <p className="font-mono text-sm font-medium">
                          {formatCurrency(additionalSimulation.baseFinalPatrimony)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <p className="text-[10px] text-muted-foreground">Com aporte</p>
                        <p className="font-mono text-sm font-medium text-emerald-400">
                          {formatCurrency(additionalSimulation.modifiedFinalPatrimony)}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                      <p className="text-xs font-medium">
                        Ganho: <span className="text-primary font-mono">
                          +{formatCurrency(additionalSimulation.difference)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          ({additionalSimulation.percentageGain.toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="mt-4 space-y-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Perda de Renda
                </CardTitle>
                <CardDescription className="text-xs">
                  Teste sua resiliência financeira
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Redução</Label>
                    <Badge variant="outline" className="font-mono">
                      -{incomeReduction}%
                    </Badge>
                  </div>
                  <Slider
                    value={[incomeReduction]}
                    onValueChange={(v) => setIncomeReduction(v[0])}
                    min={10}
                    max={100}
                    step={10}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>-10%</span>
                    <span>-100%</span>
                  </div>
                </div>

                {incomeLossSimulation && (
                  <div className="space-y-2 pt-3 border-t border-border/40">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <p className="text-[10px] text-muted-foreground">Renda atual</p>
                        <p className="font-mono text-sm font-medium">
                          {formatCurrency(incomeLossSimulation.originalIncome)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                        <p className="text-[10px] text-muted-foreground">Reduzida</p>
                        <p className="font-mono text-sm font-medium text-amber-400">
                          {formatCurrency(incomeLossSimulation.reducedIncome)}
                        </p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg border text-center ${
                      incomeLossSimulation.newSurplus >= 0 
                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                        : 'bg-rose-500/10 border-rose-500/20'
                    }`}>
                      <p className="text-xs font-medium">
                        Sobra: <span className={`font-mono ${
                          incomeLossSimulation.newSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {formatCurrency(incomeLossSimulation.newSurplus)}
                        </span>
                      </p>
                      {incomeLossSimulation.newSurplus < 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />
                          Reserva dura {incomeLossSimulation.survivableMonths.toFixed(1)} meses
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SimulacoesPage;
