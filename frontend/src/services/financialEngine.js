/**
 * Financial Engine
 * Core business logic for financial calculations
 * Separated from UI for better testability and maintainability
 */

// Constants
export const CURRENCIES = {
  BRL: { symbol: 'R$', locale: 'pt-BR', code: 'BRL' },
  USD: { symbol: '$', locale: 'en-US', code: 'USD' },
  EUR: { symbol: '€', locale: 'de-DE', code: 'EUR' },
};

export const DEFAULT_RATES = {
  cdi: 13.75,
  cdiPercentage: 100,
  selic: 13.75,
  cdb: 12.5,
  fii: 0.8,
};

// Tax table for CDB/CDI (regressive IR)
const TAX_TABLE = [
  { maxDays: 180, rate: 0.225 },
  { maxDays: 360, rate: 0.20 },
  { maxDays: 720, rate: 0.175 },
  { maxDays: Infinity, rate: 0.15 },
];

export const formatCurrency = (value, currency = 'BRL') => {
  const config = CURRENCIES[currency] || CURRENCIES.BRL;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value, decimals = 2) => `${value.toFixed(decimals)}%`;

export const annualToMonthly = (annualRate) => Math.pow(1 + annualRate / 100, 1 / 12) - 1;

export const monthlyToAnnual = (monthlyRate) => (Math.pow(1 + monthlyRate, 12) - 1) * 100;

export const getTaxRate = (months) => {
  const days = months * 30;
  const bracket = TAX_TABLE.find(t => days <= t.maxDays);
  return bracket ? bracket.rate : 0.15;
};

export const calculateNetReturn = (grossReturn, months, investmentType, taxConfig = { enabled: true, fiiExempt: true }) => {
  if (!taxConfig.enabled) return grossReturn;
  if (investmentType === 'fii' && taxConfig.fiiExempt) return grossReturn;
  if (['cdi', 'selic', 'cdb'].includes(investmentType)) {
    return grossReturn * (1 - getTaxRate(months));
  }
  return grossReturn;
};

export const adjustForInflation = (value, months, annualInflation) => {
  const monthlyInflation = Math.pow(1 + annualInflation / 100, 1 / 12) - 1;
  return value / Math.pow(1 + monthlyInflation, months);
};

export const calculateMonthlySurplus = (income, fixedCosts, variableExpenses) => {
  const totalFixed = fixedCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
  const totalVariable = variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  return income - totalFixed - totalVariable;
};

export const isFixedCostActive = (cost, currentDate) => {
  if (!cost.endDate) return true;
  return currentDate <= new Date(cost.endDate);
};

/**
 * Resolve o aporte de investimento para um mês específico.
 *
 * Lógica de prioridade:
 * 1. tieredContributions — se existir e tiver uma faixa ativa para o mês,
 *    usa o valor fixo definido nessa faixa (ignora surplusAllocation).
 * 2. surplusAllocation — comportamento original: percentual da sobra.
 *
 * tieredContributions é um array de:
 *   { id, fromMonth, toMonth|null, amount }
 *   - fromMonth: número do mês (1-based, relativo ao início da projeção)
 *   - toMonth: último mês inclusivo (null = até o fim)
 *   - amount: valor fixo mensal a investir
 */
export const resolveMonthlyInvestment = (month, surplus, surplusAllocation, tieredContributions = []) => {
  if (!tieredContributions || tieredContributions.length === 0) {
    const pct = (surplusAllocation?.investments ?? 100) / 100;
    return surplus > 0 ? surplus * pct : 0;
  }

  // Encontra a faixa ativa para este mês (última que cobre o mês vence)
  const activeTier = [...tieredContributions]
    .reverse()
    .find(t => {
      const from = t.fromMonth ?? 1;
      const to = t.toMonth ?? Infinity;
      return month >= from && month <= to;
    });

  if (activeTier) {
    // Respeita o teto da sobra disponível — não investe mais do que sobra
    return Math.min(activeTier.amount, Math.max(0, surplus));
  }

  // Fallback para comportamento original
  const pct = (surplusAllocation?.investments ?? 100) / 100;
  return surplus > 0 ? surplus * pct : 0;
};

