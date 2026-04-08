/**
 * Simulation Engine
 * Handles scenario simulations, optimizations, and smart suggestions
 */

import { 
  projectPatrimonyEvolution, 
  calculateTimeToGoal,
  calculateMonthlySurplus,
  annualToMonthly 
} from './financialEngine';

/**
 * Optimize expenses by reducing variable expenses proportionally
 */
export const optimizeExpenses = (config, targetSavingsRate = 0.30) => {
  const { monthlyIncome, variableExpenses, fixedCosts } = config;
  const currentSurplus = calculateMonthlySurplus(monthlyIncome, fixedCosts, variableExpenses);
  const currentSavingsRate = monthlyIncome > 0 ? currentSurplus / monthlyIncome : 0;
  
  if (currentSavingsRate >= targetSavingsRate) {
    return {
      optimized: false,
      reason: 'already_optimal',
      currentSavingsRate,
      targetSavingsRate,
      suggestions: [],
    };
  }
  
  const targetSurplus = monthlyIncome * targetSavingsRate;
  const neededReduction = targetSurplus - currentSurplus;
  const totalVariable = variableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  if (totalVariable < neededReduction) {
    return {
      optimized: false,
      reason: 'insufficient_variable_expenses',
      currentSavingsRate,
      targetSavingsRate,
      suggestions: [{
        type: 'income',
        message: 'Considere aumentar sua renda ou reduzir custos fixos',
        impact: neededReduction - totalVariable,
      }],
    };
  }
  
  const reductionPercentage = neededReduction / totalVariable;
  const optimizedExpenses = variableExpenses.map(exp => ({
    ...exp,
    originalAmount: exp.amount,
    amount: Math.round(exp.amount * (1 - reductionPercentage)),
    reduction: Math.round(exp.amount * reductionPercentage),
  }));
  
  return {
    optimized: true,
    reductionPercentage: reductionPercentage * 100,
    optimizedExpenses,
    newSurplus: targetSurplus,
    currentSavingsRate: currentSavingsRate * 100,
    newSavingsRate: targetSavingsRate * 100,
    suggestions: optimizedExpenses
      .filter(e => e.reduction > 0)
      .map(e => ({
        type: 'expense_reduction',
        category: e.category,
        name: e.name,
        currentAmount: e.originalAmount,
        suggestedAmount: e.amount,
        reduction: e.reduction,
        message: `Reduzir "${e.name}" de R$${e.originalAmount} para R$${e.amount}`,
      })),
  };
};

/**
 * Optimize investment allocation based on profile and horizon
 */
export const optimizeInvestments = (config) => {
  const { durationMonths, allocation, initialPatrimony, monthlyIncome, fixedCosts, variableExpenses } = config;
  const surplus = calculateMonthlySurplus(monthlyIncome, fixedCosts, variableExpenses);
  const monthlyExpenses = monthlyIncome - surplus;
  const emergencyMonths = monthlyExpenses > 0 ? initialPatrimony / monthlyExpenses : 0;
  
  let recommendedAllocation;
  let profile;
  let reasoning = [];
  
  // Determine profile based on multiple factors
  if (emergencyMonths < 3) {
    profile = 'ultraconservative';
    recommendedAllocation = { cdi: 70, selic: 30, cdb: 0, fii: 0 };
    reasoning.push('Reserva de emergência insuficiente - priorize liquidez');
  } else if (durationMonths <= 12) {
    profile = 'conservative';
    recommendedAllocation = { cdi: 50, selic: 30, cdb: 15, fii: 5 };
    reasoning.push('Horizonte curto (≤1 ano) - minimize risco');
  } else if (durationMonths <= 36) {
    profile = 'moderate';
    recommendedAllocation = { cdi: 35, selic: 25, cdb: 20, fii: 20 };
    reasoning.push('Horizonte médio (1-3 anos) - equilíbrio risco/retorno');
  } else {
    profile = 'aggressive';
    recommendedAllocation = { cdi: 20, selic: 15, cdb: 25, fii: 40 };
    reasoning.push('Horizonte longo (>3 anos) - maximize crescimento');
  }
  
  // Calculate impact
  const currentProjection = projectPatrimonyEvolution(config);
  const optimizedProjection = projectPatrimonyEvolution({
    ...config,
    allocation: recommendedAllocation,
  });
  
  const currentFinal = currentProjection[currentProjection.length - 1].patrimony;
  const optimizedFinal = optimizedProjection[optimizedProjection.length - 1].patrimony;
  
  return {
    currentAllocation: allocation,
    recommendedAllocation,
    profile,
    reasoning,
    impact: {
      currentPatrimony: currentFinal,
      optimizedPatrimony: optimizedFinal,
      difference: optimizedFinal - currentFinal,
      percentageGain: ((optimizedFinal - currentFinal) / currentFinal) * 100,
    },
  };
};

