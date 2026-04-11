/**
 * InvestimentosPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Painel consultivo de investimentos + formulários de configuração.
 *
 * Estrutura da página:
 *  1. Visão Geral         — KPIs principais + retorno ponderado
 *  2. Alertas             — avisos gerados pelo motor de insights
 *  3. Oportunidades       — eventos detectados (fim de parcela, sobra livre etc.)
 *  4. Marcos projetados   — quando o patrimônio vai atingir cada objetivo
 *  5. Score de comportamento — avalia como o usuário investe, não só os números
 *  6. Alocação da carteira— conselho + configuração (InvestmentForm)
 *  7. Destino da Sobra    — SurplusAllocation
 *  8. Aportes por período — TieredContributions
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, BarChart3, PiggyBank, AlertTriangle,
  Sparkles, Target, Shield, ShieldCheck, Zap,
  ChevronDown, ChevronUp, Info, CheckCircle2,
  XCircle, TrendingDown, PieChart, Building2,
  Percent, Lock, ArrowRight, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { InvestmentForm } from '../components/forms/InvestmentForm';
import { SurplusAllocation } from '../components/forms/SurplusAllocation';
import { TieredContributions } from '../components/forms/TieredContributions';
import { PortfolioChart } from '../components/charts/PortfolioChart';
import { useFinancial } from '../contexts/FinancialContext';
import { InvestimentosSkeleton } from '../components/dashboard/InvestimentosSkeleton';
import { InvestimentosEmpty } from '../components/dashboard/InvestimentosEmpty';
import { usePageVariants } from '../lib/animationVariants';
import {
  buildInsightReport,
} from '../services/investmentInsights';

// ─── Mapa de ícones (strings → componentes Lucide) ────────────────────────────

const ICON_MAP = {
  AlertTriangle, TrendingDown, Shield, ShieldCheck, PieChart,
  Building2, Percent, Lock, XCircle, Sparkles, TrendingUp,
  Target, Zap, CheckCircle2, Info,
};

const DynIcon = ({ name, className }) => {
  const Icon = ICON_MAP[name] || Info;
  return <Icon className={className} />;
};

// ─── Paleta de severidade / urgência ─────────────────────────────────────────

const SEVERITY_STYLE = {
  critical: {
    border: 'border-rose-500/30',
    bg:     'bg-rose-500/8',
    icon:   'text-rose-400',
    badge:  'bg-rose-500/20 text-rose-400',
    label:  'Crítico',
  },
  warning: {
    border: 'border-amber-500/30',
    bg:     'bg-amber-500/8',
    icon:   'text-amber-400',
    badge:  'bg-amber-500/20 text-amber-400',
    label:  'Atenção',
  },
  info: {
    border: 'border-blue-500/30',
    bg:     'bg-blue-500/8',
    icon:   'text-blue-400',
    badge:  'bg-blue-500/20 text-blue-400',
    label:  'Info',
  },
};

const URGENCY_STYLE = {
  high:   SEVERITY_STYLE.critical,
  medium: SEVERITY_STYLE.warning,
  low:    SEVERITY_STYLE.info,
};

// ─── Componentes de apresentação ─────────────────────────────────────────────

/**
 * KpiCard — cartão de métrica com label explicativo.
 */
const KpiCard = ({ label, value, sub, colorClass, borderClass, icon: Icon, tooltip }) => (
  <motion.div
    whileTap={{ scale: 0.97 }}
    className={`p-3 rounded-xl border ${colorClass} ${borderClass} relative`}
  >
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</span>
    </div>
    <p className="text-lg font-mono font-bold leading-tight">{value}</p>
    {sub && <p className="text-[10px] opacity-55 mt-0.5 leading-snug">{sub}</p>}
  </motion.div>
);

/**
 * ExpandableCard — card com conteúdo colapsável.
 * Usado para alertas e oportunidades para não poluir a página.
 */
