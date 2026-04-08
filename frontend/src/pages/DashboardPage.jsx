import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, TrendingUp, Target, Settings, ChevronRight } from 'lucide-react';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { PatrimonyChart } from '../components/charts/PatrimonyChart';
import { PortfolioChart } from '../components/charts/PortfolioChart';
import { MonthlyBreakdownChart } from '../components/charts/MonthlyBreakdownChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LineChart, PieChart, BarChart3 } from 'lucide-react';
import { useFinancial } from '../contexts/FinancialContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const QuickAction = ({ to, icon: Icon, title, description, color }) => (
  <Link to={to}>
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card active:bg-muted/50 transition-all"
    >
      <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </motion.div>
  </Link>
);

export const DashboardPage = () => {
  const { mounted, financialData, formatCurrency, summary } = useFinancial();

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
      {/* Greeting */}
      <motion.div variants={itemVariants} className="pt-2">
        <h1 className="text-xl font-bold">Olá! 👋</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seu patrimônio</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.section variants={itemVariants}>
        <SummaryCards />
      </motion.section>

      {/* Quick Actions */}
      {!hasData && (
        <motion.section variants={itemVariants} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Comece agora</h2>
          <div className="space-y-2">
            <QuickAction
              to="/planejamento"
              icon={Wallet}
              title="Configurar Renda"
              description="Defina sua renda e despesas mensais"
              color="bg-emerald-500"
            />
            <QuickAction
              to="/investimentos"
              icon={TrendingUp}
              title="Investimentos"
              description="Configure sua carteira de investimentos"
              color="bg-blue-500"
            />
            <QuickAction
              to="/metas"
              icon={Target}
              title="Definir Metas"
              description="Trace seus objetivos financeiros"
              color="bg-amber-500"
            />
          </div>
        </motion.section>
      )}

      {/* Charts */}
      {hasData && (
        <motion.section variants={itemVariants}>
          <Tabs defaultValue="evolution" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-3 h-12">
              <TabsTrigger value="evolution" className="gap-1.5 text-xs">
                <LineChart className="h-4 w-4" />
                Evolução
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-1.5 text-xs">
                <PieChart className="h-4 w-4" />
                Carteira
              </TabsTrigger>
              <TabsTrigger value="flow" className="gap-1.5 text-xs">
                <BarChart3 className="h-4 w-4" />
                Fluxo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="evolution" className="mt-0">
              <PatrimonyChart />
            </TabsContent>
            <TabsContent value="portfolio" className="mt-0">
              <PortfolioChart />
            </TabsContent>
            <TabsContent value="flow" className="mt-0">
              <MonthlyBreakdownChart />
            </TabsContent>
          </Tabs>
        </motion.section>
      )}

      {/* Quick Stats when has data */}
      {hasData && (
        <motion.section variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">Crescimento projetado</span>
                <span className="font-mono font-semibold text-emerald-400">
                  +{formatCurrency(summary.totalGrowth)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">Rendimentos totais</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(summary.totalReturns)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Aportes totais</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(summary.totalContributions)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}
    </motion.div>
  );
};

export default DashboardPage;
