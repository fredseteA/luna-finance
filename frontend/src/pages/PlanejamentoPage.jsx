import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, DollarSign, CreditCard, ShoppingBag } from 'lucide-react';
import { IncomeForm } from '../components/forms/IncomeForm';
import { ExpensesForm } from '../components/forms/ExpensesForm';
import { useFinancial } from '../contexts/FinancialContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const PlanejamentoPage = () => {
  const { mounted, financialData, formatCurrency } = useFinancial();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const totalFixedCosts = financialData.fixedCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalVariableExpenses = financialData.variableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const surplus = financialData.monthlyIncome - totalFixedCosts - totalVariableExpenses;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="pt-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Planejamento
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie renda e despesas</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
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

      {/* Forms */}
      <motion.div variants={itemVariants}>
        <IncomeForm />
      </motion.div>
      <motion.div variants={itemVariants}>
        <ExpensesForm />
      </motion.div>
    </motion.div>
  );
};

export default PlanejamentoPage;
