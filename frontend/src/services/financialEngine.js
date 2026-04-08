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
  { maxDays: 180, rate: 0.225 },   // 22.5%
  { maxDays: 360, rate: 0.20 },    // 20%
  { maxDays: 720, rate: 0.175 },   // 17.5%
  { maxDays: Infinity, rate: 0.15 }, // 15%
];

/**
 * Format number as currency
 */
export const formatCurrency = (value, currency = 'BRL') => {
  const config = CURRENCIES[currency] || CURRENCIES.BRL;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format number as percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Convert annual rate to monthly rate
 */
export const annualToMonthly = (annualRate) => {
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
};

/**
 * Convert monthly rate to annual rate
 */
export const monthlyToAnnual = (monthlyRate) => {
  return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
};

/**
 * Get tax rate based on investment duration
 */
export const getTaxRate = (months) => {
  const days = months * 30;
  const bracket = TAX_TABLE.find(t => days <= t.maxDays);
  return bracket ? bracket.rate : 0.15;
};

/**
 * Calculate net return after taxes
 */
export const calculateNetReturn = (grossReturn, months, investmentType, taxConfig = { enabled: true, fiiExempt: true }) => {
  if (!taxConfig.enabled) return grossReturn;
  
  // FII dividends are tax-exempt for individuals in Brazil
  if (investmentType === 'fii' && taxConfig.fiiExempt) {
    return grossReturn;
  }
  
  // Apply regressive tax for CDI, Selic, CDB
  if (['cdi', 'selic', 'cdb'].includes(investmentType)) {
    const taxRate = getTaxRate(months);
    return grossReturn * (1 - taxRate);
  }
  
  return grossReturn;
};

/**
 * Adjust value for inflation
 */
export const adjustForInflation = (value, months, annualInflation) => {
  const monthlyInflation = Math.pow(1 + annualInflation / 100, 1 / 12) - 1;
  return value / Math.pow(1 + monthlyInflation, months);
};

/**
 * Calculate monthly surplus
 */
export const calculateMonthlySurplus = (income, fixedCosts, variableExpenses) => {
  const totalFixed = fixedCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
  const totalVariable = variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  return income - totalFixed - totalVariable;
};

/**
 * Check if a fixed cost is active in a given month
 */
export const isFixedCostActive = (cost, currentDate) => {
  if (!cost.endDate) return true;
  const endDate = new Date(cost.endDate);
  return currentDate <= endDate;
};

/**
 * Project patrimony evolution over time
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
    inflation = 0,
    taxes = { enabled: true, fiiExempt: true },
  } = config;

  const investmentPercentage = (surplusAllocation.investments || 100) / 100;
  const projection = [];
  let currentDate = new Date(startDate);
  
  // Initialize balances
  let balances = {
    cdi: initialPatrimony * (allocation.cdi / 100),
    selic: initialPatrimony * (allocation.selic / 100),
    cdb: initialPatrimony * (allocation.cdb / 100),
    fii: initialPatrimony * (allocation.fii / 100),
  };
  
  // Cumulative tracking
  let cumulativeReturns = { cdi: 0, selic: 0, cdb: 0, fii: 0 };
  let cumulativeContributions = 0;

  for (let month = 0; month < durationMonths; month++) {
    const monthDate = new Date(currentDate);
    monthDate.setMonth(currentDate.getMonth() + month);
    
    // Calculate active costs
    const activeFixedCosts = fixedCosts.filter(cost => isFixedCostActive(cost, monthDate));
    const totalFixedCosts = activeFixedCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalVariableExpenses = variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Calculate surplus
    const surplus = monthlyIncome - totalFixedCosts - totalVariableExpenses;
    
    // Calculate gross returns
    const grossCdiReturn = balances.cdi * annualToMonthly(rates.cdi * (rates.cdiPercentage / 100));
    const grossSelicReturn = balances.selic * annualToMonthly(rates.selic);
    const grossCdbReturn = balances.cdb * annualToMonthly(rates.cdb);
    const grossFiiReturn = balances.fii * (rates.fii / 100);
    
    // Apply taxes
    const cdiReturn = calculateNetReturn(grossCdiReturn, month + 1, 'cdi', taxes);
    const selicReturn = calculateNetReturn(grossSelicReturn, month + 1, 'selic', taxes);
    const cdbReturn = calculateNetReturn(grossCdbReturn, month + 1, 'cdb', taxes);
    const fiiReturn = calculateNetReturn(grossFiiReturn, month + 1, 'fii', taxes);
    
    // Track cumulative returns
    cumulativeReturns.cdi += cdiReturn;
    cumulativeReturns.selic += selicReturn;
    cumulativeReturns.cdb += cdbReturn;
    cumulativeReturns.fii += (reinvestFii ? fiiReturn : 0);
    
    const totalReturns = cdiReturn + selicReturn + cdbReturn + (reinvestFii ? fiiReturn : 0);
    const fiiDividends = reinvestFii ? 0 : fiiReturn;
    
    // Update balances with returns
    balances.cdi += cdiReturn;
    balances.selic += selicReturn;
    balances.cdb += cdbReturn;
    if (reinvestFii) balances.fii += fiiReturn;
    
    // Distribute surplus
    const surplusForInvestments = surplus > 0 ? surplus * investmentPercentage : 0;
    if (surplusForInvestments > 0) {
      balances.cdi += surplusForInvestments * (allocation.cdi / 100);
      balances.selic += surplusForInvestments * (allocation.selic / 100);
      balances.cdb += surplusForInvestments * (allocation.cdb / 100);
      balances.fii += surplusForInvestments * (allocation.fii / 100);
      cumulativeContributions += surplusForInvestments;
    }
    
    // Calculate total patrimony
    const patrimonyNominal = balances.cdi + balances.selic + balances.cdb + balances.fii;
    const patrimonyReal = inflation > 0 
      ? adjustForInflation(patrimonyNominal, month + 1, inflation) 
      : patrimonyNominal;
    
    projection.push({
      month: month + 1,
      date: monthDate.toISOString(),
      monthLabel: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      income: monthlyIncome,
      fixedCosts: totalFixedCosts,
      variableExpenses: totalVariableExpenses,
      surplus,
      surplusForInvestments,
      investmentReturns: totalReturns,
      grossReturns: {
        cdi: grossCdiReturn,
        selic: grossSelicReturn,
        cdb: grossCdbReturn,
        fii: grossFiiReturn,
      },
      netReturns: {
        cdi: cdiReturn,
        selic: selicReturn,
        cdb: cdbReturn,
        fii: fiiReturn,
      },
      fiiDividends,
      patrimony: patrimonyNominal,
      patrimonyReal,
      inflationImpact: patrimonyNominal - patrimonyReal,
      balances: { ...balances },
      breakdown: {
        cdi: balances.cdi,
        selic: balances.selic,
        cdb: balances.cdb,
        fii: balances.fii,
      },
      cumulativeReturns: { ...cumulativeReturns },
      cumulativeContributions,
    });
  }
  
  return projection;
};

/**
 * Calculate time to reach a goal
 */
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
    maxMonths = 600, // 50 years max
  } = config;
  
  const surplus = calculateMonthlySurplus(monthlyIncome, fixedCosts, variableExpenses);
  const investmentPercentage = (surplusAllocation?.investments || 100) / 100;
  const monthlyContribution = surplus * investmentPercentage;
  
  if (monthlyContribution <= 0 && initialPatrimony < targetAmount) {
    return { reachable: false, months: Infinity, reason: 'negative_surplus' };
  }
  
  // Simulate month by month
  let currentPatrimony = initialPatrimony;
  let months = 0;
  
  // Calculate weighted average monthly return
  const weightedMonthlyReturn = 
    (allocation.cdi / 100) * annualToMonthly(rates.cdi * (rates.cdiPercentage / 100)) +
    (allocation.selic / 100) * annualToMonthly(rates.selic) +
    (allocation.cdb / 100) * annualToMonthly(rates.cdb) +
    (allocation.fii / 100) * (rates.fii / 100);
  
  while (currentPatrimony < targetAmount && months < maxMonths) {
    currentPatrimony = currentPatrimony * (1 + weightedMonthlyReturn) + monthlyContribution;
    months++;
  }
  
  if (months >= maxMonths) {
    return { reachable: false, months: Infinity, reason: 'exceeds_max' };
  }
  
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

/**
 * Simulate impact of changes
 */
export const simulateImpact = (baseConfig, changes) => {
  const baseProjection = projectPatrimonyEvolution(baseConfig);
  const modifiedConfig = { ...baseConfig, ...changes };
  const modifiedProjection = projectPatrimonyEvolution(modifiedConfig);
  
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

/**
 * Generate unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default {
  formatCurrency,
  formatPercentage,
  annualToMonthly,
  monthlyToAnnual,
  getTaxRate,
  calculateNetReturn,
  adjustForInflation,
  calculateMonthlySurplus,
  isFixedCostActive,
  projectPatrimonyEvolution,
  calculateTimeToGoal,
  simulateImpact,
  generateId,
  CURRENCIES,
  DEFAULT_RATES,
};
