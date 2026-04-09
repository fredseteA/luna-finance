import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Check, ChevronRight,
  ShoppingBag, Car, Heart, Utensils,
  Gamepad2, BookOpen, Zap, MoreHorizontal,
  Trash2, TrendingUp, Bell, AlertTriangle,
  Wallet, CreditCard, Banknote,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinancial } from '../contexts/FinancialContext';
import { useGreeting } from '../hooks/useGreeting';
import { usePageVariants } from '../lib/animationVariants';
import { DashboardEmpty } from '../components/dashboard/DashboardEmpty';
import { Card, CardContent } from '../components/ui/card';

// ─── Categorias de gasto ──────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação', icon: Utensils,      color: 'text-orange-400', bg: 'bg-orange-500/15' },
  { id: 'transporte',  label: 'Transporte',  icon: Car,           color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { id: 'saude',       label: 'Saúde',       icon: Heart,         color: 'text-rose-400',   bg: 'bg-rose-500/15'   },
  { id: 'lazer',       label: 'Lazer',       icon: Gamepad2,      color: 'text-pink-400',   bg: 'bg-pink-500/15'   },
  { id: 'compras',     label: 'Compras',     icon: ShoppingBag,   color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
  { id: 'educacao',    label: 'Educação',    icon: BookOpen,      color: 'text-cyan-400',   bg: 'bg-cyan-500/15'   },
  { id: 'contas',      label: 'Contas',      icon: Zap,           color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  { id: 'outros',      label: 'Outros',      icon: MoreHorizontal,color: 'text-slate-400',  bg: 'bg-slate-500/15'  },
];

const getCategoryConfig = (categoryId) =>
  CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (dateStr === today)     return 'hoje';
  if (dateStr === yesterday) return 'ontem';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
};

const daysLeftInMonth = () => {
  const now  = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.getDate() - now.getDate();
};

// Ícone da fonte — mapeamento de string para ícone Lucide
const SourceIcon = ({ type, className }) => {
  const icons = {
    checking:    Wallet,
    credit_card: CreditCard,
    pix:         Zap,
    cash:        Banknote,
    benefit:     ShoppingBag,
    other:       MoreHorizontal,
  };
  const Icon = icons[type] || Wallet;
  return <Icon className={className} />;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Pulse = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />
);

const HomeSkeleton = () => (
  <div className="space-y-4 pb-4">
    <div className="pt-2 space-y-2">
      <Pulse className="h-7 w-44" />
      <Pulse className="h-4 w-36" />
    </div>
    <Pulse className="h-28 rounded-xl" />
    <Pulse className="h-28 rounded-xl" />
    <Pulse className="h-14 rounded-xl" />
    <div className="space-y-2">
      <Pulse className="h-4 w-32" />
      {[...Array(3)].map((_, i) => <Pulse key={i} className="h-14 rounded-xl" />)}
    </div>
  </div>
);

// ─── Termômetro genérico ──────────────────────────────────────────────────────

const Thermometer = ({ title, subtitle, spent, limit, formatCurrency, accentColor, showDays = false }) => {
  const available  = Math.max(limit - spent, 0);
  const overBudget = spent > limit;
  const pct        = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const days       = daysLeftInMonth();

  const barColor =
    pct >= 100 ? 'bg-rose-400'
    : pct >= 80 ? 'bg-amber-400'
    : accentColor || 'bg-emerald-400';

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {showDays && (
            <span className="text-[10px] text-muted-foreground">
              {days === 0 ? 'último dia' : `faltam ${days} dia${days > 1 ? 's' : ''}`}
            </span>
          )}
        </div>

        <div className="flex items-end gap-2">
          <span className={`text-3xl font-black font-mono ${overBudget ? 'text-rose-400' : 'text-foreground'}`}>
            {formatCurrency(available)}
          </span>
          {overBudget && (
            <span className="text-xs text-rose-400 mb-1 font-medium">estourado</span>
          )}
        </div>

        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>
              Gasto: <span className="font-mono font-semibold text-foreground">{formatCurrency(spent)}</span>
            </span>
            <span>
              Limite: <span className="font-mono font-semibold text-foreground">{formatCurrency(limit)}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Chip de alertas de limite de fonte ───────────────────────────────────────

const SourceLimitAlerts = ({ alerts, formatCurrency }) => {
  if (!alerts?.length) return null;

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
            alert.level === 'danger'
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {alert.level === 'danger'
                ? `Limite atingido — ${alert.sourceName}`
                : `80% do limite — ${alert.sourceName}`}
            </p>
            <p className="text-[10px] opacity-80 mt-0.5">
              {formatCurrency(alert.spent)} de {formatCurrency(alert.limit)} utilizados
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Modal de lançamento rápido ───────────────────────────────────────────────

const QuickAddModal = ({ onClose, onAdd, formatCurrency, paymentSources, defaultPaymentSource }) => {
  const [amount,      setAmount]      = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [sourceId,    setSourceId]    = useState(defaultPaymentSource?.id || null);
  const [date,        setDate]        = useState('');   // opcional — vazio = hoje
  const [error,       setError]       = useState('');

  const handleSubmit = () => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || parsed <= 0) { setError('Informe um valor válido'); return; }
    if (!category)              { setError('Selecione uma categoria'); return; }

    onAdd({
      description: description.trim() || getCategoryConfig(category).label,
      amount:      parsed,
      category,
      sourceId:    sourceId || null,
      date:        date || undefined,  // undefined → addTransaction usa hoje
    });
    onClose();
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^\d,\.]/g, '');
    setAmount(raw);
    setError('');
  };

  const hasSources = paymentSources.length > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-md bg-card border border-border rounded-t-2xl z-10 max-h-[90vh] flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-3 mb-1 shrink-0" />

        {/* Header fixo */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <h3 className="text-base font-bold">Registrar gasto</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto px-5 pb-6 space-y-5 flex-1">

          {/* Valor */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={handleAmountChange}
                autoFocus
                className="w-full pl-9 pr-3 py-3 rounded-xl bg-muted border border-border text-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Descrição <span className="normal-case font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="ex: iFood, Uber, Farmácia..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Categorias */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categoria
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => {
                const Icon       = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); setError(''); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                      isSelected
                        ? `${cat.bg} border-current ${cat.color}`
                        : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[9px] font-medium leading-tight text-center">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fonte de pagamento — só aparece se tiver fontes cadastradas */}
          {hasSources && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pago com
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Opção "Sem fonte" */}
                <button
                  onClick={() => setSourceId(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    sourceId === null
                      ? 'bg-muted border-foreground/30 text-foreground'
                      : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Sem fonte
                </button>

                {paymentSources.map(source => (
                  <button
                    key={source.id}
                    onClick={() => setSourceId(source.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      sourceId === source.id
                        ? 'border-current'
                        : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                    }`}
                    style={
                      sourceId === source.id
                        ? { backgroundColor: source.color + '22', color: source.color, borderColor: source.color + '66' }
                        : {}
                    }
                  >
                    <SourceIcon type={source.type} className="h-3 w-3" />
                    {source.name}
                    {/* Mostra dono quando é terceiro */}
                    {source.owner === 'third_party' && source.ownerName && (
                      <span className="opacity-60">({source.ownerName})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Limite restante da fonte selecionada — feedback em tempo real */}
              {sourceId && (() => {
                const source = paymentSources.find(s => s.id === sourceId);
                if (!source?.monthlyLimit) return null;
                // Não temos acesso ao spentBySourceThisMonth aqui, então o limite é informativo
                return (
                  <p className="text-[10px] text-muted-foreground">
                    Limite mensal desta fonte: <span className="font-mono font-semibold text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(source.monthlyLimit)}
                    </span>
                  </p>
                );
              })()}
            </div>
          )}

          {/* Data — opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Data <span className="normal-case font-normal">(opcional — padrão: hoje)</span>
            </label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Erro */}
          {error && (
            <p className="text-xs text-rose-400 font-medium">{error}</p>
          )}

          {/* Confirmar */}
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Check className="h-4 w-4" />
            Confirmar gasto
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Item do feed de transações ───────────────────────────────────────────────

const TransactionItem = ({ transaction, onRemove, formatCurrency, paymentSources }) => {
  const cat    = getCategoryConfig(transaction.category);
  const Icon   = cat.icon;
  const source = paymentSources.find(s => s.id === transaction.sourceId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 group"
    >
      {/* Ícone de categoria */}
      <div className={`h-9 w-9 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${cat.color}`} />
      </div>

      {/* Descrição + categoria + fonte */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground">
            {cat.label} · {formatDate(transaction.date)}
          </span>
          {/* Badge da fonte */}
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

      {/* Valor + botão remover */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono font-semibold text-sm text-rose-400">
          -{formatCurrency(transaction.amount)}
        </span>
        <button
          onClick={() => onRemove(transaction.id)}
          className="h-6 w-6 rounded-lg bg-muted opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Chip de alertas do sistema ───────────────────────────────────────────────

const AlertsChip = ({ alerts }) => {
  const active = alerts?.filter(a => !a.dismissed) || [];
  if (active.length === 0) return null;

  return (
    <Link
      to="/analises"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-semibold"
    >
      <Bell className="h-3 w-3" />
      {active.length} alerta{active.length > 1 ? 's' : ''}
    </Link>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const HomePage = () => {
  const {
    mounted,
    financialData,
    formatCurrency,
    summary,
    user,
    alerts,
    transactions,
    addTransaction,
    removeTransaction,
    currentMonthTransactions,
    totalTransactionsThisMonth,
    // Payment sources
    paymentSources,
    defaultPaymentSource,
    spentBySourceThisMonth,
    sourceLimitAlerts,
    totalOwnSourcesThisMonth,
  } = useFinancial();

  const { container, item } = usePageVariants();
  const { greeting, subtitle } = useGreeting(user?.displayName);
  const [showModal, setShowModal] = useState(false);

  const hasData    = financialData.monthlyIncome > 0;
  const hasSources = paymentSources.length > 0;

  // Sobra planejada mensal
  const plannedSurplus = summary.monthlySurplus || 0;

  // Últimas 5 transações do mês para o feed
  const recentTransactions = useMemo(
    () => currentMonthTransactions.slice(0, 5),
    [currentMonthTransactions],
  );

  // Fontes que têm gasto no mês atual OU têm limite configurado
  // — exibimos termômetro individual só para elas
  const sourcesWithData = useMemo(() => {
    return paymentSources.filter(source =>
      spentBySourceThisMonth.has(source.id) || source.monthlyLimit
    );
  }, [paymentSources, spentBySourceThisMonth]);

  const handleAdd = useCallback((transaction) => {
    addTransaction(transaction);
  }, [addTransaction]);

  if (!mounted) return <HomeSkeleton />;

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="space-y-4 pb-4"
      >

        {/* ── Saudação + chip de alertas ───────────────────────────────── */}
        <motion.div variants={item} className="pt-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold">{greeting}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <AlertsChip alerts={alerts} />
          </div>
        </motion.div>

        {/* ── Estado vazio ─────────────────────────────────────────────── */}
        {!hasData ? (
          <motion.div variants={item}>
            <DashboardEmpty />
          </motion.div>
        ) : (
          <>
            {/* ── Alertas de limite por fonte ─────────────────────────── */}
            {sourceLimitAlerts.length > 0 && (
              <motion.div variants={item}>
                <SourceLimitAlerts
                  alerts={sourceLimitAlerts}
                  formatCurrency={formatCurrency}
                />
              </motion.div>
            )}

            {/* ── Termômetro principal (seu dinheiro) ─────────────────── */}
            <motion.div variants={item}>
              <Thermometer
                title="Disponível este mês"
                subtitle={hasSources ? 'Suas fontes próprias' : undefined}
                spent={hasSources ? totalOwnSourcesThisMonth : totalTransactionsThisMonth}
                limit={plannedSurplus}
                formatCurrency={formatCurrency}
                accentColor="bg-emerald-400"
                showDays
              />
            </motion.div>

            {/* ── Termômetros por fonte (só as que têm dados ou limite) ── */}
            {sourcesWithData.map(source => {
              const spent      = spentBySourceThisMonth.get(source.id) || 0;
              // Se não tem limite, usa o surplus planejado como referência visual
              const limit      = source.monthlyLimit || plannedSurplus;
              const hasLimit   = !!source.monthlyLimit;

              return (
                <motion.div key={source.id} variants={item}>
                  <Thermometer
                    title={source.name}
                    subtitle={
                      source.owner === 'third_party' && source.ownerName
                        ? `Conta de ${source.ownerName}${!hasLimit ? ' · sem limite definido' : ''}`
                        : !hasLimit ? 'Sem limite definido' : undefined
                    }
                    spent={spent}
                    limit={limit}
                    formatCurrency={formatCurrency}
                    accentColor={`bg-[${source.color}]`}
                  />
                </motion.div>
              );
            })}

            {/* ── Botão primário de lançamento ────────────────────────── */}
            <motion.div variants={item}>
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20"
              >
                <Plus className="h-5 w-5" />
                Registrar gasto
              </button>
            </motion.div>

            {/* ── Feed de gastos do mês ───────────────────────────────── */}
            <motion.div variants={item}>
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">
                    Gastos registrados
                    {currentMonthTransactions.length > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        ({currentMonthTransactions.length})
                      </span>
                    )}
                  </p>
                  {currentMonthTransactions.length > 5 && (
                    <Link
                      to="/planejamento"
                      className="text-xs text-primary flex items-center gap-0.5"
                    >
                      ver todos <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="py-6 text-center">
                    <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum gasto registrado este mês</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Use o botão acima para lançar
                    </p>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="px-4 py-1">
                      <AnimatePresence initial={false}>
                        {recentTransactions.map(t => (
                          <TransactionItem
                            key={t.id}
                            transaction={t}
                            onRemove={removeTransaction}
                            formatCurrency={formatCurrency}
                            paymentSources={paymentSources}
                          />
                        ))}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>

            {/* ── CTA para análise ────────────────────────────────────── */}
            <motion.div variants={item}>
              <Link
                to="/analises"
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/40 hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Análise completa</p>
                    <p className="text-[10px] text-muted-foreground">Score, projeções e sugestões</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </motion.div>

          </>
        )}
      </motion.div>

      {/* ── Modal de lançamento ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <QuickAddModal
            onClose={() => setShowModal(false)}
            onAdd={handleAdd}
            formatCurrency={formatCurrency}
            paymentSources={paymentSources}
            defaultPaymentSource={defaultPaymentSource}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default HomePage;