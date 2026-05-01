import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Check, Trash2, Pencil,
  Wallet, CreditCard, Zap, Banknote,
  ShoppingBag, MoreHorizontal, ChevronLeft,
  User, Users,
  ToggleLeft, ToggleRight,
  CalendarClock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinancial, PAYMENT_SOURCE_TEMPLATES, getBillingCycle, formatBillingCycle, daysUntilClosing } from '../contexts/FinancialContext';
import { Card, CardContent } from '../components/ui/card';
import { usePageVariants } from '@/lib/animationVariants';

// ─── Ícone por tipo ───────────────────────────────────────────────────────────

const TYPE_ICONS = {
  checking:    Wallet,
  credit_card: CreditCard,
  pix:         Zap,
  cash:        Banknote,
  benefit:     ShoppingBag,
  other:       MoreHorizontal,
};

const SourceIcon = ({ type, className }) => {
  const Icon = TYPE_ICONS[type] || Wallet;
  return <Icon className={className} />;
};

// ─── Paleta de cores disponíveis ──────────────────────────────────────────────

const COLOR_OPTIONS = [
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f59e0b',
  '#ec4899',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#6b7280',
];

// ─── Seletor de dia de fechamento ─────────────────────────────────────────────

const ClosingDayPicker = ({ value, onChange }) => {
  // Dias disponíveis: 1 a 28 (evita problemas com fevereiro)
  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
      {/* Opção "sem fechamento" */}
      <button
        onClick={() => onChange(null)}
        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
          value === null
            ? 'bg-primary/15 border-primary/40 text-primary'
            : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
        }`}
      >
        Não usar
      </button>
      {days.map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`w-9 h-8 rounded-lg text-xs font-mono font-semibold transition-all border ${
            value === d
              ? 'bg-primary/15 border-primary/40 text-primary'
              : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
};

// ─── Modal de criação/edição de fonte ────────────────────────────────────────

