import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Percent, PieChart, BarChart3 } from 'lucide-react';
import { InvestmentForm } from '../components/forms/InvestmentForm';
import { SurplusAllocation } from '../components/forms/SurplusAllocation';
import { PortfolioChart } from '../components/charts/PortfolioChart';
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

export const InvestimentosPage = () => {
  const { mounted, financialData, settings, formatCurrency, projection } = useFinancial();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const lastMonth = projection.length > 0 ? projection[projection.length - 1] : null;
  const totalPatrimony = lastMonth ? lastMonth.patrimony : financialData.initialPatrimony;
  const totalReturns = projection.reduce((sum, m) => sum + m.investmentReturns, 0);

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
          <TrendingUp className="h-5 w-5 text-primary" />
          Investimentos
        </h1>
        <p className="text-sm text-muted-foreground">Alocação e taxas</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-1.5 text-primary mb-0.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Patrimônio</span>
          </div>
          <p className="text-lg font-mono font-bold">{formatCurrency(totalPatrimony)}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Rendimentos</span>
          </div>
          <p className="text-lg font-mono font-bold">{formatCurrency(totalReturns)}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-1.5 text-blue-400 mb-0.5">
            <Percent className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">CDI</span>
          </div>
          <p className="text-lg font-mono font-bold">{settings.rates.cdi}% a.a.</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
            <PieChart className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">FII Yield</span>
          </div>
          <p className="text-lg font-mono font-bold">{settings.rates.fii}% a.m.</p>
        </div>
      </motion.div>

      {/* Portfolio Chart */}
      <motion.div variants={itemVariants}>
        <PortfolioChart />
      </motion.div>

      {/* Forms */}
      <motion.div variants={itemVariants}>
        <InvestmentForm />
      </motion.div>
      <motion.div variants={itemVariants}>
        <SurplusAllocation />
      </motion.div>
    </motion.div>
  );
};

export default InvestimentosPage;
