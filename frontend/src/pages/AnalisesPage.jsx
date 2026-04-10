import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, TrendingUp, AlertCircle, Sparkles,
  ShoppingBag, Car, Heart, Utensils, Gamepad2,
  BookOpen, Zap, MoreHorizontal, ArrowRight,
  ArrowUp, ArrowDown, Minus, Target, Wallet,
  BarChart3, PieChart, CreditCard, AlertTriangle,
  CheckCircle2, Info, ChevronDown, ChevronUp,
  Calendar, Clock,
} from 'lucide-react';
import { ExplainableScore } from '../components/score/ExplainableScore';
import { SuggestionsPanel } from '../components/suggestions/SuggestionsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useFinancial } from '../contexts/FinancialContext';
import { usePageVariants } from '../lib/animationVariants';
import { Link } from 'react-router-dom';

// ─── Categoria config (espelha HomePage) ─────────────────────────────────────

const CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação',  icon: Utensils,       color: 'text-orange-400', bg: 'bg-orange-500/15',  bar: 'bg-orange-400'  },
  { id: 'transporte',  label: 'Transporte',   icon: Car,            color: 'text-purple-400', bg: 'bg-purple-500/15',  bar: 'bg-purple-400'  },
  { id: 'saude',       label: 'Saúde',        icon: Heart,          color: 'text-rose-400',   bg: 'bg-rose-500/15',    bar: 'bg-rose-400'    },
  { id: 'lazer',       label: 'Lazer',        icon: Gamepad2,       color: 'text-pink-400',   bg: 'bg-pink-500/15',    bar: 'bg-pink-400'    },
  { id: 'compras',     label: 'Compras',      icon: ShoppingBag,    color: 'text-amber-400',  bg: 'bg-amber-500/15',   bar: 'bg-amber-400'   },
  { id: 'educacao',    label: 'Educação',     icon: BookOpen,       color: 'text-cyan-400',   bg: 'bg-cyan-500/15',    bar: 'bg-cyan-400'    },
  { id: 'contas',      label: 'Contas',       icon: Zap,            color: 'text-yellow-400', bg: 'bg-yellow-500/15',  bar: 'bg-yellow-400'  },
  { id: 'outros',      label: 'Outros',       icon: MoreHorizontal, color: 'text-slate-400',  bg: 'bg-slate-500/15',   bar: 'bg-slate-400'   },
];

const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v, formatCurrency) => formatCurrency(v);

const daysInMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

const dayOfMonth = () => new Date().getDate();

const monthProgress = () => dayOfMonth() / daysInMonth(); // 0–1

// Projeta o gasto até o fim do mês com base no ritmo atual
const projectMonthEnd = (spent) => {
  const progress = monthProgress();
  if (progress <= 0) return spent;
  return spent / progress;
};

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
    <Pulse className="h-10 rounded-xl" />
    <Pulse className="h-48 rounded-xl" />
    <Pulse className="h-64 rounded-xl" />
  </div>
);

