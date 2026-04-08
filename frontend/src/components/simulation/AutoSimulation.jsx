import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, TrendingDown, BarChart3, ArrowRight, 
  CheckCircle2, Loader2, Sparkles 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, formatPercentage } from '../../services/financialEngine';
import { 
  optimizeExpenses, 
  optimizeInvestments, 
  generateBestCaseScenario 
} from '../../services/simulationEngine';
import { cn } from '../../lib/utils';

export const AutoSimulation = () => {
  const { 
    financialData, 
    settings, 
    projection, 
    currency,
    updateFinancialData,
    updateAllocation,
  } = useFinancial();
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);

  const config = useMemo(() => ({
    ...financialData,
    rates: settings.rates,
    inflation: settings.inflation || 0,
    taxes: settings.taxes || { enabled: true, fiiExempt: true },
  }), [financialData, settings]);

  const runSimulation = async (type) => {
    setIsSimulating(true);
    setActiveSimulation(type);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 800));

    let result;
    switch (type) {
      case 'optimize_expenses':
        result = optimizeExpenses(config);
        break;
      case 'optimize_investments':
        result = optimizeInvestments(config);
        break;
      case 'best_case':
        result = generateBestCaseScenario(config);
        break;
      default:
        result = null;
    }

    setSimulationResult(result);
    setIsSimulating(false);
  };

  const applyOptimization = () => {
    if (!simulationResult) return;

    switch (activeSimulation) {
      case 'optimize_expenses':
        if (simulationResult.optimizedExpenses) {
          updateFinancialData({
            variableExpenses: simulationResult.optimizedExpenses.map(e => ({
              ...e,
              amount: e.amount,
            })),
          });
        }
        break;
      case 'optimize_investments':
        if (simulationResult.recommendedAllocation) {
          updateAllocation(simulationResult.recommendedAllocation);
        }
        break;
      case 'best_case':
        if (simulationResult.config) {
          updateFinancialData({
            variableExpenses: simulationResult.config.variableExpenses,
            surplusAllocation: simulationResult.config.surplusAllocation,
          });
          updateAllocation(simulationResult.config.allocation);
        }
        break;
      default:
        break;
    }

    setSimulationResult(null);
    setActiveSimulation(null);
  };

  const closeDialog = () => {
    setSimulationResult(null);
    setActiveSimulation(null);
  };

  const simulations = [
    {
      id: 'optimize_expenses',
      title: 'Reduzir Gastos',
      description: 'Otimize seus gastos variáveis para aumentar a taxa de poupança',
      icon: TrendingDown,
      color: 'bg-rose-500',
    },
    {
      id: 'optimize_investments',
      title: 'Otimizar Investimentos',
      description: 'Rebalanceie sua carteira com base no seu perfil',
      icon: BarChart3,
      color: 'bg-blue-500',
    },
    {
      id: 'best_case',
      title: 'Melhor Cenário',
      description: 'Veja o máximo potencial de crescimento',
      icon: Sparkles,
      color: 'bg-amber-500',
    },
  ];

  return (
    <>
      <Card className="card-grid-border" data-testid="auto-simulation">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Simulação Automática
          </CardTitle>
          <CardDescription>
            Deixe a IA otimizar suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {simulations.map((sim) => {
            const Icon = sim.icon;
            const isActive = activeSimulation === sim.id && isSimulating;

            return (
              <motion.button
                key={sim.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => runSimulation(sim.id)}
                disabled={isSimulating}
                className={cn(
                  'w-full p-4 rounded-lg border border-border/40 text-left transition-all',
                  'hover:border-border/80 hover:bg-muted/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isActive && 'border-primary bg-primary/10'
                )}
                data-testid={`simulate-${sim.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', sim.color)}>
                    {isActive ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sim.title}</p>
                    <p className="text-xs text-muted-foreground">{sim.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </motion.button>
            );
          })}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={simulationResult !== null} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Resultado da Simulação
            </DialogTitle>
            <DialogDescription>
              {activeSimulation === 'optimize_expenses' && 'Otimização de gastos variáveis'}
              {activeSimulation === 'optimize_investments' && 'Otimização da carteira de investimentos'}
              {activeSimulation === 'best_case' && 'Melhor cenário possível'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Expense Optimization Result */}
            {activeSimulation === 'optimize_expenses' && simulationResult && (
              simulationResult.optimized ? (
                <>
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-sm font-medium text-emerald-400 mb-1">
                      Nova taxa de poupança: {simulationResult.newSavingsRate?.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Atual: {simulationResult.currentSavingsRate?.toFixed(1)}%
                    </p>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {simulationResult.suggestions?.map((sug, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/50 text-sm">
                          <p className="font-medium">{sug.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatCurrency(sug.currentAmount, currency)}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-emerald-400">{formatCurrency(sug.suggestedAmount, currency)}</span>
                            <Badge variant="secondary" className="ml-auto">
                              -{formatCurrency(sug.reduction, currency)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm">Seus gastos já estão otimizados!</p>
                </div>
              )
            )}

            {/* Investment Optimization Result */}
            {activeSimulation === 'optimize_investments' && simulationResult && (
              <>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-1">
                    Perfil recomendado: {simulationResult.profile}
                  </p>
                  {simulationResult.reasoning?.map((reason, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">• {reason}</p>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(simulationResult.recommendedAllocation || {}).map(([key, value]) => (
                    <div key={key} className="text-center p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase">{key}</p>
                      <p className="font-mono font-medium">{value}%</p>
                    </div>
                  ))}
                </div>
                {simulationResult.impact && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-sm">
                      Impacto estimado: <span className="font-mono text-emerald-400">
                        +{formatCurrency(simulationResult.impact.difference, currency)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatPercentage(simulationResult.impact.percentageGain)})
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Best Case Result */}
            {activeSimulation === 'best_case' && simulationResult && (
              <>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-400 mb-2">Mudanças sugeridas:</p>
                  {simulationResult.changes?.map((change, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">• {change}</p>
                  ))}
                </div>
                {simulationResult.impact && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Cenário atual</p>
                      <p className="font-mono font-medium">
                        {formatCurrency(simulationResult.impact.currentPatrimony, currency)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <p className="text-xs text-muted-foreground">Melhor cenário</p>
                      <p className="font-mono font-medium text-emerald-400">
                        {formatCurrency(simulationResult.impact.bestCasePatrimony, currency)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <p className="text-sm font-medium">
                    Ganho potencial: <span className="text-primary font-mono">
                      +{formatCurrency(simulationResult.impact?.difference || 0, currency)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({formatPercentage(simulationResult.impact?.percentageGain || 0)} a mais)
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Fechar
            </Button>
            {simulationResult?.optimized !== false && (
              <Button onClick={applyOptimization} data-testid="apply-optimization">
                Aplicar Mudanças
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutoSimulation;
