import React from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { FinancialGoal } from '../components/goals/FinancialGoal';
import { LifeObjectives } from '../components/goals/LifeObjectives';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useFinancial } from '../contexts/FinancialContext';
import { calculateTimeToGoal } from '../services/financialEngine';

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

export const MetasPage = () => {
  const { mounted, financialData, settings, lifeObjectives, formatCurrency, summary } = useFinancial();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const millionConfig = {
    targetAmount: 1000000,
    initialPatrimony: financialData.initialPatrimony,
    monthlyIncome: financialData.monthlyIncome,
    fixedCosts: financialData.fixedCosts,
    variableExpenses: financialData.variableExpenses,
    allocation: financialData.allocation,
    rates: settings.rates,
    surplusAllocation: financialData.surplusAllocation,
  };

  const timeToMillion = calculateTimeToGoal(millionConfig);

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
          <Target className="h-5 w-5 text-primary" />
          Metas
        </h1>
        <p className="text-sm text-muted-foreground">Seus objetivos de vida</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-1.5 text-primary mb-0.5">
            <Target className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Objetivos</span>
          </div>
          <p className="text-xl font-mono font-bold">{lifeObjectives.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Patrimônio</span>
          </div>
          <p className="text-lg font-mono font-bold">{formatCurrency(financialData.initialPatrimony)}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-1.5 text-blue-400 mb-0.5">
            <Trophy className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">Projetado</span>
          </div>
          <p className="text-lg font-mono font-bold">{formatCurrency(summary.projectedPatrimony)}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase">R$ 1M em</span>
          </div>
          <p className="text-lg font-mono font-bold">
            {timeToMillion.reachable ? `${timeToMillion.years}a` : 'N/A'}
          </p>
        </div>
      </motion.div>

      {/* Goals */}
      <motion.div variants={itemVariants}>
        <FinancialGoal />
      </motion.div>
      <motion.div variants={itemVariants}>
        <LifeObjectives />
      </motion.div>

      {/* Tips */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary/10 to-emerald-500/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">💡 Dicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>• Defina metas SMART (específicas, mensuráveis, alcançáveis)</p>
            <p>• Comece com reserva de emergência de 6 meses</p>
            <p>• Automatize seus investimentos mensais</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default MetasPage;
