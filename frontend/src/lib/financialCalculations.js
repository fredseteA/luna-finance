/**
 * Financial Calculations Library
 * Core logic for the personal financial planner
 */

// Constants for Brazilian market rates (default values)
export const DEFAULT_RATES = {
  CDI: 13.75, // Annual CDI rate
  SELIC: 13.75, // Annual Selic rate
  CDB: 12.5, // Annual CDB rate (typically ~100% CDI)
  FII: 0.8, // Monthly FII yield
};

// Currency formatters
export const CURRENCIES = {
  BRL: { symbol: 'R$', locale: 'pt-BR', code: 'BRL' },
  USD: { symbol: '$', locale: 'en-US', code: 'USD' },
  EUR: { symbol: '€', locale: 'de-DE', code: 'EUR' },
};

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
 * Calculate monthly surplus (income - expenses)
 */
export const calculateMonthlySurplus = (income, fixedCosts, variableExpenses) => {
  const totalFixed = fixedCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
  const totalVariable = variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  return income - totalFixed - totalVariable;
};

/**
 * Calculate investment growth for a single month
 */
export const calculateMonthlyInvestmentGrowth = (principal, allocation, rates) => {
  let totalGrowth = 0;
  
  // CDI growth
  if (allocation.cdi > 0) {
    const cdiMonthlyRate = annualToMonthly(rates.cdi * (rates.cdiPercentage / 100));
    totalGrowth += (principal * allocation.cdi / 100) * cdiMonthlyRate;
  }
  
  // Selic growth
  if (allocation.selic > 0) {
    const selicMonthlyRate = annualToMonthly(rates.selic);
    totalGrowth += (principal * allocation.selic / 100) * selicMonthlyRate;
  }
  
  // CDB growth
  if (allocation.cdb > 0) {
    const cdbMonthlyRate = annualToMonthly(rates.cdb);
    totalGrowth += (principal * allocation.cdb / 100) * cdbMonthlyRate;
  }
  
  // FII growth (monthly yield)
  if (allocation.fii > 0) {
    totalGrowth += (principal * allocation.fii / 100) * (rates.fii / 100);
  }
  
  return totalGrowth;
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
    fixedCosts,
    variableExpenses,
    allocation,
    rates,
    reinvestFii = true,
    surplusAllocation = { investments: 100, emergencyFund: 0, savingsGoals: 0, keepCash: 0 },
  } = config;
  
  // Calculate what percentage of surplus goes to investments
  const investmentPercentage = (surplusAllocation.investments || 100) / 100;

  const projection = [];
  let currentPatrimony = initialPatrimony;
  let currentDate = new Date(startDate);
  
  // Initialize allocation balances
  let balances = {
    cdi: initialPatrimony * (allocation.cdi / 100),
    selic: initialPatrimony * (allocation.selic / 100),
    cdb: initialPatrimony * (allocation.cdb / 100),
    fii: initialPatrimony * (allocation.fii / 100),
  };

  for (let month = 0; month < durationMonths; month++) {
    const monthDate = new Date(currentDate);
    monthDate.setMonth(currentDate.getMonth() + month);
    
    // Calculate active fixed costs for this month
    const activeFixedCosts = fixedCosts.filter(cost => isFixedCostActive(cost, monthDate));
    const totalFixedCosts = activeFixedCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalVariableExpenses = variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Calculate surplus
    const surplus = monthlyIncome - totalFixedCosts - totalVariableExpenses;
    
    // Calculate investment returns for each type
    const cdiReturn = balances.cdi * annualToMonthly(rates.cdi * (rates.cdiPercentage / 100));
    const selicReturn = balances.selic * annualToMonthly(rates.selic);
    const cdbReturn = balances.cdb * annualToMonthly(rates.cdb);
    const fiiReturn = balances.fii * (rates.fii / 100);
    
    const totalReturns = cdiReturn + selicReturn + cdbReturn + (reinvestFii ? fiiReturn : 0);
    const fiiDividends = reinvestFii ? 0 : fiiReturn;
    
    // Update balances with returns
    balances.cdi += cdiReturn;
    balances.selic += selicReturn;
    balances.cdb += cdbReturn;
    if (reinvestFii) {
      balances.fii += fiiReturn;
    }
    
    // Distribute surplus according to allocation (only the investment portion)
    const surplusForInvestments = surplus > 0 ? surplus * investmentPercentage : 0;
    if (surplusForInvestments > 0) {
      balances.cdi += surplusForInvestments * (allocation.cdi / 100);
      balances.selic += surplusForInvestments * (allocation.selic / 100);
      balances.cdb += surplusForInvestments * (allocation.cdb / 100);
      balances.fii += surplusForInvestments * (allocation.fii / 100);
    }
    
    // Calculate total patrimony
    currentPatrimony = balances.cdi + balances.selic + balances.cdb + balances.fii;
    
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
      fiiDividends,
      patrimony: currentPatrimony,
      balances: { ...balances },
      breakdown: {
        cdi: balances.cdi,
        selic: balances.selic,
        cdb: balances.cdb,
        fii: balances.fii,
      },
    });
  }
  
  return projection;
};