/**
 * Generate best case scenario
 */
export const generateBestCaseScenario = (config) => {
  const { monthlyIncome, variableExpenses, allocation, rates } = config;
  
  // Reduce variable expenses by 30%
  const optimizedExpenses = variableExpenses.map(exp => ({
    ...exp,
    amount: Math.round(exp.amount * 0.7),
  }));
  
  // Optimize allocation for growth
  const optimizedAllocation = { cdi: 20, selic: 15, cdb: 25, fii: 40 };
  
  // Use higher CDI percentage (110%)
  const optimizedRates = {
    ...rates,
    cdiPercentage: 110,
  };
  
  // All surplus to investments
  const optimizedSurplusAllocation = {
    investments: 100,
    emergencyFund: 0,
    savingsGoals: 0,
    keepCash: 0,
  };
  
  const bestCaseConfig = {
    ...config,
    variableExpenses: optimizedExpenses,
    allocation: optimizedAllocation,
    rates: optimizedRates,
    surplusAllocation: optimizedSurplusAllocation,
  };
  
  const currentProjection = projectPatrimonyEvolution(config);
  const bestCaseProjection = projectPatrimonyEvolution(bestCaseConfig);
  
  const currentFinal = currentProjection[currentProjection.length - 1];
  const bestCaseFinal = bestCaseProjection[bestCaseProjection.length - 1];
  
  return {
    name: 'Melhor Cenário',
    config: bestCaseConfig,
    projection: bestCaseProjection,
    changes: [
      'Redução de 30% em gastos variáveis',
      'CDI a 110% (buscar melhores taxas)',
      'Alocação otimizada para crescimento',
      '100% da sobra para investimentos',
    ],
    impact: {
      currentPatrimony: currentFinal.patrimony,
      bestCasePatrimony: bestCaseFinal.patrimony,
      difference: bestCaseFinal.patrimony - currentFinal.patrimony,
      percentageGain: ((bestCaseFinal.patrimony - currentFinal.patrimony) / currentFinal.patrimony) * 100,
      monthsToReachCurrent: null, // Calculate if needed
    },
  };
};

/**
 * Calculate score breakdown with explanations
 */