// ─── KPI card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, colorClass, borderClass, icon: Icon, trend }) => (
  <motion.div
    whileTap={{ scale: 0.97 }}
    className={`p-3 rounded-xl border ${colorClass} ${borderClass}`}
  >
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</span>
    </div>
    <p className="text-xl font-mono font-bold leading-tight">{value}</p>
    {sub && <p className="text-[10px] opacity-55 mt-0.5">{sub}</p>}
    {trend !== undefined && (
      <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-medium ${
        trend > 0 ? 'text-rose-400' : trend < 0 ? 'text-emerald-400' : 'text-muted-foreground'
      }`}>
        {trend > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : trend < 0 ? <ArrowDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
        {Math.abs(trend).toFixed(1)}% vs planejado
      </div>
    )}
  </motion.div>
);

// ─── Barra de categoria ────────────────────────────────────────────────────────

const CategoryBar = ({ cat, spent, planned, total, formatCurrency }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = cat.icon;
  const pct = total > 0 ? (spent / total) * 100 : 0;
  const hasPlanned = planned > 0;
  const vsPlanned = hasPlanned ? ((spent - planned) / planned) * 100 : null;
  const overBudget = hasPlanned && spent > planned;
  const barPct = hasPlanned ? Math.min((spent / planned) * 100, 100) : pct;
  const projected = projectMonthEnd(spent);

  const barColor = overBudget
    ? 'bg-rose-400'
    : vsPlanned !== null && vsPlanned > 70
    ? 'bg-amber-400'
    : cat.bar;

  return (
    <motion.div
      layout
      className="space-y-2 py-3 border-b border-border/30 last:border-0"
    >
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Ícone */}
        <div className={`h-8 w-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
        </div>

        {/* Label + barra */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">{cat.label}</span>
            <div className="flex items-center gap-2">
              {overBudget && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 text-rose-400 border-rose-400/30">
                  estourou
                </Badge>
              )}
              <span className="font-mono text-xs font-semibold">{formatCurrency(spent)}</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${barPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Chevron */}
        <div className="text-muted-foreground shrink-0">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </div>

      {/* Detalhes expandidos */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-11 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* % do total */}
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <p className="text-[10px] text-muted-foreground">% dos gastos</p>
                  <p className="font-mono text-sm font-bold">{pct.toFixed(1)}%</p>
                </div>

                {/* Projeção fim do mês */}
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Projeção fim mês</p>
                  <p className={`font-mono text-sm font-bold ${overBudget ? 'text-rose-400' : ''}`}>
                    {formatCurrency(projected)}
                  </p>
                </div>
              </div>

              {/* vs planejado */}
              {hasPlanned ? (
                <div className={`p-2.5 rounded-lg border text-xs ${
                  overBudget
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <span>Planejado</span>
                    <span className="font-mono font-semibold">{formatCurrency(planned)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span>Diferença</span>
                    <span className="font-mono font-semibold">
                      {overBudget ? '+' : ''}{formatCurrency(spent - planned)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Sem orçamento planejado para esta categoria. Configure em <strong>Planejamento</strong>.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Seção: Resumo do mês ─────────────────────────────────────────────────────

const MonthSummarySection = ({ formatCurrency, currentMonthTransactions, financialData, summary, spentBySourceThisMonth, paymentSources }) => {
  // Total gasto real em transactions este mês
  const totalSpent = useMemo(
    () => currentMonthTransactions.reduce((s, t) => s + (t.amount || 0), 0),
    [currentMonthTransactions],
  );

  // Gastos por categoria (transactions reais)
  const spentByCategory = useMemo(() => {
    const map = {};
    currentMonthTransactions.forEach(t => {
      map[t.category] = (map[t.category] || 0) + (t.amount || 0);
    });
    return map;
  }, [currentMonthTransactions]);

  // Planejado por categoria (variableExpenses do Planejamento)
  const plannedByCategory = useMemo(() => {
    const map = {};
    (financialData.variableExpenses || []).forEach(exp => {
      if (exp.category) {
        map[exp.category] = (map[exp.category] || 0) + (exp.amount || 0);
      }
    });
    return map;
  }, [financialData.variableExpenses]);

  const hasVariableExpenses = (financialData.variableExpenses || []).length > 0;

  // Categorias com gasto > 0, ordenadas por valor
  const activeCategories = useMemo(() => {
    return CATEGORIES
      .filter(cat => spentByCategory[cat.id] > 0)
      .sort((a, b) => (spentByCategory[b.id] || 0) - (spentByCategory[a.id] || 0));
  }, [spentByCategory]);

  // Sobra planejada vs gasto real
  const plannedSurplus = summary.monthlySurplus || 0;
  const totalPlannedVariable = (financialData.variableExpenses || []).reduce((s, e) => s + (e.amount || 0), 0);
  const totalPlannedFixed    = (financialData.fixedCosts || []).reduce((s, c) => s + (c.amount || 0), 0);
  const totalIncome          = financialData.monthlyIncome || 0;

  // Categoria mais pesada
  const topCategory = activeCategories[0];

  // Dia do mês para contexto
  const todayDay  = dayOfMonth();
  const totalDays = daysInMonth();
  const monthPct  = monthProgress() * 100;

  // Ritmo de gasto: quanto deveria ter gasto até hoje proporcionalmente
  const expectedByNow = totalPlannedVariable * monthProgress();
  const spendingPace  = expectedByNow > 0 ? ((totalSpent - expectedByNow) / expectedByNow) * 100 : null;

  // Projeção do mês completo
  const projectedTotal = projectMonthEnd(totalSpent);
  const projectedVsPlanned = totalPlannedVariable > 0
    ? ((projectedTotal - totalPlannedVariable) / totalPlannedVariable) * 100
    : null;

  // Gastos por fonte
  const sourcesWithSpending = paymentSources.filter(s => spentBySourceThisMonth.get(s.id) > 0);

  if (currentMonthTransactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-sm mb-1">Nenhum gasto registrado este mês</p>
          <p className="text-xs text-muted-foreground mb-4">
            Registre seus gastos na Home para ver a análise aqui.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
          >
            Ir para Home <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── KPIs do mês ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Total gasto"
          value={formatCurrency(totalSpent)}
          sub={`${currentMonthTransactions.length} transações`}
          colorClass="bg-rose-500/10 text-rose-400"
          borderClass="border-rose-500/20"
          icon={CreditCard}
        />
        <StatCard
          label="Sobra real"
          value={formatCurrency(Math.max(totalIncome - totalPlannedFixed - totalSpent, 0))}
          sub={`de ${formatCurrency(totalIncome)} de renda`}
          colorClass="bg-emerald-500/10 text-emerald-400"
          borderClass="border-emerald-500/20"
          icon={Wallet}
        />
        <StatCard
          label="Maior gasto"
          value={topCategory ? formatCurrency(spentByCategory[topCategory.id]) : '—'}
          sub={topCategory?.label || 'nenhum'}
          colorClass="bg-amber-500/10 text-amber-400"
          borderClass="border-amber-500/20"
          icon={BarChart3}
        />
        <StatCard
          label="Projeção fim mês"
          value={formatCurrency(projectedTotal)}
          sub={
            projectedVsPlanned !== null
              ? projectedVsPlanned > 0
                ? `+${projectedVsPlanned.toFixed(0)}% acima do plano`
                : `${Math.abs(projectedVsPlanned).toFixed(0)}% abaixo do plano`
              : 'sem orçamento'
          }
          colorClass="bg-blue-500/10 text-blue-400"
          borderClass="border-blue-500/20"
          icon={Target}
          trend={projectedVsPlanned}
        />
      </div>

      {/* ── Progresso do mês ────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 pb-3 px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Progresso do mês</span>
            </div>
            <span className="text-xs text-muted-foreground">
              dia {todayDay} de {totalDays}
            </span>
          </div>

          {/* Barra de tempo */}
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-muted-foreground/40"
                initial={{ width: 0 }}
                animate={{ width: `${monthPct}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{monthPct.toFixed(0)}% do mês passou</p>
          </div>

          {/* Ritmo de gasto */}
          {spendingPace !== null && (
            <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
              spendingPace > 20
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : spendingPace > 0
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {spendingPace > 0
                ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                : <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              }
              <span>
                {spendingPace > 20
                  ? `Ritmo acelerado: você gastou ${spendingPace.toFixed(0)}% a mais do que o esperado para este ponto do mês.`
                  : spendingPace > 0
                  ? `Levemente acima do ritmo esperado (${spendingPace.toFixed(0)}%). Atenção.`
                  : `Ótimo ritmo! Você está ${Math.abs(spendingPace).toFixed(0)}% abaixo do esperado para este ponto do mês.`
                }
              </span>
            </div>
          )}

          {/* Aviso sem variableExpenses */}
          {!hasVariableExpenses && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Você não tem despesas variáveis planejadas. Sem isso, não consigo comparar o real com o planejado.{' '}
                <Link to="/planejamento" className="underline font-semibold">Configure em Planejamento.</Link>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Gastos por categoria ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Por categoria
            {!hasVariableExpenses && (
              <Badge variant="outline" className="text-[10px] ml-auto text-amber-400 border-amber-400/30">
                sem orçamento
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {activeCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma categoria com gasto registrado.
            </p>
          ) : (
            <div>
              {activeCategories.map(cat => (
                <CategoryBar
                  key={cat.id}
                  cat={cat}
                  spent={spentByCategory[cat.id] || 0}
                  planned={plannedByCategory[cat.id] || 0}
                  total={totalSpent}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Gastos por fonte de pagamento ────────────────────────────────── */}
      {sourcesWithSpending.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Por fonte de pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {sourcesWithSpending.map(source => {
              const spent = spentBySourceThisMonth.get(source.id) || 0;
              const pct   = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
              const hasLimit = source.monthlyLimit > 0;
              const limitPct = hasLimit ? Math.min((spent / source.monthlyLimit) * 100, 100) : pct;
              const overLimit = hasLimit && spent > source.monthlyLimit;

              return (
                <div key={source.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-xs font-medium">{source.name}</span>
                      {overLimit && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 text-rose-400 border-rose-400/30">
                          estourou
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-semibold">{formatCurrency(spent)}</span>
                      {hasLimit && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          / {formatCurrency(source.monthlyLimit)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: overLimit ? '#f87171' : source.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${limitPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}% do total gasto</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Linha do tempo dos últimos gastos ────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Últimas transações
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-0">
            {currentMonthTransactions.slice(0, 8).map((t, i) => {
              const cat  = getCat(t.category);
              const Icon = cat.icon;
              const source = paymentSources.find(s => s.id === t.sourceId);
              return (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border/25 last:border-0">
                  <div className={`h-7 w-7 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{t.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{cat.label}</span>
                      {source && (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: source.color + '22', color: source.color }}
                        >
                          {source.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-rose-400 shrink-0">
                    -{formatCurrency(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
          {currentMonthTransactions.length > 8 && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              + {currentMonthTransactions.length - 8} transações — veja todas na Home
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

// ─── Seção: Saúde financeira (score + sugestões) ──────────────────────────────

const HealthSection = ({ scoreBreakdown, summary, formatCurrency }) => {
  const gradeLabel = { A: 'Excelente', B: 'Bom', C: 'Regular', D: 'Atenção', F: 'Crítico' }[scoreBreakdown.grade] ?? '—';

  return (
    <div className="space-y-4">
      {/* KPIs de saúde */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Score"
          value={`${scoreBreakdown.totalScore}`}
          sub={`de ${scoreBreakdown.maxScore} pts · ${gradeLabel}`}
          colorClass="bg-primary/10 text-primary"
          borderClass="border-primary/20"
          icon={Award}
        />
        <StatCard
          label="Taxa poupança"
          value={`${summary.savingsRate.toFixed(1)}%`}
          sub={summary.savingsRate >= 20 ? 'acima da meta (20%)' : 'meta: 20%'}
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
      </div>

      <ExplainableScore />
      <SuggestionsPanel />
    </div>
  );
};

// ─── Seção: Projeção patrimonial ──────────────────────────────────────────────

const ProjectionSection = ({ projection, summary, formatCurrency, financialData }) => {
  if (!projection || projection.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-sm mb-1">Sem projeção disponível</p>
          <p className="text-xs text-muted-foreground mb-4">
            Configure renda e investimentos para ver a projeção do patrimônio.
          </p>
          <Link
            to="/planejamento"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
          >
            Ir para Planejamento <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  const last     = projection[projection.length - 1];
  const first    = projection[0];
  const midIdx   = Math.floor(projection.length / 2);
  const mid      = projection[midIdx];

  // Marcos importantes
  const milestones = [];
  const targets = [5000, 10000, 25000, 50000, 100000];
  targets.forEach(target => {
    const month = projection.find(m => m.patrimony >= target);
    if (month) milestones.push({ target, month: month.month, label: month.monthLabel });
  });

  // Melhor e pior mês de rendimento
  const sorted = [...projection].sort((a, b) => b.investmentReturns - a.investmentReturns);
  const bestMonth  = sorted[0];
  const worstMonth = sorted[sorted.length - 1];

  return (
    <div className="space-y-4">

      {/* Resumo final */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Patrimônio atual"
          value={formatCurrency(financialData.initialPatrimony || 0)}
          sub="ponto de partida"
          colorClass="bg-muted text-foreground"
          borderClass="border-border/40"
          icon={Wallet}
        />
        <StatCard
          label="Patrimônio projetado"
          value={formatCurrency(last.patrimony)}
          sub={`em ${projection.length} meses`}
          colorClass="bg-emerald-500/10 text-emerald-400"
          borderClass="border-emerald-500/20"
          icon={TrendingUp}
        />
        <StatCard
          label="Total aportes"
          value={formatCurrency(summary.totalContributions)}
          sub="dinheiro investido"
          colorClass="bg-blue-500/10 text-blue-400"
          borderClass="border-blue-500/20"
          icon={ArrowUp}
        />
        <StatCard
          label="Total rendimentos"
          value={formatCurrency(summary.totalReturns)}
          sub="juros compostos"
          colorClass="bg-purple-500/10 text-purple-400"
          borderClass="border-purple-500/20"
          icon={Sparkles}
        />
      </div>

      {/* Evolução mês a mês (mini tabela) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Evolução mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-0">
            {projection.map((month, i) => {
              const pct = last.patrimony > 0 ? (month.patrimony / last.patrimony) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">{month.monthLabel}</span>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-emerald-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }}
                      />
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-semibold w-24 text-right shrink-0">
                    {formatCurrency(month.patrimony)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Marcos */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Marcos projetados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {milestones.map(m => (
              <div key={m.target} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium">{formatCurrency(m.target)}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">mês {m.month}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rendimentos: melhor vs pior mês */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Rendimentos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Melhor mês</p>
              <p className="font-mono text-sm font-bold text-emerald-400">+{formatCurrency(bestMonth?.investmentReturns || 0)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{bestMonth?.monthLabel}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Mês inicial</p>
              <p className="font-mono text-sm font-bold text-blue-400">+{formatCurrency(first?.investmentReturns || 0)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{first?.monthLabel}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            Os rendimentos crescem mês a mês graças aos juros compostos.
          </p>
        </CardContent>
      </Card>

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
    currentMonthTransactions,
    spentBySourceThisMonth,
    paymentSources,
  } = useFinancial();

  const { container, item } = usePageVariants();

  if (!mounted) return <AnaliseSkeleton />;

  const hasData        = financialData.monthlyIncome > 0;
  const hasTransactions = currentMonthTransactions.length > 0;

  const gradeLabel = {
    A: 'Excelente', B: 'Bom', C: 'Regular', D: 'Atenção', F: 'Crítico',
  }[scoreBreakdown.grade] ?? '—';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-4"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div variants={item} className="pt-2">
        <h1 className="text-xl font-bold">Análises</h1>
        <p className="text-sm text-muted-foreground">
          {hasData
            ? `Score ${scoreBreakdown.totalScore}/${scoreBreakdown.maxScore} · ${gradeLabel}`
            : 'Configure seus dados para ver análises'}
        </p>
      </motion.div>

      {/* ── Sem dados de renda configurados ─────────────────────────────── */}
      {!hasData ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="text-center py-10">
              <Award className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium mb-1">Configure seus dados</p>
              <p className="text-xs text-muted-foreground mb-4">
                Acesse Planejamento para informar sua renda e despesas.
              </p>
              <Link
                to="/planejamento"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                Ir para Planejamento <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item}>
          {/* ── Abas principais ─────────────────────────────────────────── */}
          <Tabs defaultValue="mes" className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-11 mb-4">
              <TabsTrigger value="mes" className="text-xs gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Este mês
              </TabsTrigger>
              <TabsTrigger value="saude" className="text-xs gap-1.5">
                <Award className="h-3.5 w-3.5" />
                Saúde
              </TabsTrigger>
              <TabsTrigger value="projecao" className="text-xs gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Projeção
              </TabsTrigger>
            </TabsList>

            {/* ── Aba: Este mês ──────────────────────────────────────────── */}
            <TabsContent value="mes" className="mt-0 space-y-0">
              <MonthSummarySection
                formatCurrency={formatCurrency}
                currentMonthTransactions={currentMonthTransactions}
                financialData={financialData}
                summary={summary}
                spentBySourceThisMonth={spentBySourceThisMonth}
                paymentSources={paymentSources}
              />
            </TabsContent>

            {/* ── Aba: Saúde financeira ──────────────────────────────────── */}
            <TabsContent value="saude" className="mt-0">
              <HealthSection
                scoreBreakdown={scoreBreakdown}
                summary={summary}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            {/* ── Aba: Projeção ──────────────────────────────────────────── */}
            <TabsContent value="projecao" className="mt-0">
              <ProjectionSection
                projection={projection}
                summary={summary}
                formatCurrency={formatCurrency}
                financialData={financialData}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnalisesPage;