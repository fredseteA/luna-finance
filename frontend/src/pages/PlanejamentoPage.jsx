import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, DollarSign, CreditCard, ChevronRight,
  Trash2, ShoppingBag, Car, Heart, Utensils,
  Gamepad2, BookOpen, Zap, MoreHorizontal,
  Banknote, TrendingDown, TrendingUp, Calendar,
  ArrowRight, Target, AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExpensesForm } from '../components/forms/ExpensesForm';
import { useFinancial } from '../contexts/FinancialContext';
import { usePageVariants } from '../lib/animationVariants';
import { ExportData } from '../components/export/ExportData';
import { SmartAlerts } from '@/components/alerts/SmartAlerts';
import { Card, CardContent } from '../components/ui/card';

// ─── Categorias ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação', icon: Utensils,       color: 'text-orange-400', bg: 'bg-orange-500/15', bar: 'bg-orange-400' },
  { id: 'transporte',  label: 'Transporte',  icon: Car,            color: 'text-purple-400', bg: 'bg-purple-500/15', bar: 'bg-purple-400' },
  { id: 'saude',       label: 'Saúde',       icon: Heart,          color: 'text-rose-400',   bg: 'bg-rose-500/15',   bar: 'bg-rose-400'   },
  { id: 'lazer',       label: 'Lazer',       icon: Gamepad2,       color: 'text-pink-400',   bg: 'bg-pink-500/15',   bar: 'bg-pink-400'   },
  { id: 'compras',     label: 'Compras',     icon: ShoppingBag,    color: 'text-amber-400',  bg: 'bg-amber-500/15',  bar: 'bg-amber-400'  },
  { id: 'educacao',    label: 'Educação',    icon: BookOpen,       color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   bar: 'bg-cyan-400'   },
  { id: 'contas',      label: 'Contas',      icon: Zap,            color: 'text-yellow-400', bg: 'bg-yellow-500/15', bar: 'bg-yellow-400' },
  { id: 'outros',      label: 'Outros',      icon: MoreHorizontal, color: 'text-slate-400',  bg: 'bg-slate-500/15',  bar: 'bg-slate-400'  },
];

const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SourceIcon = ({ type, className }) => {
  const map = { checking: Wallet, credit_card: CreditCard, pix: Zap, cash: Banknote, benefit: ShoppingBag, other: MoreHorizontal };
  const Icon = map[type] || Wallet;
  return <Icon className={className} />;
};

const fmtDate = (dateStr) => {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (dateStr === today)     return 'hoje';
  if (dateStr === yesterday) return 'ontem';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
};

const daysLeft = () => {
  const now  = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.getDate() - now.getDate();
};

const currentWeekRange = () => {
  const now   = new Date();
  const day   = now.getDay();
  const start = new Date(now); start.setDate(now.getDate() - day);
  const end   = new Date(now); end.setDate(now.getDate() + (6 - day));
  return {
    from: start.toISOString().slice(0, 10),
    to:   end.toISOString().slice(0, 10),
  };
};

// ─── Termômetro principal ─────────────────────────────────────────────────────

const MainThermometer = ({ income, spent, surplus, formatCurrency }) => {
  const available  = Math.max(surplus - spent, 0);
  const overBudget = spent > surplus;
  const pct        = surplus > 0 ? Math.min((spent / surplus) * 100, 100) : 0;
  const days       = daysLeft();

  const barColor = pct >= 100 ? 'bg-rose-400' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Disponível este mês</p>
          <span className="text-[10px] text-muted-foreground">
            {days === 0 ? 'último dia' : `faltam ${days} dia${days > 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="flex items-end gap-2">
          <span className={`text-3xl font-black font-mono ${overBudget ? 'text-rose-400' : 'text-foreground'}`}>
            {formatCurrency(available)}
          </span>
          {overBudget && <span className="text-xs text-rose-400 mb-1 font-medium">estourado</span>}
        </div>

        <div className="space-y-1">
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Gasto: <span className="font-mono font-semibold text-foreground">{formatCurrency(spent)}</span></span>
            <span>Sobra planejada: <span className="font-mono font-semibold text-foreground">{formatCurrency(surplus)}</span></span>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Renda</p>
            <p className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(income)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Gasto</p>
            <p className="text-xs font-mono font-bold text-rose-400">{formatCurrency(spent)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">% usado</p>
            <p className={`text-xs font-mono font-bold ${pct >= 100 ? 'text-rose-400' : pct >= 80 ? 'text-amber-400' : 'text-foreground'}`}>
              {pct.toFixed(0)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Visão semanal ────────────────────────────────────────────────────────────

const WeeklyView = ({ currentMonthTransactions, surplus, formatCurrency }) => {
  const { from, to } = currentWeekRange();

  const weekTotal = useMemo(() =>
    currentMonthTransactions
      .filter(t => t.date >= from && t.date <= to)
      .reduce((sum, t) => sum + t.amount, 0),
    [currentMonthTransactions, from, to]
  );

  const days          = new Date().getDate();
  const dailyAvg      = days > 0 ? currentMonthTransactions.reduce((s, t) => s + t.amount, 0) / days : 0;
  const weeklyAvg     = dailyAvg * 7;
  const weekPct       = weeklyAvg > 0 ? Math.min((weekTotal / weeklyAvg) * 100, 100) : 0;
  const overWeek      = weekTotal > weeklyAvg && weeklyAvg > 0;

  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Esta semana</p>
          </div>
          {overWeek
            ? <span className="text-[10px] text-rose-400 font-medium">acima da média</span>
            : <span className="text-[10px] text-emerald-400 font-medium">dentro da média</span>
          }
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-2xl font-black font-mono ${overWeek ? 'text-rose-400' : 'text-foreground'}`}>
            {formatCurrency(weekTotal)}
          </span>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Média semanal</p>
            <p className="text-xs font-mono font-semibold">{formatCurrency(weeklyAvg)}</p>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${overWeek ? 'bg-rose-400' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${weekPct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Projeção do mês ──────────────────────────────────────────────────────────

const MonthProjection = ({ currentMonthTransactions, surplus, formatCurrency }) => {
  const now        = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const spentSoFar  = currentMonthTransactions.reduce((s, t) => s + t.amount, 0);
  const dailyAvg    = dayOfMonth > 0 ? spentSoFar / dayOfMonth : 0;
  const projected   = dailyAvg * daysInMonth;
  const overBudget  = projected > surplus && surplus > 0;
  const diff        = Math.abs(projected - surplus);

  if (dayOfMonth < 3) return null; // não projeta nos primeiros 2 dias

  return (
    <Card className={overBudget ? 'border-amber-500/30' : 'border-border/40'}>
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${overBudget ? 'text-amber-400' : 'text-emerald-400'}`} />
            <p className="text-sm font-semibold">Projeção do mês</p>
          </div>
          {overBudget
            ? <AlertTriangle className="h-4 w-4 text-amber-400" />
            : <span className="text-[10px] text-emerald-400 font-medium">✓ no caminho certo</span>
          }
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground">Se continuar assim, vai gastar</p>
            <p className={`text-xl font-black font-mono ${overBudget ? 'text-amber-400' : 'text-foreground'}`}>
              {formatCurrency(projected)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">{overBudget ? 'Acima do planejado em' : 'Abaixo do planejado em'}</p>
            <p className={`text-sm font-mono font-bold ${overBudget ? 'text-amber-400' : 'text-emerald-400'}`}>
              {overBudget ? '+' : '-'}{formatCurrency(diff)}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2">
          Baseado em {formatCurrency(dailyAvg)}/dia nos últimos {dayOfMonth} dias
        </p>
      </CardContent>
    </Card>
  );
};

// ─── Gastos por categoria ─────────────────────────────────────────────────────

const CategoryBreakdown = ({ currentMonthTransactions, formatCurrency }) => {
  const byCategory = useMemo(() => {
    const map = new Map();
    currentMonthTransactions.forEach(t => {
      const key = t.category || 'outros';
      map.set(key, (map.get(key) || 0) + t.amount);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, total]) => ({ ...getCat(id), total }));
  }, [currentMonthTransactions]);

  const totalAll = byCategory.reduce((s, c) => s + c.total, 0);

  if (byCategory.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4 space-y-3">
        <p className="text-sm font-semibold">Gastos por categoria</p>
        <div className="space-y-2.5">
          {byCategory.map(cat => {
            const Icon = cat.icon;
            const pct  = totalAll > 0 ? (cat.total / totalAll) * 100 : 0;
            return (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-lg ${cat.bg} flex items-center justify-center`}>
                      <Icon className={`h-3 w-3 ${cat.color}`} />
                    </div>
                    <span className="text-xs font-medium">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                    <span className="text-xs font-mono font-semibold text-rose-400">
                      -{formatCurrency(cat.total)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${cat.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Lista de transações do mês ───────────────────────────────────────────────

const TransactionRow = ({ transaction, onRemove, formatCurrency, paymentSources }) => {
  const cat    = getCat(transaction.category);
  const Icon   = cat.icon;
  const source = paymentSources.find(s => s.id === transaction.sourceId);
  const [confirming, setConfirming] = useState(false);

  const handleRemove = () => {
    if (confirming) { onRemove(transaction.id); return; }
    setConfirming(true);
    setTimeout(() => setConfirming(false), 2500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 group"
    >
      <div className={`h-8 w-8 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          <span className="text-[10px] text-muted-foreground">{cat.label} · {fmtDate(transaction.date)}</span>
          {source && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: source.color + '22', color: source.color }}>
              {source.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono font-semibold text-sm text-rose-400">
          -{formatCurrency(transaction.amount)}
        </span>
        <button
          onClick={handleRemove}
          className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${
            confirming
              ? 'bg-rose-500/20 text-rose-400 opacity-100'
              : 'bg-muted opacity-0 group-hover:opacity-100 text-muted-foreground'
          }`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
};

const MonthTransactions = ({ currentMonthTransactions, removeTransaction, formatCurrency, paymentSources }) => {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? currentMonthTransactions : currentMonthTransactions.slice(0, 5);
  const total     = currentMonthTransactions.reduce((s, t) => s + t.amount, 0);

  if (currentMonthTransactions.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-2 px-4 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-semibold">Gastos do mês</p>
            <p className="text-[10px] text-muted-foreground">
              {currentMonthTransactions.length} lançamento{currentMonthTransactions.length !== 1 ? 's' : ''} ·{' '}
              <span className="font-mono font-semibold text-rose-400">-{formatCurrency(total)}</span>
            </p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {displayed.map(t => (
            <TransactionRow
              key={t.id}
              transaction={t}
              onRemove={removeTransaction}
              formatCurrency={formatCurrency}
              paymentSources={paymentSources}
            />
          ))}
        </AnimatePresence>

        {currentMonthTransactions.length > 5 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="w-full py-2 text-xs text-primary font-medium flex items-center justify-center gap-1 hover:opacity-80 transition-opacity"
          >
            {showAll
              ? 'Ver menos'
              : `Ver todos (${currentMonthTransactions.length - 5} ocultos)`
            }
            <ChevronRight className={`h-3 w-3 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </button>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Fontes de pagamento ──────────────────────────────────────────────────────

const SourcesPreview = ({ paymentSources, spentBySourceThisMonth, formatCurrency }) => {
  const sourcesWithData = paymentSources.filter(s => spentBySourceThisMonth.has(s.id));
  if (sourcesWithData.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold">Por fonte de pagamento</p>
          <Link to="/planejamento/fontes" className="text-[10px] text-primary flex items-center gap-0.5">
            gerenciar <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {sourcesWithData.map(source => {
          const spent    = spentBySourceThisMonth.get(source.id) || 0;
          const hasLimit = !!source.monthlyLimit;
          const pct      = hasLimit ? Math.min((spent / source.monthlyLimit) * 100, 100) : 0;
          const overLimit = hasLimit && spent > source.monthlyLimit;

          return (
            <div key={source.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                  <span className="text-xs font-medium">{source.name}</span>
                  {source.owner === 'third_party' && source.ownerName && (
                    <span className="text-[10px] text-muted-foreground">({source.ownerName})</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {overLimit && <AlertTriangle className="h-3 w-3 text-rose-400" />}
                  <span className="font-mono text-xs font-semibold text-rose-400">
                    -{formatCurrency(spent)}
                  </span>
                  {hasLimit && (
                    <span className="text-[10px] text-muted-foreground">
                      / {formatCurrency(source.monthlyLimit)}
                    </span>
                  )}
                </div>
              </div>
              {hasLimit && (
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${overLimit ? 'bg-rose-400' : pct >= 80 ? 'bg-amber-400' : ''}`}
                    style={!overLimit && pct < 80 ? { backgroundColor: source.color } : {}}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          );
        })}

        <Link
          to="/planejamento/fontes"
          className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/40 hover:bg-muted transition-colors group mt-2"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Fontes de Pagamento</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Pulse = ({ className }) => <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
const PlanejamentoSkeleton = () => (
  <div className="space-y-4 pb-4">
    <div className="pt-2 space-y-2"><Pulse className="h-7 w-40" /><Pulse className="h-4 w-32" /></div>
    <Pulse className="h-40 rounded-xl" />
    <div className="grid grid-cols-2 gap-2"><Pulse className="h-20 rounded-xl" /><Pulse className="h-20 rounded-xl" /></div>
    <Pulse className="h-32 rounded-xl" />
    <Pulse className="h-48 rounded-xl" />
  </div>
);

// ─── Página principal ─────────────────────────────────────────────────────────

export const PlanejamentoPage = () => {
  const {
    mounted,
    financialData,
    formatCurrency,
    summary,
    paymentSources,
    spentBySourceThisMonth,
    sourceLimitAlerts,
    currentMonthTransactions,
    totalTransactionsThisMonth,
    totalOwnSourcesThisMonth,
    removeTransaction,
  } = useFinancial();

  const { container, item } = usePageVariants();

  if (!mounted) return <PlanejamentoSkeleton />;

  const totalFixedCosts = financialData.fixedCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
  const plannedSurplus  = summary.monthlySurplus || 0;
  const hasData         = financialData.monthlyIncome > 0;
  const hasSources      = paymentSources.length > 0;
  const spentThisMonth  = hasSources ? totalOwnSourcesThisMonth : totalTransactionsThisMonth;

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-4 pb-4">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div variants={item} className="pt-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Planejamento
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie renda e despesas</p>
      </motion.div>

      {hasData ? (
        <>
          {/* ── 1. Termômetro principal ──────────────────────────────────── */}
          <motion.div variants={item}>
            <MainThermometer
              income={financialData.monthlyIncome}
              spent={spentThisMonth}
              surplus={plannedSurplus}
              formatCurrency={formatCurrency}
            />
          </motion.div>

          {/* ── 2. Visão semanal + Projeção ──────────────────────────────── */}
          <motion.div variants={item} className="grid grid-cols-1 gap-3">
            <WeeklyView
              currentMonthTransactions={currentMonthTransactions}
              surplus={plannedSurplus}
              formatCurrency={formatCurrency}
            />
            <MonthProjection
              currentMonthTransactions={currentMonthTransactions}
              surplus={plannedSurplus}
              formatCurrency={formatCurrency}
            />
          </motion.div>

          {/* ── 3. Gastos por categoria ──────────────────────────────────── */}
          {currentMonthTransactions.length > 0 && (
            <motion.div variants={item}>
              <CategoryBreakdown
                currentMonthTransactions={currentMonthTransactions}
                formatCurrency={formatCurrency}
              />
            </motion.div>
          )}

          {/* ── 4. Fontes de pagamento ───────────────────────────────────── */}
          {hasSources && (
            <motion.div variants={item}>
              <SourcesPreview
                paymentSources={paymentSources}
                spentBySourceThisMonth={spentBySourceThisMonth}
                formatCurrency={formatCurrency}
              />
            </motion.div>
          )}

          {!hasSources && (
            <motion.div variants={item}>
              <Link
                to="/planejamento/fontes"
                className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border border-border/60 hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Fontes de Pagamento</p>
                    <p className="text-[11px] text-muted-foreground">Nenhuma cadastrada — toque para adicionar</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </motion.div>
          )}

          {/* ── 5. Lista de gastos do mês ────────────────────────────────── */}
          {currentMonthTransactions.length > 0 && (
            <motion.div variants={item}>
              <MonthTransactions
                currentMonthTransactions={currentMonthTransactions}
                removeTransaction={removeTransaction}
                formatCurrency={formatCurrency}
                paymentSources={paymentSources}
              />
            </motion.div>
          )}

          {/* ── 6. Custos fixos e variáveis planejados ───────────────────── */}
          <motion.div variants={item}>
            <ExpensesForm />
          </motion.div>

          {/* ── 7. Alertas inteligentes ──────────────────────────────────── */}
          <motion.div variants={item}>
            <SmartAlerts />
          </motion.div>

          {/* ── 8. Exportar ──────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <ExportData />
          </motion.div>
        </>
      ) : (
        <>
          {/* Estado vazio — sem renda configurada */}
          <motion.div variants={item}>
            <div className="py-8 text-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Configure sua renda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesse Configurações para definir sua renda mensal e começar a planejar
                </p>
              </div>
              <Link
                to="/configuracoes"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                Ir para Configurações <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <ExpensesForm />
          </motion.div>
          <motion.div variants={item}>
            <ExportData />
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default PlanejamentoPage;