export const calculateScoreBreakdown = (config, projection) => {
  const { monthlyIncome, initialPatrimony, fixedCosts, variableExpenses, durationMonths, allocation } = config;
  
  if (!projection || projection.length === 0 || monthlyIncome <= 0) {
    return {
      totalScore: 0,
      maxScore: 100,
      breakdown: [],
      improvements: [],
    };
  }
  
  const surplus = calculateMonthlySurplus(monthlyIncome, fixedCosts, variableExpenses);
  const savingsRate = (surplus / monthlyIncome) * 100;
  const monthlyExpenses = monthlyIncome - surplus;
  const emergencyMonths = monthlyExpenses > 0 ? initialPatrimony / monthlyExpenses : 0;
  
  const breakdown = [];
  const improvements = [];
  let totalScore = 0;
  
  // 1. Savings Rate (max 30 points)
  const savingsPoints = Math.min(30, savingsRate * 1.5);
  breakdown.push({
    category: 'Taxa de Poupança',
    score: Math.round(savingsPoints),
    maxScore: 30,
    status: savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : savingsRate >= 5 ? 'fair' : 'poor',
    value: savingsRate,
    description: `Você poupa ${savingsRate.toFixed(1)}% da sua renda`,
    icon: 'piggy-bank',
  });
  totalScore += savingsPoints;
  
  if (savingsRate < 20) {
    const targetSavingsRate = Math.min(savingsRate + 10, 20);
    const potentialPoints = Math.min(30, targetSavingsRate * 1.5) - savingsPoints;
    improvements.push({
      category: 'Taxa de Poupança',
      currentScore: Math.round(savingsPoints),
      potentialScore: Math.round(savingsPoints + potentialPoints),
      potentialGain: Math.round(potentialPoints),
      action: `Aumentar poupança para ${targetSavingsRate.toFixed(0)}%`,
      difficulty: savingsRate < 10 ? 'hard' : 'medium',
      impact: 'high',
    });
  }
  
  // 2. Emergency Fund (max 25 points)
  const emergencyPoints = Math.min(25, emergencyMonths * 4);
  breakdown.push({
    category: 'Reserva de Emergência',
    score: Math.round(emergencyPoints),
    maxScore: 25,
    status: emergencyMonths >= 6 ? 'excellent' : emergencyMonths >= 3 ? 'good' : emergencyMonths >= 1 ? 'fair' : 'poor',
    value: emergencyMonths,
    description: `Sua reserva cobre ${emergencyMonths.toFixed(1)} meses de despesas`,
    icon: 'shield',
  });
  totalScore += emergencyPoints;
  
  if (emergencyMonths < 6) {
    const targetMonths = Math.min(emergencyMonths + 3, 6);
    const potentialPoints = Math.min(25, targetMonths * 4) - emergencyPoints;
    improvements.push({
      category: 'Reserva de Emergência',
      currentScore: Math.round(emergencyPoints),
      potentialScore: Math.round(emergencyPoints + potentialPoints),
      potentialGain: Math.round(potentialPoints),
      action: `Aumentar reserva para ${targetMonths.toFixed(0)} meses`,
      difficulty: 'medium',
      impact: 'high',
    });
  }
  
  // 3. Investment Horizon (max 20 points)
  const horizonPoints = Math.min(20, durationMonths * 0.5);
  breakdown.push({
    category: 'Horizonte de Investimento',
    score: Math.round(horizonPoints),
    maxScore: 20,
    status: durationMonths >= 36 ? 'excellent' : durationMonths >= 12 ? 'good' : 'fair',
    value: durationMonths,
    description: `Planejamento de ${durationMonths} meses (${(durationMonths/12).toFixed(1)} anos)`,
    icon: 'calendar',
  });
  totalScore += horizonPoints;
  
  if (durationMonths < 36) {
    improvements.push({
      category: 'Horizonte de Investimento',
      currentScore: Math.round(horizonPoints),
      potentialScore: 20,
      potentialGain: 20 - Math.round(horizonPoints),
      action: 'Estender planejamento para 36+ meses',
      difficulty: 'easy',
      impact: 'medium',
    });
  }
  
  // 4. Diversification (max 15 points)
  const allocationValues = Object.values(allocation);
  const maxAllocation = Math.max(...allocationValues);
  const diversificationScore = maxAllocation <= 40 ? 15 : maxAllocation <= 60 ? 10 : maxAllocation <= 80 ? 5 : 0;
  breakdown.push({
    category: 'Diversificação',
    score: diversificationScore,
    maxScore: 15,
    status: diversificationScore >= 12 ? 'excellent' : diversificationScore >= 8 ? 'good' : 'fair',
    value: maxAllocation,
    description: `Maior concentração: ${maxAllocation}% em um único tipo`,
    icon: 'pie-chart',
  });
  totalScore += diversificationScore;
  
  if (maxAllocation > 40) {
    improvements.push({
      category: 'Diversificação',
      currentScore: diversificationScore,
      potentialScore: 15,
      potentialGain: 15 - diversificationScore,
      action: 'Distribuir investimentos mais uniformemente',
      difficulty: 'easy',
      impact: 'medium',
    });
  }
  
  // 5. Growth Potential (max 10 points)
  const lastMonth = projection[projection.length - 1];
  const growthRate = ((lastMonth.patrimony - initialPatrimony) / initialPatrimony) * 100;
  const growthPoints = Math.min(10, growthRate / 10);
  breakdown.push({
    category: 'Potencial de Crescimento',
    score: Math.round(Math.max(0, growthPoints)),
    maxScore: 10,
    status: growthRate >= 50 ? 'excellent' : growthRate >= 20 ? 'good' : growthRate >= 0 ? 'fair' : 'poor',
    value: growthRate,
    description: `Crescimento projetado: ${growthRate.toFixed(1)}%`,
    icon: 'trending-up',
  });
  totalScore += Math.max(0, growthPoints);
  
  return {
    totalScore: Math.round(totalScore),
    maxScore: 100,
    breakdown,
    improvements: improvements.sort((a, b) => b.potentialGain - a.potentialGain),
    grade: totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : totalScore >= 20 ? 'D' : 'F',
  };
};

/**
 * Generate smart alerts based on financial data
 */
