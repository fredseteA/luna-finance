import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, Target, ArrowUpRight } from 'lucide-react';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { PatrimonyChart } from '../components/charts/PatrimonyChart';
import { PortfolioChart } from '../components/charts/PortfolioChart';
import { MonthlyBreakdownChart } from '../components/charts/MonthlyBreakdownChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LineChart, PieChart, BarChart3 } from 'lucide-react';
import { useFinancial } from '../contexts/FinancialContext';

// Componentes extraídos / novos
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { DashboardEmpty } from '../components/dashboard/DashboardEmpty';
import { useGreeting } from '../hooks/useGreeting';
import { usePersistedTab } from '../hooks/usePersistedTab';
import { usePageVariants } from '../lib/animationVariants';

// ─── Componente principal ─────────────────────────────────────────────────────

export const DashboardPage = () => {
  const { mounted, financialData, formatCurrency, summary, user } = useFinancial();

  // prefers-reduced-motion via hook centralizado
  const { container: containerVariants, item: itemVariants } = usePageVariants();

  // P1 — saudação dinâmica por período do dia
  const { greeting, subtitle } = useGreeting(user?.displayName);

  // P2 — aba ativa persistida entre navegações
  const [activeTab, setActiveTab] = usePersistedTab('dashboard:activeTab', 'evolution');

  // P1 — skeleton enquanto Firebase ainda carrega
  if (!mounted) {
    return <DashboardSkeleton />;
  }

  const hasData = financialData.monthlyIncome > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-4"
    >
      {/* ── Saudação ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="pt-2">
        <h1 className="text-xl font-bold">{greeting}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </motion.div>

      {/* ── Estado vazio (P1) ─────────────────────────────────────────────
          Sem dados: exibe onboarding intencional, sem SummaryCards zerado.
          Com dados: exibe o fluxo normal. */}
      {!hasData ? (
        <motion.section variants={itemVariants}>
          <DashboardEmpty />
        </motion.section>
      ) : (
        <>
          {/* ── Summary Cards ──────────────────────────────────────────── */}
          <motion.section variants={itemVariants}>
            <SummaryCards />
          </motion.section>

          {/* ── Gráficos com aba persistida (P2) ──────────────────────── */}
          <motion.section variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          {/* ── Card Resumo diferenciado (P2) ─────────────────────────────
              Não duplica os SummaryCards. Foca em métricas de longo prazo
              que não aparecem nos cards: rendimentos vs aportes e próxima
              meta financeira. */}
          <motion.section variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Composição do crescimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {/* Rendimentos vs aportes — mostra a composição do crescimento */}
                <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                  <div>
                    <p className="text-sm font-medium">Rendimentos</p>
                    <p className="text-xs text-muted-foreground">Juros compostos projetados</p>
                  </div>
                  <span className="font-mono font-semibold text-emerald-400 text-sm">
                    {formatCurrency(summary.totalReturns)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                  <div>
                    <p className="text-sm font-medium">Aportes</p>
                    <p className="text-xs text-muted-foreground">Total investido no período</p>
                  </div>
                  <span className="font-mono font-semibold text-sm">
                    {formatCurrency(summary.totalContributions)}
                  </span>
                </div>

                {/* Impacto da inflação — dado exclusivo aqui */}
                {summary.inflationImpact > 0 && (
                  <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                    <div>
                      <p className="text-sm font-medium">Impacto da inflação</p>
                      <p className="text-xs text-muted-foreground">Perda de poder de compra</p>
                    </div>
                    <span className="font-mono font-semibold text-amber-400 text-sm">
                      -{formatCurrency(summary.inflationImpact)}
                    </span>
                  </div>
                )}

                {/* Proporção rendimentos/aportes — insight único */}
                {summary.totalContributions > 0 && (
                  <div className="flex justify-between items-center py-2.5">
                    <div>
                      <p className="text-sm font-medium">Retorno sobre aportes</p>
                      <p className="text-xs text-muted-foreground">Rendimentos ÷ aportes totais</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-mono font-semibold text-emerald-400 text-sm">
                        {((summary.totalReturns / summary.totalContributions) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </>
      )}
    </motion.div>
  );
};

export default DashboardPage;