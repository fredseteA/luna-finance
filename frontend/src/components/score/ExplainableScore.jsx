import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Gauge, TrendingUp, TrendingDown, Shield, PieChart, 
  Calendar, ArrowUp, Info, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useFinancial } from '../../contexts/FinancialContext';
import { calculateScoreBreakdown } from '../../services/simulationEngine';
import { cn } from '../../lib/utils';

const ICONS = {
  'piggy-bank': TrendingUp,
  'shield': Shield,
  'calendar': Calendar,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
};

const STATUS_COLORS = {
  excellent: 'text-emerald-400',
  good: 'text-blue-400',
  fair: 'text-amber-400',
  poor: 'text-rose-400',
};

const STATUS_BG = {
  excellent: 'bg-emerald-500/10',
  good: 'bg-blue-500/10',
  fair: 'bg-amber-500/10',
  poor: 'bg-rose-500/10',
};

export const ExplainableScore = () => {
  const { financialData, settings, projection } = useFinancial();

  const config = useMemo(() => ({
    ...financialData,
    rates: settings.rates,
  }), [financialData, settings.rates]);

  const scoreData = useMemo(() => {
    return calculateScoreBreakdown(config, projection);
  }, [config, projection]);

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-emerald-400 bg-emerald-500/20';
      case 'B': return 'text-blue-400 bg-blue-500/20';
      case 'C': return 'text-amber-400 bg-amber-500/20';
      case 'D': return 'text-orange-400 bg-orange-500/20';
      case 'F': return 'text-rose-400 bg-rose-500/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (financialData.monthlyIncome <= 0) {
    return (
      <Card className="card-grid-border" data-testid="explainable-score">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Score Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Gauge className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Configure seus dados para calcular o score
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-grid-border" data-testid="explainable-score">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Score Financeiro Explicável
        </CardTitle>
        <CardDescription>
          Entenda o que está afetando sua saúde financeira
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Main Score */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-mono font-bold">{scoreData.totalScore}</p>
            <p className="text-sm text-muted-foreground">de {scoreData.maxScore} pontos</p>
          </div>
          <div className={cn(
            'h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold',
            getGradeColor(scoreData.grade)
          )}>
            {scoreData.grade}
          </div>
        </div>

        <Progress value={(scoreData.totalScore / scoreData.maxScore) * 100} className="h-2" />

        {/* Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Detalhamento</p>
          {scoreData.breakdown.map((item, idx) => {
            const Icon = ICONS[item.icon] || Info;
            return (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  'p-3 rounded-lg border border-border/40',
                  STATUS_BG[item.status]
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', STATUS_COLORS[item.status])} />
                    <span className="font-medium text-sm">{item.category}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {item.score}/{item.maxScore}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <Progress 
                  value={(item.score / item.maxScore) * 100} 
                  className="h-1 mt-2" 
                />
              </motion.div>
            );
          })}
        </div>

        {/* Improvements */}
        {scoreData.improvements.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border/40">
            <p className="text-sm font-medium flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-primary" />
              Como Melhorar
            </p>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2 pr-3">
                {scoreData.improvements.map((imp, idx) => (
                  <motion.div
                    key={imp.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{imp.category}</span>
                      <Badge variant="secondary" className="text-xs text-emerald-400">
                        +{imp.potentialGain} pts
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{imp.action}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-[10px]',
                          imp.difficulty === 'easy' && 'text-emerald-400',
                          imp.difficulty === 'medium' && 'text-amber-400',
                          imp.difficulty === 'hard' && 'text-rose-400'
                        )}
                      >
                        {imp.difficulty === 'easy' ? 'Fácil' : imp.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-[10px]',
                          imp.impact === 'high' && 'text-emerald-400',
                          imp.impact === 'medium' && 'text-amber-400',
                          imp.impact === 'low' && 'text-muted-foreground'
                        )}
                      >
                        Impacto {imp.impact === 'high' ? 'Alto' : imp.impact === 'medium' ? 'Médio' : 'Baixo'}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExplainableScore;