export const generateAlerts = (config, projection, dismissedAlerts = []) => {
  const alerts = [];
  const { monthlyIncome, fixedCosts, variableExpenses, initialPatrimony, allocation } = config;
  
  if (monthlyIncome <= 0) return alerts;
  
  const surplus = calculateMonthlySurplus(monthlyIncome, fixedCosts, variableExpenses);
  const savingsRate = (surplus / monthlyIncome) * 100;
  const monthlyExpenses = monthlyIncome - surplus;
  const emergencyMonths = monthlyExpenses > 0 ? initialPatrimony / monthlyExpenses : 0;
  
  // Group expenses by category
  const expensesByCategory = {};
  [...fixedCosts, ...variableExpenses].forEach(exp => {
    const cat = exp.category || 'outros';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (exp.amount || 0);
  });
  
  // Alert: Low savings rate
  if (savingsRate < 10) {
    alerts.push({
      id: 'low_savings_rate',
      type: 'critical',
      title: 'Taxa de Poupança Crítica',
      message: `Você está poupando apenas ${savingsRate.toFixed(1)}% da sua renda. O ideal é poupar pelo menos 20%.`,
      action: 'Revise seus gastos e identifique cortes possíveis',
      icon: 'alert-triangle',
    });
  } else if (savingsRate < 20) {
    alerts.push({
      id: 'moderate_savings_rate',
      type: 'warning',
      title: 'Taxa de Poupança Abaixo do Ideal',
      message: `Sua taxa de poupança de ${savingsRate.toFixed(1)}% pode ser melhorada. Tente atingir 20-30%.`,
      action: 'Considere pequenos cortes em gastos variáveis',
      icon: 'alert-circle',
    });
  }
  
  // Alert: Insufficient emergency fund
  if (emergencyMonths < 3) {
    alerts.push({
      id: 'low_emergency_fund',
      type: 'critical',
      title: 'Reserva de Emergência Insuficiente',
      message: `Sua reserva cobre apenas ${emergencyMonths.toFixed(1)} meses. O recomendado é 6 meses de despesas.`,
      action: 'Priorize construir sua reserva antes de outros investimentos',
      icon: 'shield-alert',
    });
  } else if (emergencyMonths < 6) {
    alerts.push({
      id: 'moderate_emergency_fund',
      type: 'warning',
      title: 'Reserva de Emergência Parcial',
      message: `Sua reserva de ${emergencyMonths.toFixed(1)} meses está abaixo do ideal de 6 meses.`,
      action: 'Continue destinando parte da sobra para a reserva',
      icon: 'shield',
    });
  }
  
  // Alert: High concentration in single category
  Object.entries(expensesByCategory).forEach(([category, amount]) => {
    const percentage = (amount / monthlyIncome) * 100;
    const categoryNames = {
      moradia: 'Moradia',
      transporte: 'Transporte',
      alimentacao: 'Alimentação',
      lazer: 'Lazer',
      assinatura: 'Assinaturas',
    };
    
    if (percentage > 30 && category !== 'moradia') {
      alerts.push({
        id: `high_expense_${category}`,
        type: 'info',
        title: `Gasto Alto em ${categoryNames[category] || category}`,
        message: `Você gasta ${percentage.toFixed(1)}% da renda com ${categoryNames[category] || category}. Considere revisar.`,
        action: `Analise se há formas de reduzir gastos com ${categoryNames[category] || category}`,
        icon: 'trending-down',
      });
    }
  });
  
  // Alert: Low diversification
  const maxAllocation = Math.max(allocation.cdi, allocation.selic, allocation.cdb, allocation.fii);
  if (maxAllocation > 70) {
    alerts.push({
      id: 'low_diversification',
      type: 'warning',
      title: 'Carteira Pouco Diversificada',
      message: `${maxAllocation}% dos seus investimentos estão concentrados em um único tipo.`,
      action: 'Distribua seus investimentos para reduzir riscos',
      icon: 'pie-chart',
    });
  }
  
  // Alert: Negative surplus
  if (surplus < 0) {
    alerts.push({
      id: 'negative_surplus',
      type: 'critical',
      title: 'Gastos Excedem a Renda',
      message: `Seus gastos superam sua renda em R$ ${Math.abs(surplus).toFixed(2)} por mês.`,
      action: 'URGENTE: Revise seus gastos ou aumente sua renda',
      icon: 'x-circle',
    });
  }
  
  // Filter dismissed alerts
  return alerts.filter(alert => !dismissedAlerts.includes(alert.id));
};

/**
 * Simulate additional monthly contribution impact
 */
export const simulateAdditionalContribution = (config, additionalAmount) => {
  const modifiedConfig = {
    ...config,
    monthlyIncome: config.monthlyIncome + additionalAmount,
  };
  
  const baseProjection = projectPatrimonyEvolution(config);
  const modifiedProjection = projectPatrimonyEvolution(modifiedConfig);
  
  const baseFinal = baseProjection[baseProjection.length - 1];
  const modifiedFinal = modifiedProjection[modifiedProjection.length - 1];
  
  return {
    additionalAmount,
    baseFinalPatrimony: baseFinal.patrimony,
    modifiedFinalPatrimony: modifiedFinal.patrimony,
    difference: modifiedFinal.patrimony - baseFinal.patrimony,
    percentageGain: ((modifiedFinal.patrimony - baseFinal.patrimony) / baseFinal.patrimony) * 100,
    monthsSaved: calculateTimeToGoalDifference(config, modifiedConfig, modifiedFinal.patrimony),
  };
};

