import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PiggyBank } from 'lucide-react';
import { InvestmentForm } from '../components/forms/InvestmentForm';
import { SurplusAllocation } from '../components/forms/SurplusAllocation';
import { TieredContributions } from '../components/forms/TieredContributions';
import { PortfolioChart } from '../components/charts/PortfolioChart';
import { useFinancial } from '../contexts/FinancialContext';
import { InvestimentosSkeleton } from '../components/dashboard/InvestimentosSkeleton';
import { InvestimentosEmpty } from '../components/dashboard/InvestimentosEmpty';
import { usePageVariants } from '../lib/animationVariants';

const fiiMonthlyToAnnual = (monthly) =>
  (Math.pow(1 + monthly / 100, 12) - 1) * 100;

const KpiCard = ({ label, value, colorClass, borderClass, icon: Icon }) => (
  <div className={`p-3 rounded-xl ${colorClass} border ${borderClass}`}>
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-lg font-mono font-bold leading-tight">{value}</p>
  </div>
);

/**
 * AporteCard — exibe dois valores para evitar confusão:
 * - "configurado": o que o usuário definiu (Destino da Sobra ou faixa ativa do mês 1)
 * - "média projetada": média calculada pelo motor ao longo de todos os meses
 */
const AporteCard = ({ configured, projected, colorClass, borderClass, icon: Icon, hasTiers }) => (
  <div className={`p-3 rounded-xl ${colorClass} border ${borderClass}`}>
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[10px] font-medium uppercase tracking-wide">Aporte/mês</span>
    </div>
    <div className="space-y-1.5">
      <div>
        <p className="text-lg font-mono font-bold leading-tight">{configured}</p>
        <p className="text-[10px] opacity-70 leading-none mt-0.5">
          {hasTiers ? 'faixa inicial' : 'configurado'}
        </p>
      </div>
      <div className="border-t border-current/20 pt-1.5">
        <p className="text-sm font-mono font-semibold leading-tight opacity-80">{projected}</p>
        <p className="text-[10px] opacity-60 leading-none mt-0.5">média projetada</p>
      </div>
    </div>
  </div>
);

const RateChip = ({ label, value, irNote }) => (
  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border/30">
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium">{label}</span>
      {irNote && (
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {irNote}
        </span>
      )}
    </div>
    <span className="font-mono text-xs font-semibold">{value}% a.a.</span>
  </div>
);

export const InvestimentosPage = () => {
  const { mounted, financialData, settings, formatCurrency, projection } = useFinancial();
  const { container, item } = usePageVariants();

  if (!mounted) return <InvestimentosSkeleton />;

  const hasData = financialData.monthlyIncome > 0 || financialData.initialPatrimony > 0;

  const lastMonth = projection.length > 0 ? projection[projection.length - 1] : null;
  const totalPatrimony = lastMonth ? lastMonth.patrimony : (financialData.initialPatrimony || 0);
  const totalReturns = projection.reduce((sum, m) => sum + (m.investmentReturns || 0), 0);

  // Aporte configurado: faixa do mês 1 (se existir) ou percentual da sobra
  const tiers = financialData.tieredContributions || [];
  const hasTiers = tiers.length > 0;
  const firstMonthProjection = projection[0];
  const configuredContribution = firstMonthProjection?.surplusForInvestments ?? 0;

  // Média projetada ao longo de todos os meses
  const avgProjectedContribution = projection.length > 0
    ? projection.reduce((sum, m) => sum + Math.max(0, m.surplusForInvestments ?? 0), 0) / projection.length
    : 0;

  const rates = settings.rates || {};
  const fiiAnnual = rates.fii ? fiiMonthlyToAnnual(rates.fii).toFixed(1) : '—';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-4"
    >
      <motion.div variants={item} className="pt-2">
        <h1 className="text-xl font-bold">
          {hasData ? 'Sua carteira' : 'Investimentos'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {hasData && projection.length > 0
            ? `Projeção para ${financialData.durationMonths || 12} meses`
            : 'Alocação e taxas'}
        </p>
      </motion.div>

      {!hasData ? (
        <motion.section variants={item}>
          <InvestimentosEmpty />
        </motion.section>
      ) : (
        <>
          {/* KPIs */}
          <motion.div variants={item} className="grid grid-cols-3 gap-2">
            <KpiCard
              label="Patrimônio"
              value={formatCurrency(totalPatrimony)}
              colorClass="bg-primary/10 text-primary"
              borderClass="border-primary/20"
              icon={TrendingUp}
            />
            <KpiCard
              label="Rendimentos"
              value={formatCurrency(totalReturns)}
              colorClass="bg-emerald-500/10 text-emerald-400"
              borderClass="border-emerald-500/20"
              icon={BarChart3}
            />
            <AporteCard
              configured={formatCurrency(configuredContribution)}
              projected={formatCurrency(avgProjectedContribution)}
              colorClass="bg-blue-500/10 text-blue-400"
              borderClass="border-blue-500/20"
              icon={PiggyBank}
              hasTiers={hasTiers}
            />
          </motion.div>

          {/* Taxas de mercado */}
          <motion.div variants={item} className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
              Taxas de mercado configuradas
            </p>
            <div className="space-y-1">
              <RateChip label="CDI" value={rates.cdi ?? '—'} irNote="IR regressivo" />
              <RateChip label="Tesouro Selic" value={rates.selic ?? '—'} irNote="IR regressivo" />
              <RateChip label="CDB" value={rates.cdb ?? '—'} irNote="IR regressivo" />
              <RateChip label="FII" value={fiiAnnual} irNote="Isento IR" />
            </div>
            <p className="text-[10px] text-muted-foreground px-0.5">
              Altere as taxas no formulário abaixo · valores convertidos para a.a.
            </p>
          </motion.div>

          {/* Gráfico */}
          <motion.div variants={item}>
            <PortfolioChart />
          </motion.div>

          {/* Formulários */}
          <motion.div variants={item}>
            <InvestmentForm />
          </motion.div>
          <motion.div variants={item}>
            <SurplusAllocation />
          </motion.div>

          {/* Aportes por período — novo */}
          <motion.div variants={item}>
            <TieredContributions />
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default InvestimentosPage;