/**
 * Project patrimony evolution over time.
 *
 * Novo parâmetro: tieredContributions (opcional)
 * Array de faixas de aporte: [{ id, fromMonth, toMonth, amount }]
 * Permite modelar mudanças futuras na sobra disponível para investir.
 */
export const projectPatrimonyEvolution = (config) => {
  const {
    startDate,
    durationMonths,
    initialPatrimony,
    monthlyIncome,
    fixedCosts = [],
    variableExpenses = [],
    allocation = { cdi: 25, selic: 25, cdb: 25, fii: 25 },
    rates = DEFAULT_RATES,
    reinvestFii = true,
    surplusAllocation = { investments: 100, emergencyFund: 0, savingsGoals: 0, keepCash: 0 },
    tieredContributions = [],   // NOVO
    inflation = 0,
    taxes = { enabled: true, fiiExempt: true },
  } = config;

  const projection = [];
  let currentDate = new Date(startDate);

  let balances = {
    cdi: initialPatrimony * (allocation.cdi / 100),
    selic: initialPatrimony * (allocation.selic / 100),
    cdb: initialPatrimony * (allocation.cdb / 100),
    fii: initialPatrimony * (allocation.fii / 100),
  };

  let cumulativeReturns = { cdi: 0, selic: 0, cdb: 0, fii: 0 };
  let cumulativeContributions = 0;

  for (let month = 0; month < durationMonths; month++) {
    const monthNumber = month + 1; // 1-based
    const monthDate = new Date(currentDate);
    monthDate.setMonth(currentDate.getMonth() + month);

    const activeFixedCosts = fixedCosts.filter(cost => isFixedCostActive(cost, monthDate));
    const totalFixedCosts = activeFixedCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalVariableExpenses = variableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const surplus = monthlyIncome - totalFixedCosts - totalVariableExpenses;

    const grossCdiReturn = balances.cdi * annualToMonthly(rates.cdi * (rates.cdiPercentage / 100));
    const grossSelicReturn = balances.selic * annualToMonthly(rates.selic);
    const grossCdbReturn = balances.cdb * annualToMonthly(rates.cdb);
    const grossFiiReturn = balances.fii * (rates.fii / 100);

    const cdiReturn = calculateNetReturn(grossCdiReturn, monthNumber, 'cdi', taxes);
    const selicReturn = calculateNetReturn(grossSelicReturn, monthNumber, 'selic', taxes);
    const cdbReturn = calculateNetReturn(grossCdbReturn, monthNumber, 'cdb', taxes);
    const fiiReturn = calculateNetReturn(grossFiiReturn, monthNumber, 'fii', taxes);

    cumulativeReturns.cdi += cdiReturn;
    cumulativeReturns.selic += selicReturn;
    cumulativeReturns.cdb += cdbReturn;
    cumulativeReturns.fii += reinvestFii ? fiiReturn : 0;

    const totalReturns = cdiReturn + selicReturn + cdbReturn + (reinvestFii ? fiiReturn : 0);
    const fiiDividends = reinvestFii ? 0 : fiiReturn;

    balances.cdi += cdiReturn;
    balances.selic += selicReturn;
    balances.cdb += cdbReturn;
    if (reinvestFii) balances.fii += fiiReturn;

    // NOVO: usa resolveMonthlyInvestment para suportar faixas de aporte
    const surplusForInvestments = resolveMonthlyInvestment(
      monthNumber,
      surplus,
      surplusAllocation,
      tieredContributions,
    );

    if (surplusForInvestments > 0) {
      balances.cdi += surplusForInvestments * (allocation.cdi / 100);
      balances.selic += surplusForInvestments * (allocation.selic / 100);
      balances.cdb += surplusForInvestments * (allocation.cdb / 100);
      balances.fii += surplusForInvestments * (allocation.fii / 100);
      cumulativeContributions += surplusForInvestments;
    }

    const patrimonyNominal = balances.cdi + balances.selic + balances.cdb + balances.fii;
    const patrimonyReal = inflation > 0
      ? adjustForInflation(patrimonyNominal, monthNumber, inflation)
      : patrimonyNominal;

    // activeTier exposto na projeção para que a UI saiba qual faixa está ativa
    const activeTier = tieredContributions.length > 0
      ? [...tieredContributions].reverse().find(t => {
          const from = t.fromMonth ?? 1;
          const to = t.toMonth ?? Infinity;
          return monthNumber >= from && monthNumber <= to;
        }) ?? null
      : null;

    projection.push({
      month: monthNumber,
      date: monthDate.toISOString(),
      monthLabel: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      income: monthlyIncome,
      fixedCosts: totalFixedCosts,
      variableExpenses: totalVariableExpenses,
      surplus,
      surplusForInvestments,
      activeTierId: activeTier?.id ?? null,
      investmentReturns: totalReturns,
      grossReturns: { cdi: grossCdiReturn, selic: grossSelicReturn, cdb: grossCdbReturn, fii: grossFiiReturn },
      netReturns: { cdi: cdiReturn, selic: selicReturn, cdb: cdbReturn, fii: fiiReturn },
      fiiDividends,
      patrimony: patrimonyNominal,
      patrimonyReal,
      inflationImpact: patrimonyNominal - patrimonyReal,
      balances: { ...balances },
      breakdown: { cdi: balances.cdi, selic: balances.selic, cdb: balances.cdb, fii: balances.fii },
      cumulativeReturns: { ...cumulativeReturns },
      cumulativeContributions,
    });
  }

  return projection;
};

export const calculateTimeToGoal = (config) => {
  const {
    targetAmount,
    initialPatrimony,
    monthlyIncome,
    fixedCosts,
    variableExpenses,
    allocation,
    rates,
    surplusAllocation,
    maxMonths = 600,
  } = config;

  const surplus = calculateMonthlySurplus(monthlyIncome, fixedCosts, variableExpenses);
  const investmentPercentage = (surplusAllocation?.investments || 100) / 100;
  const monthlyContribution = surplus * investmentPercentage;

  if (monthlyContribution <= 0 && initialPatrimony < targetAmount) {
    return { reachable: false, months: Infinity, reason: 'negative_surplus' };
  }

  const weightedMonthlyReturn =
    (allocation.cdi / 100) * annualToMonthly(rates.cdi * (rates.cdiPercentage / 100)) +
    (allocation.selic / 100) * annualToMonthly(rates.selic) +
    (allocation.cdb / 100) * annualToMonthly(rates.cdb) +
    (allocation.fii / 100) * (rates.fii / 100);

  let currentPatrimony = initialPatrimony;
  let months = 0;

  while (currentPatrimony < targetAmount && months < maxMonths) {
    currentPatrimony = currentPatrimony * (1 + weightedMonthlyReturn) + monthlyContribution;
    months++;
  }

  if (months >= maxMonths) return { reachable: false, months: Infinity, reason: 'exceeds_max' };

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);

  return {
    reachable: true,
    months,
    years: (months / 12).toFixed(1),
    targetDate: targetDate.toISOString(),
    targetDateFormatted: targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  };
};

export const simulateImpact = (baseConfig, changes) => {
  const baseProjection = projectPatrimonyEvolution(baseConfig);
  const modifiedProjection = projectPatrimonyEvolution({ ...baseConfig, ...changes });
  const baseFinal = baseProjection[baseProjection.length - 1];
  const modifiedFinal = modifiedProjection[modifiedProjection.length - 1];
  return {
    basePatrimony: baseFinal.patrimony,
    modifiedPatrimony: modifiedFinal.patrimony,
    difference: modifiedFinal.patrimony - baseFinal.patrimony,
    percentageChange: ((modifiedFinal.patrimony - baseFinal.patrimony) / baseFinal.patrimony) * 100,
    baseProjection,
    modifiedProjection,
  };
};

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

export default {
  formatCurrency, formatPercentage, annualToMonthly, monthlyToAnnual,
  getTaxRate, calculateNetReturn, adjustForInflation, calculateMonthlySurplus,
  isFixedCostActive, resolveMonthlyInvestment, projectPatrimonyEvolution,
  calculateTimeToGoal, simulateImpact, generateId, CURRENCIES, DEFAULT_RATES,
};