/**
 * Calculate how many months earlier a goal is reached with modified config
 */
const calculateTimeToGoalDifference = (baseConfig, modifiedConfig, targetAmount) => {
  const baseTime = calculateTimeToGoal({ ...baseConfig, targetAmount });
  const modifiedTime = calculateTimeToGoal({ ...modifiedConfig, targetAmount });
  
  if (!baseTime.reachable || !modifiedTime.reachable) return 0;
  return baseTime.months - modifiedTime.months;
};

/**
 * Generate smart suggestions based on financial data and score breakdown
 */
export const generateSuggestions = (config, projection, scoreBreakdown) => {
  const suggestions = [];
  const { monthlyIncome, fixedCosts, variableExpenses, initialPatrimony, allocation, durationMonths } = config;
  
  if (!monthlyIncome || monthlyIncome <= 0) {
    return [{
      type: 'info',
      priority: 'high',
      title: 'Configure sua renda',
      message: 'Adicione sua renda mensal para receber sugestões personalizadas.',
    }];
  }
  
  const surplus = calculateMonthlySurplus(monthlyIncome, fixedCosts || [], variableExpenses || []);
  const savingsRate = (surplus / monthlyIncome) * 100;
  const totalExpenses = (fixedCosts || []).reduce((sum, c) => sum + (c.amount || 0), 0) +
                        (variableExpenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const emergencyMonths = totalExpenses > 0 ? (initialPatrimony || 0) / totalExpenses : 0;
  
  // Suggestion: Emergency Fund
  if (emergencyMonths < 6) {
    suggestions.push({
      type: 'warning',
      priority: 'high',
      title: 'Reserva de Emergência',
      message: `Sua reserva cobre apenas ${emergencyMonths.toFixed(1)} meses. O ideal é ter 6+ meses de despesas guardados.`,
    });
  } else {
    suggestions.push({
      type: 'success',
      priority: 'low',
      title: 'Reserva de Emergência',
      message: `Ótimo! Sua reserva cobre ${emergencyMonths.toFixed(1)} meses de despesas.`,
    });
  }
  
  // Suggestion: Savings Rate
  if (savingsRate < 10) {
    suggestions.push({
      type: 'warning',
      priority: 'high',
      title: 'Taxa de Poupança Baixa',
      message: `Você está poupando apenas ${savingsRate.toFixed(1)}% da renda. Tente reduzir gastos variáveis para poupar pelo menos 20%.`,
    });
  } else if (savingsRate < 20) {
    suggestions.push({
      type: 'info',
      priority: 'medium',
      title: 'Taxa de Poupança',
      message: `Você está poupando ${savingsRate.toFixed(1)}% da renda. Tente aumentar para 20%+ para acelerar seus objetivos.`,
    });
  } else {
    suggestions.push({
      type: 'success',
      priority: 'low',
      title: 'Excelente Taxa de Poupança',
      message: `Parabéns! Você está poupando ${savingsRate.toFixed(1)}% da sua renda.`,
    });
  }
  
  // Suggestion: Diversification
  if (allocation) {
    const allocationValues = Object.values(allocation);
    const maxAllocation = Math.max(...allocationValues);
    if (maxAllocation > 60) {
      suggestions.push({
        type: 'info',
        priority: 'medium',
        title: 'Diversificação',
        message: 'Considere diversificar mais seus investimentos. Nenhum ativo deve representar mais de 60% da carteira.',
      });
    }
  }
  
  // Suggestion: Planning Horizon
  if (durationMonths && durationMonths < 24) {
    suggestions.push({
      type: 'info',
      priority: 'low',
      title: 'Horizonte de Planejamento',
      message: 'Planejamentos mais longos (3+ anos) aproveitam melhor os juros compostos.',
    });
  }
  
  // Use improvements from scoreBreakdown
  if (scoreBreakdown && scoreBreakdown.improvements) {
    scoreBreakdown.improvements.slice(0, 2).forEach(imp => {
      suggestions.push({
        type: 'info',
        priority: imp.impact === 'high' ? 'high' : 'medium',
        title: imp.category,
        message: imp.action,
      });
    });
  }
  
  return suggestions;
};

export default {
  optimizeExpenses,
  optimizeInvestments,
  generateBestCaseScenario,
  calculateScoreBreakdown,
  generateAlerts,
  generateSuggestions,
  simulateAdditionalContribution,
};
