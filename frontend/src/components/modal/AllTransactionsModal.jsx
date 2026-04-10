import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trash2, Filter, ChevronDown,
  ShoppingBag, Car, Heart, Utensils,
  Gamepad2, BookOpen, Zap, MoreHorizontal,
  Wallet, CreditCard, Banknote, Calendar,
  Search, SlidersHorizontal,
} from 'lucide-react';

// ─── Deve corresponder ao mesmo mapeamento do HomePage ────────────────────────

const CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação', icon: Utensils,       color: 'text-orange-400', bg: 'bg-orange-500/15' },
  { id: 'transporte',  label: 'Transporte',  icon: Car,            color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { id: 'saude',       label: 'Saúde',       icon: Heart,          color: 'text-rose-400',   bg: 'bg-rose-500/15'   },
  { id: 'lazer',       label: 'Lazer',       icon: Gamepad2,       color: 'text-pink-400',   bg: 'bg-pink-500/15'   },
  { id: 'compras',     label: 'Compras',     icon: ShoppingBag,    color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
  { id: 'educacao',    label: 'Educação',    icon: BookOpen,       color: 'text-cyan-400',   bg: 'bg-cyan-500/15'   },
  { id: 'contas',      label: 'Contas',      icon: Zap,            color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  { id: 'outros',      label: 'Outros',      icon: MoreHorizontal, color: 'text-slate-400',  bg: 'bg-slate-500/15'  },
];

const getCategoryConfig = (categoryId) =>
  CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];

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

const formatDateDisplay = (dateStr) => {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (dateStr === today)     return 'hoje';
  if (dateStr === yesterday) return 'ontem';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
};

// ─── Item de transação ────────────────────────────────────────────────────────

const TransactionRow = ({ transaction, onRemove, formatCurrency, paymentSources }) => {
  const cat    = getCategoryConfig(transaction.category);
  const Icon   = cat.icon;
  const source = paymentSources.find(s => s.id === transaction.sourceId);
  const [confirming, setConfirming] = useState(false);

  const handleRemove = () => {
    if (confirming) {
      onRemove(transaction.id);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2500);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0 group"
    >
      {/* Ícone categoria */}
      <div className={`h-9 w-9 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${cat.color}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {cat.label} · {formatDateDisplay(transaction.date)}
          </span>
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

      {/* Valor + remover */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono font-semibold text-sm text-rose-400">
          -{formatCurrency(transaction.amount)}
        </span>
        <button
          onClick={handleRemove}
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
            confirming
              ? 'bg-rose-500/20 text-rose-400 opacity-100'
              : 'bg-muted opacity-0 group-hover:opacity-100 text-muted-foreground'
          }`}
          title={confirming ? 'Clique novamente para confirmar' : 'Remover'}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Modal principal ──────────────────────────────────────────────────────────

export const AllTransactionsModal = ({
  onClose,
  transactions,           // todas as transações (não só o mês atual)
  currentMonthTransactions,
  removeTransaction,
  formatCurrency,
  paymentSources,
}) => {
  // ── Estado dos filtros ────────────────────────────────────────────────────
  const today      = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().slice(0, 10);

  const [showAll,      setShowAll]      = useState(false);   // mês atual vs todos
  const [sourceFilter, setSourceFilter] = useState('all');   // id da fonte ou 'all'
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const [search,       setSearch]       = useState('');

  // Pool base: mês atual ou todos
  const basePool = showAll ? transactions : currentMonthTransactions;

  // Aplica filtros
  const filtered = useMemo(() => {
    return basePool.filter(t => {
      // fonte
      if (sourceFilter !== 'all' && t.sourceId !== sourceFilter) return false;
      // data de
      if (dateFrom && t.date < dateFrom) return false;
      // data até
      if (dateTo && t.date > dateTo) return false;
      // busca textual
      if (search.trim()) {
        const q = search.toLowerCase();
        const cat = getCategoryConfig(t.category);
        if (
          !t.description.toLowerCase().includes(q) &&
          !cat.label.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date)); // mais recente primeiro
  }, [basePool, sourceFilter, dateFrom, dateTo, search]);

  // Total filtrado
  const totalFiltered = useMemo(
    () => filtered.reduce((sum, t) => sum + t.amount, 0),
    [filtered],
  );

  const activeFilterCount = [
    sourceFilter !== 'all',
    !!dateFrom,
    !!dateTo,
    !!search.trim(),
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSourceFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-md bg-card border border-border rounded-t-2xl z-10 flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 80px)' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-3 mb-1 shrink-0" />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-5 pt-2 pb-3 shrink-0 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold">Todos os gastos</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {filtered.length} registro{filtered.length !== 1 ? 's' : ''} ·{' '}
                <span className="font-mono font-semibold text-rose-400">
                  -{formatCurrency(totalFiltered)}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Toggle mês atual / todos */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowAll(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !showAll
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Mês atual
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                showAll
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Todos os meses
            </button>
          </div>

          {/* Busca + botão filtros */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar gasto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[9px] text-white font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Painel de filtros expansível */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">

                  {/* Fonte de pagamento */}
                  {paymentSources.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Fonte de pagamento
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setSourceFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            sourceFilter === 'all'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          Todas
                        </button>
                        <button
                          onClick={() => setSourceFilter(null)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            sourceFilter === null
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          Sem fonte
                        </button>
                        {paymentSources.map(source => (
                          <button
                            key={source.id}
                            onClick={() => setSourceFilter(source.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                            style={
                              sourceFilter === source.id
                                ? { backgroundColor: source.color + '33', color: source.color, outline: `1px solid ${source.color}55` }
                                : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                            }
                          >
                            <SourceIcon type={source.type} className="h-3 w-3" />
                            {source.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Período */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Período
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateFrom}
                        max={dateTo || today}
                        onChange={e => setDateFrom(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-muted border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">até</span>
                      <input
                        type="date"
                        value={dateTo}
                        min={dateFrom}
                        max={today}
                        onChange={e => setDateTo(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-muted border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  {/* Limpar filtros */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-muted-foreground underline underline-offset-2"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Lista ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 pb-20">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum gasto encontrado</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary mt-2 underline underline-offset-2"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map(t => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onRemove={removeTransaction}
                  formatCurrency={formatCurrency}
                  paymentSources={paymentSources}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};