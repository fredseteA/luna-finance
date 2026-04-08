import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Shield, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatCurrency, formatPercentage } from '../../lib/financialCalculations';
import { cn } from '../../lib/utils';

const RISK_PROFILES = {
  conservative: {
    name: 'Conservador',
    description: 'Prioriza segurança e liquidez',
    color: 'bg-blue-500',
    allocation: { cdi: 50, selic: 30, cdb: 15, fii: 5 },
  },
  moderate: {
    name: 'Moderado',
    description: 'Equilíbrio entre segurança e crescimento',
    color: 'bg-emerald-500',
    allocation: { cdi: 35, selic: 25, cdb: 20, fii: 20 },
  },
  aggressive: {
    name: 'Arrojado',
    description: 'Foco em crescimento de longo prazo',
    color: 'bg-amber-500',
    allocation: { cdi: 20, selic: 15, cdb: 25, fii: 40 },
  },
};

export const SmartPortfolio = () => {
  const { 
    financialData, 
    updateAllocation,
    summary,
    currency,
    settings 
  } = useFinancial();

  // Analyze user profile
  const userProfile = useMemo(() => {
    const monthlyIncome = financialData.monthlyIncome || 0;
    const initialPatrimony = financialData.initialPatrimony || 0;
    const surplus = summary.monthlySurplus;
    const savingsRate = summary.savingsRate;
    const durationMonths = financialData.durationMonths || 12;

    // Calculate financial health score (0-100)
    let healthScore = 0;
    const metrics = [];

    // Savings rate contribution (max 30 points)
    const savingsPoints = Math.min(30, savingsRate * 1.5);
    healthScore += savingsPoints;
    metrics.push({
      name: 'Taxa de Poupança',
      value: savingsRate,
      max: 30,
      score: savingsPoints,
      status: savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'moderate' : 'poor',
    });

    // Emergency fund (patrimony vs 6 months expenses) (max 25 points)
    const monthlyExpenses = monthlyIncome - surplus;
    const emergencyMonths = monthlyExpenses > 0 ? initialPatrimony / monthlyExpenses : 0;
    const emergencyPoints = Math.min(25, emergencyMonths * 4);
    healthScore += emergencyPoints;
    metrics.push({
      name: 'Reserva de Emergência',
      value: emergencyMonths,
      max: 25,
      score: emergencyPoints,
      status: emergencyMonths >= 6 ? 'good' : emergencyMonths >= 3 ? 'moderate' : 'poor',
      label: `${emergencyMonths.toFixed(1)} meses`,
    });

    // Investment horizon (max 25 points)
    const horizonPoints = Math.min(25, durationMonths * 0.5);
    healthScore += horizonPoints;
    metrics.push({
      name: 'Horizonte de Investimento',
      value: durationMonths,
      max: 25,
      score: horizonPoints,
      status: durationMonths >= 36 ? 'good' : durationMonths >= 12 ? 'moderate' : 'poor',
      label: `${durationMonths} meses`,
    });

    // Diversification potential (based on surplus) (max 20 points)
    const diversificationPoints = Math.min(20, (surplus / 1000) * 2);
    healthScore += diversificationPoints;
    metrics.push({
      name: 'Capacidade de Diversificação',
      value: surplus,
      max: 20,
      score: diversificationPoints,
      status: surplus >= 3000 ? 'good' : surplus >= 1000 ? 'moderate' : 'poor',
    });

    // Determine risk profile based on metrics
    let recommendedProfile;
    if (emergencyMonths < 3 || savingsRate < 10) {
      recommendedProfile = 'conservative';
    } else if (durationMonths >= 36 && savingsRate >= 25 && emergencyMonths >= 6) {
      recommendedProfile = 'aggressive';
    } else {
      recommendedProfile = 'moderate';
    }

    return {
      healthScore: Math.round(healthScore),
      metrics,
      recommendedProfile,
      hasData: monthlyIncome > 0,
    };
  }, [financialData, summary]);

  // Generate smart suggestions
  const smartSuggestions = useMemo(() => {
    const suggestions = [];
    const { metrics, recommendedProfile } = userProfile;

    // Check each metric and suggest improvements
    metrics.forEach(metric => {
      if (metric.status === 'poor') {
        switch (metric.name) {
          case 'Taxa de Poupança':
            suggestions.push({
              type: 'warning',
              title: 'Aumente sua Taxa de Poupança',
              message: `Com ${formatPercentage(metric.value)} de poupança, considere reduzir gastos variáveis ou renegociar custos fixos para atingir pelo menos 20%.`,
              action: 'Revisar despesas',
            });
            break;
          case 'Reserva de Emergência':
            suggestions.push({
              type: 'alert',
              title: 'Priorize sua Reserva',
              message: `Você tem apenas ${metric.label} de reserva. Recomendamos destinar 100% da sobra para reserva até atingir 6 meses de despesas.`,
              action: 'Ajustar destino da sobra',
            });
            break;
          default:
            break;
        }
      }
    });

    // Portfolio-specific suggestions
    const profile = RISK_PROFILES[recommendedProfile];
    const currentAllocation = financialData.allocation || { cdi: 25, selic: 25, cdb: 25, fii: 25 };
    
    // Check if FII allocation is too high for short horizon
    if (financialData.durationMonths < 24 && currentAllocation.fii > 20) {
      suggestions.push({
        type: 'info',
        title: 'Reduza Exposição a FII',
        message: 'Para horizontes menores que 2 anos, FIIs podem apresentar volatilidade. Considere aumentar Selic e CDI.',
        action: 'Rebalancear carteira',
      });
    }

    // Check if too conservative for long horizon
    if (financialData.durationMonths > 36 && currentAllocation.cdi + currentAllocation.selic > 70) {
      suggestions.push({
        type: 'info',
        title: 'Considere Mais Diversificação',
        message: 'Com um horizonte longo, você pode aproveitar rendimentos maiores com CDB e FII.',
        action: 'Ver carteira sugerida',
      });
    }

    return suggestions;
  }, [userProfile, financialData]);

  const applyRecommendedPortfolio = () => {
    const profile = RISK_PROFILES[userProfile.recommendedProfile];
    updateAllocation(profile.allocation);
  };

  const profile = RISK_PROFILES[userProfile.recommendedProfile];

  if (!userProfile.hasData) {
    return (
      <Card className="card-grid-border" data-testid="smart-portfolio">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Carteira Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Configure seus dados financeiros para receber sugestões personalizadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-grid-border" data-testid="smart-portfolio">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Carteira Inteligente
        </CardTitle>
        <CardDescription>
          Sugestões personalizadas baseadas no seu perfil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Saúde Financeira</p>
            <Badge 
              variant={userProfile.healthScore >= 70 ? 'default' : userProfile.healthScore >= 40 ? 'secondary' : 'destructive'}
              className="font-mono"
            >
              {userProfile.healthScore}/100
            </Badge>
          </div>
          <Progress value={userProfile.healthScore} className="h-2" />
          <div className="grid grid-cols-2 gap-2">
            {userProfile.metrics.map((metric) => (
              <div 
                key={metric.name}
                className="flex items-center gap-2 text-xs"
              >
                {metric.status === 'good' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : metric.status === 'moderate' ? (
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-rose-400" />
                )}
                <span className="text-muted-foreground">{metric.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Profile */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${profile.color}`} />
              <span className="font-medium">Perfil Recomendado: {profile.name}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              IA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{profile.description}</p>
          
          {/* Suggested allocation */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {Object.entries(profile.allocation).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-xs text-muted-foreground uppercase">{key}</p>
                <p className="font-mono text-sm font-medium">{value}%</p>
              </div>
            ))}
          </div>

          <Button 
            onClick={applyRecommendedPortfolio}
            variant="outline"
            className="w-full"
            data-testid="apply-recommended-portfolio"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Aplicar Carteira Recomendada
          </Button>
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Recomendações
            </p>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2 pr-3">
                {smartSuggestions.map((suggestion, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      'p-3 rounded-lg border',
                      suggestion.type === 'alert' && 'bg-rose-500/10 border-rose-500/20',
                      suggestion.type === 'warning' && 'bg-amber-500/10 border-amber-500/20',
                      suggestion.type === 'info' && 'bg-blue-500/10 border-blue-500/20',
                    )}
                  >
                    <p className="text-sm font-medium mb-1">{suggestion.title}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.message}</p>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* All Profiles */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Outros Perfis</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(RISK_PROFILES).map(([key, prof]) => (
              <button
                key={key}
                onClick={() => updateAllocation(prof.allocation)}
                className={cn(
                  'p-2 rounded-lg border text-center transition-colors hover:bg-muted/50',
                  key === userProfile.recommendedProfile && 'border-primary bg-primary/10'
                )}
                data-testid={`profile-${key}`}
              >
                <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${prof.color}`} />
                <p className="text-xs font-medium">{prof.name}</p>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartPortfolio;
