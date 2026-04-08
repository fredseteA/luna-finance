import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { ExplainableScore } from '../components/score/ExplainableScore';
import { SuggestionsPanel } from '../components/suggestions/SuggestionsPanel';
import { Card, CardContent } from '../components/ui/card';
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

export const AnalisesPage = () => {
  const { mounted, scoreBreakdown, summary, financialData, formatCurrency } = useFinancial();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const hasData = financialData.monthlyIncome > 0;

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
          <BarChart3 className="h-5 w-5 text-primary" />
          Análises
        </h1>
        <p className="text-sm text-muted-foreground">Entenda sua saúde financeira</p>
      </motion.div>

      {!hasData ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="text-center py-10">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium mb-1">Configure seus dados</p>
              <p className="text-xs text-muted-foreground">Acesse Planejamento para começar</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Quick Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-1.5 text-primary mb-0.5">
                <Award className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase">Score</span>
              </div>
              <p className="text-xl font-mono font-bold">{scoreBreakdown.totalScore}<span className="text-sm text-muted-foreground">/{scoreBreakdown.maxScore}</span></p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase">Poupança</span>
              </div>
              <p className="text-xl font-mono font-bold">{summary.savingsRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-1.5 text-blue-400 mb-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase">Crescimento</span>
              </div>
              <p className="text-xl font-mono font-bold">{summary.totalGrowthPercentage.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase">Melhorias</span>
              </div>
              <p className="text-xl font-mono font-bold">{scoreBreakdown.improvements?.length || 0}</p>
            </div>
          </motion.div>

          {/* Score Card */}
          <motion.div variants={itemVariants}>
            <ExplainableScore />
          </motion.div>

          {/* Suggestions */}
          <motion.div variants={itemVariants}>
            <SuggestionsPanel />
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default AnalisesPage;