const ExpandableCard = ({ title, summary, detail, action, style, icon, badge }) => {
  const [open, setOpen] = useState(false);
  const s = style || SEVERITY_STYLE.info;

  return (
    <motion.div layout className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 p-3.5 text-left"
      >
        <DynIcon name={icon} className={`h-4 w-4 shrink-0 mt-0.5 ${s.icon}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold">{title}</span>
            {badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.badge}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{summary}</p>
        </div>
        <div className={`shrink-0 mt-0.5 ${s.icon}`}>
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-current/10 pt-3">
              {detail && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Na prática
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
                </div>
              )}
              {action && (
                <div className={`flex items-start gap-2 p-2.5 rounded-lg ${s.bg} border ${s.border}`}>
                  <ArrowRight className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${s.icon}`} />
                  <p className={`text-xs font-medium ${s.icon}`}>{action}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * SectionHeader — título de seção consistente.
 */
const SectionHeader = ({ icon: Icon, title, count, colorClass = 'text-primary' }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className={`h-4 w-4 ${colorClass}`} />
    <span className="text-sm font-semibold">{title}</span>
    {count !== undefined && (
      <Badge variant="secondary" className="font-mono text-[10px] ml-auto">{count}</Badge>
    )}
  </div>
);

/**
 * BehaviorScoreCard — exibe o score de comportamento do investidor.
 */
const BehaviorScoreCard = ({ behaviorScore }) => {
  const [expanded, setExpanded] = useState(false);
  const gradeColor = {
    A: 'text-emerald-400 bg-emerald-500/20',
    B: 'text-blue-400 bg-blue-500/20',
    C: 'text-amber-400 bg-amber-500/20',
    D: 'text-orange-400 bg-orange-500/20',
    F: 'text-rose-400 bg-rose-500/20',
  }[behaviorScore.grade] || 'text-muted-foreground bg-muted';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Score do Investidor
          <span className={`ml-auto h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${gradeColor}`}>
            {behaviorScore.grade}
          </span>
        </CardTitle>
        <CardDescription className="text-xs">{behaviorScore.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <p className="text-3xl font-mono font-bold">{behaviorScore.totalScore}</p>
          <p className="text-sm text-muted-foreground mb-1">/ {behaviorScore.maxScore} pontos</p>
        </div>
        <Progress value={(behaviorScore.totalScore / behaviorScore.maxScore) * 100} className="h-1.5" />

        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between text-xs text-muted-foreground pt-1"
        >
          <span>Ver detalhamento</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3"
            >
              {behaviorScore.items.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{item.label}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {item.score}/{item.maxScore}
                    </Badge>
                  </div>
                  <Progress value={(item.score / item.maxScore) * 100} className="h-1" />
                  <p className="text-[10px] text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

/**
 * MilestoneTimeline — linha do tempo de marcos projetados.
 */
const MilestoneTimeline = ({ milestones, formatCurrency }) => {
  if (milestones.length === 0) return null;

  const MILESTONE_ICON = {
    Shield:       Shield,
    ShieldCheck:  ShieldCheck,
    Target:       Target,
    Zap:          Zap,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Marcos projetados
        </CardTitle>
        <CardDescription className="text-xs">
          Quando seu patrimônio vai atingir cada objetivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0 px-4 pb-4">
        {milestones.map((m, i) => {
          const Icon = MILESTONE_ICON[m.icon] || Target;
          const isLast = i === milestones.length - 1;
          return (
            <div key={m.id} className="flex gap-3">
              {/* Linha do tempo */}
              <div className="flex flex-col items-center">
                <div className={`h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-2`}>
                  <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                </div>
                {!isLast && <div className="w-px flex-1 bg-border/40 my-1" />}
              </div>

              {/* Conteúdo */}
              <div className={`pb-4 flex-1 min-w-0 pt-2 ${isLast ? '' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">{m.label}</p>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-semibold text-muted-foreground">{m.label2}</p>
                    <p className="text-[10px] text-muted-foreground">mês {m.month}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{m.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

/**
 * AllocationAdviceCard — conselho de alocação com diff visual.
 */
const AllocationAdviceCard = ({ advice, formatCurrency }) => {
  const [show, setShow] = useState(false);

  if (advice.isAlreadyOptimal) return null;

  const assetColors = {
    CDI:   'bg-blue-500',
    SELIC: 'bg-emerald-500',
    CDB:   'bg-purple-500',
    FII:   'bg-amber-500',
  };

  return (
    <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
      <div className="flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-primary">Sugestão de alocação</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Perfil detectado: <strong>{advice.profileLabel}</strong> — {advice.profileDescription}
          </p>
        </div>
      </div>

      <button
        onClick={() => setShow(v => !v)}
        className="w-full flex items-center justify-between text-[11px] text-muted-foreground"
      >
        <span>Ver alocação recomendada vs atual</span>
        {show ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-2"
          >
            {advice.diffs.map(d => (
              <div key={d.asset} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full shrink-0 ${assetColors[d.asset] || 'bg-muted'}`} />
                <span className="text-xs w-14 shrink-0">{d.asset}</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">{d.current}%</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className={`font-mono text-[10px] font-semibold w-8 ${d.delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {d.target}%
                  </span>
                  <span className={`text-[10px] ${d.delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({d.delta > 0 ? '+' : ''}{d.delta}%)
                  </span>
                </div>
              </div>
            ))}

            {advice.returnDelta !== 0 && (
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                Retorno mensal estimado:{' '}
                <span className="font-mono font-semibold">
                  {advice.currentMonthlyReturn.toFixed(3)}%
                </span>
                {' → '}
                <span className={`font-mono font-semibold ${advice.returnDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {advice.recommendedMonthlyReturn.toFixed(3)}%
                </span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const InvestimentosPage = () => {
  const {
    mounted,
    isLoaded,
    financialData,
    settings,
    formatCurrency,
    projection,
  } = useFinancial();
  const { container, item } = usePageVariants();

  // ── Gera o relatório de insights (lógica pura, memoizado) ─────────────────
  const report = useMemo(() => {
    if (!financialData || !settings) return null;
    return buildInsightReport(financialData, settings, projection);
  }, [financialData, settings, projection]);

if (!isLoaded) return <InvestimentosSkeleton />;

const hasData = financialData.monthlyIncome > 0 || financialData.initialPatrimony > 0;

if (hasData && !report) return <InvestimentosSkeleton />;
if (!hasData) {
  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4 pb-4">
      <motion.div variants={item} className="pt-2">
        <h1 className="text-xl font-bold">Investimentos</h1>
        <p className="text-sm text-muted-foreground">Configure sua carteira</p>
      </motion.div>
      <motion.div variants={item}><InvestimentosEmpty /></motion.div>
    </motion.div>
  );
}

  const { overview, alerts, opportunities, milestones, allocationAdvice, behaviorScore } = report;

  // Contadores para badges
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highOppCount  = opportunities.filter(o => o.urgency === 'high').length;
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-5 pb-6"
    >
      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <motion.div variants={item} className="pt-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Sua carteira</h1>
            <p className="text-sm text-muted-foreground">
              Projeção para {financialData.durationMonths || 12} meses
            </p>
          </div>
          {/* Badge de alertas críticos no cabeçalho */}
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-400 text-xs font-semibold">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </motion.div>

      {/* ══ 1. VISÃO GERAL ════════════════════════════════════════════════ */}
      <motion.section variants={item} className="space-y-3">
        <SectionHeader icon={BarChart3} title="Visão geral" />

        <div className="grid grid-cols-2 gap-2">
          <KpiCard
            label="Patrimônio projetado"
            value={formatCurrency(overview.projectedPatrimony)}
            sub={`em ${overview.durationMonths} meses`}
            colorClass="bg-primary/10 text-primary"
            borderClass="border-primary/20"
            icon={TrendingUp}
          />
          <KpiCard
            label="Total de rendimentos"
            value={formatCurrency(overview.totalReturns)}
            sub={`${overview.returnShare.toFixed(0)}% do crescimento`}
            colorClass="bg-emerald-500/10 text-emerald-400"
            borderClass="border-emerald-500/20"
            icon={BarChart3}
          />
          <KpiCard
            label="Aporte mensal"
            value={formatCurrency(projection[0]?.surplusForInvestments || 0)}
            sub="mês inicial"
            colorClass="bg-blue-500/10 text-blue-400"
            borderClass="border-blue-500/20"
            icon={PiggyBank}
          />
          <KpiCard
            label="Retorno ponderado"
            value={`${overview.monthlyWeightedReturn.toFixed(3)}%`}
            sub="ao mês (carteira atual)"
            colorClass="bg-purple-500/10 text-purple-400"
            borderClass="border-purple-500/20"
            icon={Percent}
          />
        </div>

        {/* Retorno ponderado — explicação contextual */}
        <div className="px-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Na prática: cada R$ 1.000 investidos rendem aproximadamente{' '}
            <span className="font-mono font-semibold text-foreground">
              {formatCurrency(overview.monthlyWeightedReturn * 10)}
            </span>{' '}
            por mês com a carteira atual.
          </p>
        </div>

        {/* Gráfico de composição */}
        <PortfolioChart />
      </motion.section>

      {/* ══ 2. ALERTAS ════════════════════════════════════════════════════ */}
      {alerts.length > 0 && (
        <motion.section variants={item} className="space-y-2">
          <SectionHeader
            icon={AlertTriangle}
            title="Alertas"
            count={alerts.length}
            colorClass={criticalCount > 0 ? 'text-rose-400' : 'text-amber-400'}
          />
          <div className="space-y-2">
            {alerts.map(alert => (
              <ExpandableCard
                key={alert.id}
                icon={alert.icon}
                title={alert.title}
                summary={alert.summary}
                detail={alert.detail}
                action={alert.action}
                style={SEVERITY_STYLE[alert.severity]}
                badge={SEVERITY_STYLE[alert.severity]?.label}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ══ 3. OPORTUNIDADES ══════════════════════════════════════════════ */}
      {opportunities.length > 0 && (
        <motion.section variants={item} className="space-y-2">
          <SectionHeader
            icon={Sparkles}
            title="Oportunidades identificadas"
            count={opportunities.length}
            colorClass="text-emerald-400"
          />
          <div className="space-y-2">
            {opportunities.map(opp => (
              <ExpandableCard
                key={opp.id}
                icon={opp.icon}
                title={opp.title}
                summary={opp.summary}
                detail={opp.detail}
                action={opp.action}
                style={URGENCY_STYLE[opp.urgency]}
                badge={
                  opp.impact
                    ? `+${formatCurrency(opp.impact)}/mês`
                    : undefined
                }
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ══ 4. MARCOS PROJETADOS ══════════════════════════════════════════ */}
      {milestones.length > 0 && (
        <motion.section variants={item}>
          <MilestoneTimeline milestones={milestones} formatCurrency={formatCurrency} />
        </motion.section>
      )}

      {/* ══ 5. SCORE DE COMPORTAMENTO ═════════════════════════════════════ */}
      <motion.section variants={item}>
        <BehaviorScoreCard behaviorScore={behaviorScore} />
      </motion.section>

      {/* ══ 6. CARTEIRA + CONSELHO DE ALOCAÇÃO ═══════════════════════════ */}
      <motion.section variants={item} className="space-y-3">
        <SectionHeader icon={PieChart} title="Alocação da carteira" />
        {/* Conselho acima do formulário */}
        <AllocationAdviceCard advice={allocationAdvice} formatCurrency={formatCurrency} />
        <InvestmentForm />
      </motion.section>

      {/* ══ 7. DESTINO DA SOBRA ═══════════════════════════════════════════ */}
      <motion.section variants={item}>
        <SurplusAllocation />
      </motion.section>

      {/* ══ 8. APORTES POR PERÍODO ════════════════════════════════════════ */}
      <motion.section variants={item}>
        <TieredContributions />
      </motion.section>
    </motion.div>
  );
};

export default InvestimentosPage;