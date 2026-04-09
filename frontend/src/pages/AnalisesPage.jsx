import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { ExplainableScore } from '../components/score/ExplainableScore';
import { SuggestionsPanel } from '../components/suggestions/SuggestionsPanel';
import { Card, CardContent } from '../components/ui/card';
import { useFinancial } from '../contexts/FinancialContext';
import { usePageVariants } from '../lib/animationVariants';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Pulse = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />
);

const AnaliseSkeleton = () => (
  <div className="space-y-4 pb-4">
    <div className="pt-2 space-y-2">
      <Pulse className="h-7 w-40" />
      <Pulse className="h-4 w-56" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[...Array(4)].map((_, i) => <Pulse key={i} className="h-20 rounded-xl" />)}
    </div>
    <Pulse className="h-48 rounded-xl" />
    <Pulse className="h-64 rounded-xl" />
  </div>
);

// ─── KPI card reutilizável ────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, colorClass, borderClass, icon: Icon }) => (
  <div className={`p-3 rounded-xl ${colorClass} border ${borderClass}`}>
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-xl font-mono font-bold leading-tight">{value}</p>
    {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
  </div>
);

// ─── Banner de sugestão de aportes variáveis ──────────────────────────────────

/**
 * TieredContributionBanner — aparece na aba de Análises quando a projeção detecta
 * meses em que a sobra aumenta (custos fixos encerrando) mas o aporte não muda.
 * Sugere usar o recurso de Aportes por Período.
 */
const TieredContributionBanner = ({ projection, financialData, formatCurrency }) => {
  const tiers = financialData.tieredContributions || [];

  // Só sugere se não há faixas configuradas
  if (tiers.length > 0) return null;

  // Detecta meses onde a sobra aumenta significativamente (>10% acima do mês 1)
  if (!projection || projection.length < 2) return null;

  const baseContribution = projection[0]?.surplusForInvestments ?? 0;
  const improvedMonths = projection.filter(
    (m) => m.surplusForInvestments > baseContribution * 1.1
  );

  if (improvedMonths.length === 0) return null;

  const firstImproved = improvedMonths[0];
  const gain = firstImproved.surplusForInvestments - baseContribution;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
      <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-400">Oportunidade detectada</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          A partir do mês {firstImproved.month} ({firstImproved.monthLabel}) sua sobra aumenta
          em <span className="font-semibold text-foreground">{formatCurrency(gain)}</span>.
          Configure Aportes por Período em Investimentos para capturar esse crescimento
          automaticamente na projeção.
        </p>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const AnalisesPage = () => {
  const {
    mounted,
    scoreBreakdown,
    summary,
    financialData,
    formatCurrency,
    projection,
  } = useFinancial();

  const { container, item } = usePageVariants();

  // Skeleton enquanto Firebase carrega
  if (!mounted) return <AnaliseSkeleton />;

  const hasData = financialData.monthlyIncome > 0;

  // Grade legível
  const gradeLabel = {
    A: 'Excelente',
    B: 'Bom',
    C: 'Regular',
    D: 'Atenção',
    F: 'Crítico',
  }[scoreBreakdown.grade] ?? '—';

  const gradeColor = {
    A: 'text-emerald-400',
    B: 'text-blue-400',
    C: 'text-amber-400',
    D: 'text-orange-400',
    F: 'text-red-400',
  }[scoreBreakdown.grade] ?? 'text-muted-foreground';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-4"
    >
      {/* Header contextual — sem ícone redundante (igual ao padrão das outras páginas) */}
      <motion.div variants={item} className="pt-2">
        <h1 className="text-xl font-bold">
          {hasData ? 'Sua saúde financeira' : 'Análises'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {hasData
            ? `Score ${scoreBreakdown.totalScore}/${scoreBreakdown.maxScore} · ${gradeLabel}`
            : 'Configure seus dados para ver análises'}
        </p>
      </motion.div>

      {!hasData ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="text-center py-10">
              <Award className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium mb-1">Configure seus dados</p>
              <p className="text-xs text-muted-foreground">Acesse Planejamento para começar</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* KPIs — 4 métricas distintas sem repetição */}
          <motion.div variants={item} className="grid grid-cols-2 gap-2">
            <StatCard
              label="Score"
              value={`${scoreBreakdown.totalScore}`}
              sub={`de ${scoreBreakdown.maxScore} pontos · ${gradeLabel}`}
              colorClass="bg-primary/10 text-primary"
              borderClass="border-primary/20"
              icon={Award}
            />
            <StatCard
              label="Poupança"
              value={`${summary.savingsRate.toFixed(1)}%`}
              sub={summary.savingsRate >= 20 ? 'acima da meta' : 'meta: 20%'}
              colorClass="bg-emerald-500/10 text-emerald-400"
              borderClass="border-emerald-500/20"
              icon={TrendingUp}
            />
            <StatCard
              label="Crescimento"
              value={`${summary.totalGrowthPercentage.toFixed(1)}%`}
              sub="no período projetado"
              colorClass="bg-blue-500/10 text-blue-400"
              borderClass="border-blue-500/20"
              icon={TrendingUp}
            />
            <StatCard
              label="Melhorias"
              value={scoreBreakdown.improvements?.length || 0}
              sub={
                scoreBreakdown.improvements?.length > 0
                  ? `+${scoreBreakdown.improvements.reduce((s, i) => s + i.potentialGain, 0)} pts potenciais`
                  : 'tudo em ordem'
              }
              colorClass="bg-amber-500/10 text-amber-400"
              borderClass="border-amber-500/20"
              icon={AlertCircle}
            />
          </motion.div>

          {/* Banner de oportunidade — aportes variáveis */}
          <motion.div variants={item}>
            <TieredContributionBanner
              projection={projection}
              financialData={financialData}
              formatCurrency={formatCurrency}
            />
          </motion.div>

          {/* Score detalhado */}
          <motion.div variants={item}>
            <ExplainableScore />
          </motion.div>

          {/* Sugestões */}
          <motion.div variants={item}>
            <SuggestionsPanel />
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default AnalisesPage;