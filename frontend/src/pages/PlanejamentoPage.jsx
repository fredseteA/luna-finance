import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, DollarSign, CreditCard, ShoppingBag, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IncomeForm } from '../components/forms/IncomeForm';
import { ExpensesForm } from '../components/forms/ExpensesForm';
import { useFinancial } from '../contexts/FinancialContext';
import { usePageVariants } from '../lib/animationVariants';
import { ExportData } from '../components/export/ExportData';
import { SmartAlerts } from '@/components/alerts/SmartAlerts';

export const PlanejamentoPage = () => {
  const { mounted, financialData, formatCurrency, paymentSources, spentBySourceThisMonth } = useFinancial();
  const { container, item } = usePageVariants();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const totalFixedCosts       = financialData.fixedCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalVariableExpenses = financialData.variableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const surplus               = financialData.monthlyIncome - totalFixedCosts - totalVariableExpenses;
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-4"
    >
      {/* Header */}
      <motion.div variants={item} className="pt-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Planejamento
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie renda e despesas</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={item} className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Renda</span>
          </div>
          <p className="text-lg font-mono font-bold">{formatCurrency(financialData.monthlyIncome)}</p>
        </div>
        <div className={`p-3 rounded-xl border ${surplus >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <div className={`flex items-center gap-1.5 ${surplus >= 0 ? 'text-blue-400' : 'text-rose-400'} mb-0.5`}>
            <Wallet className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Sobra</span>
          </div>
          <p className="text-lg font-mono font-bold">{formatCurrency(surplus)}</p>
        </div>
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-1.5 text-rose-400 mb-0.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Fixos</span>
          </div>
          <p className="text-lg font-mono font-bold">{formatCurrency(totalFixedCosts)}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Variáveis</span>
          </div>
          <p className="text-lg font-mono font-bold">{formatCurrency(totalVariableExpenses)}</p>
        </div>
      </motion.div>

      {/* ── Acesso às fontes de pagamento ─────────────────────────────────── */}
      <motion.div variants={item}>
        <Link
          to="/planejamento/fontes"
          className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border border-border/60 hover:bg-muted transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Fontes de Pagamento</p>
              <p className="text-[11px] text-muted-foreground">
                {paymentSources.length === 0
                  ? 'Nenhuma cadastrada — toque para adicionar'
                  : `${paymentSources.length} fonte${paymentSources.length > 1 ? 's' : ''} cadastrada${paymentSources.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      </motion.div>

      {/* Preview rápido das fontes com gasto no mês — só exibe se existirem */}
      {paymentSources.length > 0 && (
        <motion.div variants={item} className="space-y-2">
          {paymentSources
            .filter(s => spentBySourceThisMonth.has(s.id))
            .slice(0, 3)
            .map(source => {
              const spent = spentBySourceThisMonth.get(source.id) || 0;
              return (
                <div
                  key={source.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-muted/30 border border-border/40"
                >
                  <div className="flex items-center gap-2">
                    {/* Dot colorido */}
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm font-medium">{source.name}</span>
                    {source.owner === 'third_party' && source.ownerName && (
                      <span className="text-[10px] text-muted-foreground">({source.ownerName})</span>
                    )}
                  </div>
                  <span className="font-mono text-sm font-semibold text-rose-400">
                    -{formatCurrency(spent)}
                  </span>
                </div>
              );
            })}
        </motion.div>
      )}

      {/* Forms */}
      <motion.div variants={item}>
        <IncomeForm />
      </motion.div>
      <motion.div variants={item}>
        <ExpensesForm />
      </motion.div>

      {/* Smart Alerts */}
      <div>
        <SmartAlerts />
      </div>

      {/* Export */}
      <motion.div variants={itemVariants}>
        <ExportData />
      </motion.div>
    </motion.div>
  );
};

export default PlanejamentoPage;