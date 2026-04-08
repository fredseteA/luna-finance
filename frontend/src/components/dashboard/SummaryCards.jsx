import React from 'react';
import { Wallet, TrendingUp, PiggyBank, Percent } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useFinancial } from '../../contexts/FinancialContext';

export const SummaryCards = () => {
  const { summary } = useFinancial();

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        title="Patrimônio Atual"
        value={summary.currentPatrimony}
        type="currency"
        trend="neutral"
        icon={Wallet}
        testId="current-patrimony-card"
        compact
      />
      <MetricCard
        title="Patrimônio Projetado"
        value={summary.projectedPatrimony}
        change={summary.totalGrowth}
        changeLabel="crescimento"
        type="currency"
        trend={summary.totalGrowth >= 0 ? 'positive' : 'negative'}
        icon={TrendingUp}
        testId="projected-patrimony-card"
        compact
      />
      <MetricCard
        title="Sobra Mensal"
        value={summary.monthlySurplus}
        type="currency"
        trend={summary.monthlySurplus >= 0 ? 'positive' : 'negative'}
        icon={PiggyBank}
        testId="monthly-surplus-card"
        compact
      />
      <MetricCard
        title="Taxa de Poupança"
        value={summary.savingsRate}
        type="percentage"
        trend={summary.savingsRate >= 20 ? 'positive' : summary.savingsRate >= 10 ? 'neutral' : 'negative'}
        icon={Percent}
        testId="savings-rate-card"
        compact
      />
    </div>
  );
};

export default SummaryCards;