/**
 * Compare multiple scenarios
 */
export const compareScenarios = (scenarios) => {
  return scenarios.map(scenario => ({
    name: scenario.name,
    projection: projectPatrimonyEvolution(scenario.config),
  }));
};

/**
 * Generate financial suggestions based on data
 */
export const generateSuggestions = (config, projection) => {
  const suggestions = [];
  const lastMonth = projection[projection.length - 1];
  const firstMonth = projection[0];
  
  // Check savings rate
  const savingsRate = (firstMonth.surplus / config.monthlyIncome) * 100;
  if (savingsRate < 10) {
    suggestions.push({
      type: 'warning',
      title: 'Taxa de Poupança Baixa',
      message: `Sua taxa de poupança é de ${savingsRate.toFixed(1)}%. Considere reduzir gastos para economizar pelo menos 20% da renda.`,
      priority: 'high',
    });
  } else if (savingsRate < 20) {
    suggestions.push({
      type: 'info',
      title: 'Taxa de Poupança Moderada',
      message: `Sua taxa de poupança é de ${savingsRate.toFixed(1)}%. Tente aumentar para 20-30% para acelerar seu patrimônio.`,
      priority: 'medium',
    });
  } else {
    suggestions.push({
      type: 'success',
      title: 'Excelente Taxa de Poupança',
      message: `Parabéns! Sua taxa de poupança de ${savingsRate.toFixed(1)}% está acima da média.`,
      priority: 'low',
    });
  }
  
  // Check FII allocation for passive income
  if (config.allocation.fii < 10 && lastMonth.patrimony > 50000) {
    suggestions.push({
      type: 'info',
      title: 'Considere FIIs para Renda Passiva',
      message: 'Com seu patrimônio atual, alocar 10-20% em FIIs pode gerar renda passiva mensal significativa.',
      priority: 'medium',
    });
  }
  
  // Check diversification
  const maxAllocation = Math.max(
    config.allocation.cdi,
    config.allocation.selic,
    config.allocation.cdb,
    config.allocation.fii
  );
  if (maxAllocation > 70) {
    suggestions.push({
      type: 'warning',
      title: 'Concentração Alta',
      message: 'Sua carteira está muito concentrada em um tipo de investimento. Diversifique para reduzir riscos.',
      priority: 'high',
    });
  }
  
  // Patrimony growth alert
  const totalGrowth = ((lastMonth.patrimony - config.initialPatrimony) / config.initialPatrimony) * 100;
  if (totalGrowth > 50) {
    suggestions.push({
      type: 'success',
      title: 'Crescimento Expressivo Projetado',
      message: `Seu patrimônio deve crescer ${totalGrowth.toFixed(1)}% no período. Continue assim!`,
      priority: 'low',
    });
  }
  
  // Check for ending fixed costs
  const endingCosts = config.fixedCosts.filter(cost => cost.endDate);
  if (endingCosts.length > 0) {
    const soonestEnd = endingCosts.reduce((min, cost) => {
      const endDate = new Date(cost.endDate);
      return endDate < min ? endDate : min;
    }, new Date('2100-01-01'));
    
    const monthsUntilEnd = Math.ceil((soonestEnd - new Date()) / (1000 * 60 * 60 * 24 * 30));
    if (monthsUntilEnd > 0 && monthsUntilEnd <= 6) {
      suggestions.push({
        type: 'info',
        title: 'Custo Fixo Terminando em Breve',
        message: `Um de seus custos fixos termina em ${monthsUntilEnd} meses. Planeje como realocar esse valor.`,
        priority: 'medium',
      });
    }
  }
  
  // Variable expenses alert
  const variableTotal = config.variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const variablePercentage = (variableTotal / config.monthlyIncome) * 100;
  if (variablePercentage > 30) {
    suggestions.push({
      type: 'warning',
      title: 'Gastos Variáveis Elevados',
      message: `Seus gastos variáveis representam ${variablePercentage.toFixed(1)}% da renda. Tente manter abaixo de 30%.`,
      priority: 'high',
    });
  }
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

/**
 * Calculate compound interest projection
 */
export const calculateCompoundInterest = (principal, monthlyContribution, annualRate, months) => {
  const monthlyRate = annualToMonthly(annualRate);
  let balance = principal;
  const projection = [];
  
  for (let i = 0; i < months; i++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    projection.push({
      month: i + 1,
      balance,
      contribution: (i + 1) * monthlyContribution + principal,
      interest: balance - ((i + 1) * monthlyContribution + principal),
    });
  }
  
  return projection;
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
