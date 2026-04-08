import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, GitCompare, Save } from 'lucide-react';
import { ScenariosManager } from '../components/scenarios/ScenariosManager';
import { ScenarioComparison } from '../components/scenarios/ScenarioComparison';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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

export const CenariosPage = () => {
  const { mounted, scenarios } = useFinancial();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

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
          <FolderOpen className="h-5 w-5 text-primary" />
          Cenários
        </h1>
        <p className="text-sm text-muted-foreground">Salve e compare</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
          <FolderOpen className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-mono font-bold">{scenarios.length}</p>
          <p className="text-[10px] text-muted-foreground">Salvos</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <GitCompare className="h-4 w-4 mx-auto text-blue-400 mb-1" />
          <p className="text-lg font-mono font-bold">{scenarios.length >= 2 ? '✓' : '-'}</p>
          <p className="text-[10px] text-muted-foreground">Comparar</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <Save className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
          <p className="text-lg font-mono font-bold">{10 - scenarios.length}</p>
          <p className="text-[10px] text-muted-foreground">Restantes</p>
        </div>
      </motion.div>

      {/* Scenarios Manager */}
      <motion.div variants={itemVariants}>
        <ScenariosManager />
      </motion.div>

      {/* Comparison */}
      <motion.div variants={itemVariants}>
        <ScenarioComparison />
      </motion.div>

      {/* Tips */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">💡 Dicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>• Salve antes de fazer grandes mudanças</p>
            <p>• Crie cenários: pessimista, realista, otimista</p>
            <p>• Use nomes descritivos para identificar</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CenariosPage;