const SourceModal = ({ source, onClose, onSave }) => {
  const [name,               setName]               = useState(source?.name || '');
  const [type,               setType]               = useState(source?.type || 'checking');
  const [owner,              setOwner]              = useState(source?.owner || 'self');
  const [ownerName,          setOwnerName]          = useState(source?.ownerName || '');
  const [color,              setColor]              = useState(source?.color || '#22c55e');
  const [isDefault,          setIsDefault]          = useState(source?.isDefault || false);
  const [includeInProjection,setIncludeInProjection]= useState(source?.includeInProjection ?? true);
  const [monthlyLimit,       setMonthlyLimit]       = useState(source?.monthlyLimit?.toString() || '');
  // closingDay: null = sem fechamento definido; número = dia do mês
  const [closingDay,         setClosingDay]         = useState(source?.closingDay ?? null);
  const [error,              setError]              = useState('');

  const applyTemplate = (template) => {
    setType(template.type);
    setColor(template.color);
    if (!name) setName(template.label);
  };

  const handleSave = () => {
    if (!name.trim()) { setError('Dê um nome para esta fonte'); return; }
    if (owner === 'third_party' && !ownerName.trim()) {
      setError('Informe o nome do titular desta fonte');
      return;
    }

    const limit = parseFloat(monthlyLimit.replace(',', '.'));

    onSave({
      ...(source || {}),
      name:               name.trim(),
      type,
      owner,
      ownerName:          owner === 'third_party' ? ownerName.trim() : '',
      color,
      isDefault,
      includeInProjection,
      monthlyLimit:       !isNaN(limit) && limit > 0 ? limit : null,
      // closingDay só faz sentido para cartão de crédito,
      // mas deixamos salvar para qualquer tipo caso o usuário queira
      closingDay:         closingDay || null,
    });
    onClose();
  };

  // Preview do ciclo atual com base no closingDay escolhido
  const cyclePreview = closingDay ? formatBillingCycle(getBillingCycle(closingDay)) : null;
  const daysLeft     = closingDay ? daysUntilClosing(closingDay) : null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md bg-card border border-border rounded-t-2xl z-10 max-h-[92vh] flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-3 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <h3 className="text-base font-bold">
            {source ? 'Editar fonte' : 'Nova fonte de pagamento'}
          </h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto px-5 pb-8 space-y-5 flex-1">

          {/* Templates prontos — só exibe na criação */}
          {!source && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Começar com um template
              </label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_SOURCE_TEMPLATES.map(t => {
                  const Icon = TYPE_ICONS[t.type] || Wallet;
                  return (
                    <button
                      key={t.type}
                      onClick={() => applyTemplate(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        type === t.type
                          ? 'border-current'
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                      }`}
                      style={type === t.type ? { backgroundColor: t.color + '22', color: t.color, borderColor: t.color + '66' } : {}}
                    >
                      <Icon className="h-3 w-3" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Nome da fonte
            </label>
            <input
              type="text"
              placeholder="ex: Cartão Pai, Pix Nubank, Dinheiro..."
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              autoFocus={!!source}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_SOURCE_TEMPLATES.map(t => {
                const Icon       = TYPE_ICONS[t.type] || Wallet;
                const isSelected = type === t.type;
                return (
                  <button
                    key={t.type}
                    onClick={() => setType(t.type)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dono */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Titular
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOwner('self')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  owner === 'self'
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <User className="h-4 w-4" />
                Minha conta
              </button>
              <button
                onClick={() => setOwner('third_party')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  owner === 'third_party'
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                    : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Users className="h-4 w-4" />
                De outra pessoa
              </button>
            </div>

            <AnimatePresence>
              {owner === 'third_party' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    placeholder="Nome do titular (ex: Pai, Mãe, João...)"
                    value={ownerName}
                    onChange={(e) => { setOwnerName(e.target.value); setError(''); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mt-2"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cor de identificação
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c, '--tw-ring-color': c }}
                />
              ))}
            </div>
          </div>

          {/* ── Dia de fechamento ─────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Dia de fechamento da fatura{' '}
                <span className="normal-case font-normal">(opcional)</span>
              </label>
            </div>

            <ClosingDayPicker value={closingDay} onChange={setClosingDay} />

            {/* Preview do ciclo ativo */}
            <AnimatePresence>
              {cyclePreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20 mt-1">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Fatura atual</p>
                      <p className="text-xs font-semibold text-primary font-mono">{cyclePreview}</p>
                    </div>
                    {daysLeft !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Fecha em</p>
                        <p className={`text-xs font-bold ${daysLeft <= 3 ? 'text-amber-400' : 'text-foreground'}`}>
                          {daysLeft === 0 ? 'hoje' : `${daysLeft} dia${daysLeft > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Define o ciclo da fatura. O limite e os gastos serão contados do dia seguinte ao fechamento até o próximo fechamento.
            </p>
          </div>

          {/* Limite da fatura — label muda se tiver closingDay */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {closingDay ? 'Limite da fatura' : 'Limite mensal'}{' '}
              <span className="normal-case font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value.replace(/[^\d,\.]/g, ''))}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Você receberá alertas ao atingir 80% e 100% deste limite
            </p>
          </div>

          {/* Incluir na projeção */}
          <div
            className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-muted/50 border border-border cursor-pointer"
            onClick={() => setIncludeInProjection(v => !v)}
          >
            <div className="flex-1">
              <p className="text-sm font-medium">Incluir nas análises</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Gastos desta fonte entram no score, projeção e sobra mensal.
                Desative para fontes de terceiros que você não quer computar como gasto próprio.
              </p>
            </div>
            {includeInProjection
              ? <ToggleRight className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              : <ToggleLeft  className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
            }
          </div>

          {/* Fonte padrão */}
          <div
            className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-muted/50 border border-border cursor-pointer"
            onClick={() => setIsDefault(v => !v)}
          >
            <div>
              <p className="text-sm font-medium">Fonte padrão</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Selecionada automaticamente no modal de lançamento
              </p>
            </div>
            {isDefault
              ? <ToggleRight className="h-6 w-6 text-primary shrink-0" />
              : <ToggleLeft  className="h-6 w-6 text-muted-foreground shrink-0" />
            }
          </div>

          {/* Erro */}
          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          {/* Salvar */}
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Check className="h-4 w-4" />
            {source ? 'Salvar alterações' : 'Adicionar fonte'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Card de uma fonte ────────────────────────────────────────────────────────

const SourceCard = ({ source, spent, onEdit, onRemove, formatCurrency }) => {
  const hasLimit  = source.monthlyLimit && source.monthlyLimit > 0;
  const pct       = hasLimit ? Math.min((spent / source.monthlyLimit) * 100, 100) : null;
  const barColor  = pct >= 100 ? 'bg-rose-400' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400';

  // Ciclo de fatura (só para fontes com closingDay)
  const cycle        = source.closingDay ? getBillingCycle(source.closingDay) : null;
  const cycleLabel   = cycle ? formatBillingCycle(cycle) : null;
  const daysLeft     = source.closingDay ? daysUntilClosing(source.closingDay) : null;
  const closingSoon  = daysLeft !== null && daysLeft <= 3;

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/60">
      {/* Ícone colorido */}
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: source.color + '22' }}
      >
        <SourceIcon type={source.type} className="h-5 w-5" style={{ color: source.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{source.name}</p>
          {source.isDefault && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wide">
              padrão
            </span>
          )}
          {source.owner === 'third_party' && source.ownerName && (
            <span className="text-[9px] text-muted-foreground">
              · {source.ownerName}
            </span>
          )}
        </div>

        {/* Linha de status: análises + limite ou ciclo */}
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {source.includeInProjection ? 'Incluída nas análises' : 'Excluída das análises'}
          {hasLimit && !cycleLabel && ` · Limite: ${formatCurrency(source.monthlyLimit)}`}
        </p>

        {/* Ciclo de fatura */}
        {cycleLabel && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <CalendarClock className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-mono text-muted-foreground">
              Fatura: <span className="text-foreground font-semibold">{cycleLabel}</span>
            </span>
            {closingSoon && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                daysLeft === 0
                  ? 'bg-rose-500/15 text-rose-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}>
                {daysLeft === 0 ? 'fecha hoje' : `fecha em ${daysLeft}d`}
              </span>
            )}
            {hasLimit && (
              <span className="text-[10px] text-muted-foreground">
                · limite {formatCurrency(source.monthlyLimit)}
              </span>
            )}
          </div>
        )}

        {/* Barra de progresso quando tem limite */}
        {hasLimit && (
          <div className="mt-2 space-y-0.5">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground">
              {formatCurrency(spent)} de {formatCurrency(source.monthlyLimit)} ({Math.round(pct)}%)
              {cycleLabel && <span className="text-[9px]"> · nesta fatura</span>}
            </p>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(source)}
          className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => onRemove(source.id)}
          className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-400" />
        </button>
      </div>
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

export const PaymentSourcesPage = () => {
  const {
    paymentSources,
    addPaymentSource,
    updatePaymentSource,
    removePaymentSource,
    spentBySourceThisMonth,
    formatCurrency,
    mounted,
  } = useFinancial();
  const { container, item } = usePageVariants();

  const navigate = useNavigate();

  const [showModal, setShowModal]   = useState(false);
  const [editSource, setEditSource] = useState(null);

  const handleSave = (sourceData) => {
    if (editSource) {
      updatePaymentSource(editSource.id, sourceData);
    } else {
      addPaymentSource(sourceData);
    }
    setEditSource(null);
  };

  const handleEdit = (source) => {
    setEditSource(source);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditSource(null);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="space-y-4 pb-4"
      >
        {/* Header com voltar */}
        <motion.div variants={item} className="pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar ao Planejamento
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Fontes de Pagamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre cartões, contas e identifique de onde vêm seus gastos
          </p>
        </motion.div>

        {/* Lista de fontes */}
        {paymentSources.length === 0 ? (
          <motion.div variants={item}>
            <Card>
              <CardContent className="py-10 flex flex-col items-center text-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Nenhuma fonte cadastrada</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    Adicione suas contas e cartões para identificar de onde vêm seus gastos
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar primeira fonte
                </button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div variants={item} className="space-y-2">
              {paymentSources.map(source => (
                <SourceCard
                  key={source.id}
                  source={source}
                  spent={spentBySourceThisMonth.get(source.id) || 0}
                  onEdit={handleEdit}
                  onRemove={removePaymentSource}
                  formatCurrency={formatCurrency}
                />
              ))}
            </motion.div>

            <motion.div variants={item}>
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground flex items-center justify-center gap-2 hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adicionar outra fonte
              </button>
            </motion.div>
          </>
        )}

        {/* Explicação */}
        <motion.div variants={item}>
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-2">
            <p className="text-xs font-semibold text-blue-400">Como funciona</p>
            <ul className="text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
              <li>• Ao registrar um gasto, escolha qual fonte foi utilizada</li>
              <li>• Fontes de terceiros (ex: cartão do pai) podem ser excluídas das suas análises</li>
              <li>• Com limite definido, você recebe alertas ao atingir 80% e 100%</li>
              <li>• Cartões com dia de fechamento têm o limite reiniciado a cada fatura</li>
              <li>• Os relatórios exportados incluem o detalhamento por fonte</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal criar/editar */}
      <AnimatePresence>
        {showModal && (
          <SourceModal
            source={editSource}
            onClose={handleClose}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PaymentSourcesPage;