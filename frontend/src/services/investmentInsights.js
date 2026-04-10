/**
 * investmentInsights.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de análise financeira para a página de Investimentos.
 *
 * Princípios de design:
 *  • Funções puras — sem efeitos colaterais, sem dependências de UI
 *  • Cada função retorna dados estruturados prontos para renderizar
 *  • Preparado para ser alimentado por IA no futuro (os retornos seguem
 *    um schema consistente que pode ser passado como contexto para LLMs)
 *
 * Exportações principais:
 *  • buildInsightReport(financialData, settings, projection) → InsightReport
 *
 * InsightReport = {
 *   overview:     OverviewMetrics
 *   alerts:       Alert[]
 *   opportunities:Opportunity[]
 *   milestones:   Milestone[]
 *   allocationAdvice: AllocationAdvice
 *   behaviorScore:BehaviorScore
 * }
 */

import { annualToMonthly } from './financialEngine';

// ─── Constantes de referência (parâmetros do mercado brasileiro) ──────────────

const BENCHMARKS = {
  SAVINGS_RATE_GOOD:    20,   // % mínimo recomendado de poupança
  SAVINGS_RATE_GREAT:   30,   // % excelente
  EMERGENCY_MONTHS_MIN: 3,    // meses mínimos de reserva
  EMERGENCY_MONTHS_IDEAL:6,   // meses ideais de reserva
  MAX_SINGLE_ASSET:     60,   // % máximo em um único ativo sem ser considerado concentrado
  FII_YIELD_REF:        0.8,  // % ao mês de referência para FII
  HIGH_FIXED_COST_PCT:  50,   // % da renda em custos fixos considerado alto
};

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Retorna o total de gastos fixos e variáveis.
 */
const calcExpenses = (fixedCosts = [], variableExpenses = []) => ({
  fixed:    fixedCosts.reduce((s, c) => s + (c.amount || 0), 0),
  variable: variableExpenses.reduce((s, e) => s + (e.amount || 0), 0),
  total:    fixedCosts.reduce((s, c) => s + (c.amount || 0), 0)
          + variableExpenses.reduce((s, e) => s + (e.amount || 0), 0),
});

/**
 * Detecta parcelamentos/custos fixos que encerram no futuro.
 * Retorna os que terminam nos próximos `lookahead` meses.
 *
 * @param {Array}  fixedCosts   - fixedCosts do financialData
 * @param {number} lookahead    - quantos meses à frente verificar
 * @returns {EndingCost[]}
 */
const detectEndingCosts = (fixedCosts = [], lookahead = 12) => {
  const now = new Date();
  const results = [];

  fixedCosts.forEach(cost => {
    if (!cost.endDate || !cost.amount) return;

    const end = new Date(cost.endDate);
    const diffMs = end - now;
    const diffMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));

    if (diffMonths > 0 && diffMonths <= lookahead) {
      results.push({
        id:         cost.id,
        name:       cost.name || 'Custo sem nome',
        amount:     cost.amount,
        endDate:    cost.endDate,
        monthsLeft: diffMonths,
        endLabel:   end.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      });
    }
  });

  return results.sort((a, b) => a.monthsLeft - b.monthsLeft);
};

/**
 * Calcula o retorno médio ponderado mensal da carteira atual.
 */
const calcWeightedReturn = (allocation, rates) => {
  const cdi   = (allocation.cdi   / 100) * annualToMonthly(rates.cdi * ((rates.cdiPercentage || 100) / 100));
  const selic = (allocation.selic / 100) * annualToMonthly(rates.selic);
  const cdb   = (allocation.cdb   / 100) * annualToMonthly(rates.cdb);
  const fii   = (allocation.fii   / 100) * (rates.fii / 100);
  return (cdi + selic + cdb + fii) * 100; // em %
};

/**
 * Detecta o mês mais próximo em que o patrimônio atinge um marco (milestone).
 */
const findMilestoneMonth = (projection, target) => {
  return projection.find(m => m.patrimony >= target) || null;
};

// ─── 1. Métricas de visão geral ───────────────────────────────────────────────

/**
 * @returns {OverviewMetrics}
 */
export const buildOverview = (financialData, settings, projection) => {
  const { monthlyIncome = 0, initialPatrimony = 0, fixedCosts = [], variableExpenses = [], allocation = {} } = financialData;
  const rates = settings?.rates || {};

  const { fixed, variable, total } = calcExpenses(fixedCosts, variableExpenses);
  const surplus    = monthlyIncome - total;
  const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;
  const fixedPct   = monthlyIncome > 0 ? (fixed / monthlyIncome) * 100 : 0;
  const monthlyReturn = calcWeightedReturn(allocation, rates);

  const last = projection?.length > 0 ? projection[projection.length - 1] : null;
  const totalReturns      = projection?.reduce((s, m) => s + (m.investmentReturns || 0), 0) || 0;
  const totalContributions= projection?.reduce((s, m) => s + Math.max(0, m.surplusForInvestments || 0), 0) || 0;

  // Quanto os rendimentos representam do crescimento total
  const totalGrowth = last ? last.patrimony - initialPatrimony : 0;
  const returnShare = totalGrowth > 0 ? (totalReturns / totalGrowth) * 100 : 0;

  return {
    monthlyIncome,
    totalExpenses:    total,
    fixedExpenses:    fixed,
    variableExpenses: variable,
    surplus,
    savingsRate,
    fixedPct,
    monthlyWeightedReturn: monthlyReturn,
    initialPatrimony,
    projectedPatrimony:   last?.patrimony || initialPatrimony,
    totalReturns,
    totalContributions,
    returnShare,          // % do crescimento vindo de juros (não de aportes)
    durationMonths: financialData.durationMonths || 12,
  };
};

// ─── 2. Alertas ───────────────────────────────────────────────────────────────

/**
 * Gera alertas ordenados por severidade.
 * severity: 'critical' | 'warning' | 'info'
 *
 * @returns {Alert[]}
 */
export const buildAlerts = (financialData, settings, projection) => {
  const alerts = [];
  const { monthlyIncome = 0, initialPatrimony = 0, fixedCosts = [], variableExpenses = [], allocation = {} } = financialData;
  const rates = settings?.rates || {};

  const { fixed, total } = calcExpenses(fixedCosts, variableExpenses);
  const surplus     = monthlyIncome - total;
  const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;
  const fixedPct    = monthlyIncome > 0 ? (fixed / monthlyIncome) * 100 : 0;
  const monthlyExpenses = monthlyIncome - surplus;
  const emergencyMonths = monthlyExpenses > 0 ? initialPatrimony / monthlyExpenses : 0;
  const maxAlloc        = Math.max(allocation.cdi || 0, allocation.selic || 0, allocation.cdb || 0, allocation.fii || 0);

  // 🚨 Gastos superam a renda
  if (surplus < 0) {
    alerts.push({
      id:       'negative_surplus',
      severity: 'critical',
      icon:     'XCircle',
      title:    'Gastos acima da renda',
      summary:  `Você está gastando R$ ${Math.abs(surplus).toFixed(2)} a mais do que ganha todo mês.`,
      detail:   'Na prática, isso significa que você está se endividando ou consumindo reservas. Sem corrigir isso, qualquer planejamento de investimento é inviável.',
      action:   'Reduza imediatamente gastos variáveis ou busque renda extra.',
      priority: 0,
    });
  }

  // 🚨 Taxa de poupança crítica
  if (surplus >= 0 && savingsRate < 10) {
    alerts.push({
      id:       'critical_savings',
      severity: 'critical',
      icon:     'AlertTriangle',
      title:    'Taxa de poupança crítica',
      summary:  `Você está poupando apenas ${savingsRate.toFixed(1)}% da renda — o mínimo recomendado é 20%.`,
      detail:   'Com menos de 10% de poupança, qualquer imprevisto pode comprometer suas finanças. Os juros compostos só trabalham a seu favor com aportes consistentes.',
      action:   'Identifique pelo menos R$ ' + Math.round((monthlyIncome * 0.10) - surplus) + ' em gastos para cortar este mês.',
      priority: 1,
    });
  }

  // ⚠️ Taxa de poupança baixa
  if (savingsRate >= 10 && savingsRate < BENCHMARKS.SAVINGS_RATE_GOOD) {
    alerts.push({
      id:       'low_savings',
      severity: 'warning',
      icon:     'TrendingDown',
      title:    'Poupança abaixo do ideal',
      summary:  `Você poupa ${savingsRate.toFixed(1)}% da renda. O ideal é chegar a 20%.`,
      detail:   `Aumentar para 20% significaria guardar mais R$ ${Math.round(monthlyIncome * 0.20 - surplus)}/mês — isso dobra o poder dos juros compostos ao longo do tempo.`,
      action:   'Revise gastos variáveis e veja se há assinaturas ou hábitos que podem ser reduzidos.',
      priority: 2,
    });
  }

  // ⚠️ Reserva de emergência insuficiente
  if (emergencyMonths < BENCHMARKS.EMERGENCY_MONTHS_MIN) {
    alerts.push({
      id:       'no_emergency_fund',
      severity: 'critical',
      icon:     'Shield',
      title:    'Sem reserva de emergência',
      summary:  `Sua reserva atual cobre ${emergencyMonths.toFixed(1)} meses de despesas. O mínimo é 3 meses.`,
      detail:   'Sem reserva, qualquer emergência (saúde, desemprego, carro) força você a resgatar investimentos no pior momento ou se endividar.',
      action:   'Antes de investir mais, destine parte da sobra para uma conta com liquidez diária (Tesouro Selic ou CDB com liquidez).',
      priority: 1,
    });
  } else if (emergencyMonths < BENCHMARKS.EMERGENCY_MONTHS_IDEAL) {
    alerts.push({
      id:       'partial_emergency_fund',
      severity: 'warning',
      icon:     'Shield',
      title:    'Reserva de emergência parcial',
      summary:  `Sua reserva cobre ${emergencyMonths.toFixed(1)} meses. O ideal é ter 6 meses.`,
      detail:   `Faltam R$ ${Math.round((BENCHMARKS.EMERGENCY_MONTHS_IDEAL - emergencyMonths) * monthlyExpenses)} para completar 6 meses de reserva. Você não precisa parar tudo — pode construir gradualmente.`,
      action:   'Continue destinando parte da sobra para a reserva até completar 6 meses.',
      priority: 3,
    });
  }

  // ⚠️ Gastos fixos muito altos
  if (fixedPct > BENCHMARKS.HIGH_FIXED_COST_PCT) {
    alerts.push({
      id:       'high_fixed_costs',
      severity: 'warning',
      icon:     'Lock',
      title:    'Gastos fixos altos',
      summary:  `${fixedPct.toFixed(0)}% da sua renda vai para custos fixos — o recomendado é até 50%.`,
      detail:   'Gastos fixos altos reduzem sua flexibilidade financeira. Em caso de redução de renda, você tem pouco espaço para ajuste.',
      action:   'Avalie se há custos fixos que podem ser renegociados ou eliminados (planos, assinaturas, parcelas).',
      priority: 4,
    });
  }

  // ⚠️ Carteira muito concentrada
  if (maxAlloc > BENCHMARKS.MAX_SINGLE_ASSET) {
    const assetName = ['CDI', 'Tesouro Selic', 'CDB', 'FII'][[allocation.cdi, allocation.selic, allocation.cdb, allocation.fii].indexOf(maxAlloc)];
    alerts.push({
      id:       'concentrated_portfolio',
      severity: 'warning',
      icon:     'PieChart',
      title:    'Carteira concentrada',
      summary:  `${maxAlloc}% dos seus investimentos estão em ${assetName || 'um único ativo'}.`,
      detail:   'Concentração excessiva aumenta o risco. Se esse ativo perder rendimento ou liquidez, toda a carteira é afetada.',
      action:   'Distribua gradualmente entre 2–3 tipos de ativos para reduzir risco sem perder muito retorno.',
      priority: 5,
    });
  }

  // ℹ️ Sem FII na carteira (horizonte longo)
  const durationMonths = financialData.durationMonths || 12;
  if ((allocation.fii || 0) === 0 && durationMonths >= 24) {
    alerts.push({
      id:       'no_fii',
      severity: 'info',
      icon:     'Building2',
      title:    'Oportunidade em FII',
      summary:  'Você não tem FII na carteira, mas seu horizonte de investimento é longo.',
      detail:   'FIIs distribuem rendimentos mensais isentos de IR para pessoa física e historicamente rendem entre 0,7–1,0% ao mês. Com horizonte de mais de 2 anos, a exposição faz sentido.',
      action:   'Considere alocar 10–20% em FIIs de tijolo ou papel para diversificação com renda passiva.',
      priority: 6,
    });
  }

  return alerts.sort((a, b) => a.priority - b.priority);
};

// ─── 3. Oportunidades ─────────────────────────────────────────────────────────

/**
 * Detecta oportunidades financeiras baseadas nos dados do usuário.
 * Foco em: fim de parcelamentos, sobra não alocada, melhora de taxas.
 *
 * @returns {Opportunity[]}
 */
export const buildOpportunities = (financialData, settings, projection) => {
  const opps = [];
  const { monthlyIncome = 0, fixedCosts = [], variableExpenses = [], allocation = {}, surplusAllocation = {} } = financialData;
  const rates = settings?.rates || {};

  const { total } = calcExpenses(fixedCosts, variableExpenses);
  const surplus = monthlyIncome - total;

  // 💡 Parcelamentos/custos fixos encerrando
  const endingCosts = detectEndingCosts(fixedCosts, 12);
  endingCosts.forEach(cost => {
    opps.push({
      id:       `ending_cost_${cost.id}`,
      type:     'cashflow',
      icon:     'Sparkles',
      urgency:  cost.monthsLeft <= 3 ? 'high' : 'medium',
      title:    `Em ${cost.endLabel}, você terá +R$ ${cost.amount.toFixed(0)}/mês livres`,
      summary:  `"${cost.name}" encerra em ${cost.monthsLeft} ${cost.monthsLeft === 1 ? 'mês' : 'meses'}.`,
      detail:   `Quando esse custo encerrar, você terá R$ ${cost.amount.toFixed(2)} a mais por mês disponíveis. Isso representa R$ ${(cost.amount * (12 - cost.monthsLeft)).toFixed(0)} extras até o fim do ano se investidos.`,
      action:   `Planeje já para onde vai esse valor: investimentos, reserva de emergência ou meta específica.`,
      impact:   cost.amount,
      monthsLeft: cost.monthsLeft,
    });
  });

  // 💡 Sobra não totalmente alocada em investimentos
  const investPct = (surplusAllocation?.investments || 100) / 100;
  const investedSurplus = surplus > 0 ? surplus * investPct : 0;
  const uninvestedSurplus = surplus > 0 ? surplus * (1 - investPct) : 0;

  if (uninvestedSurplus > 50) {
    opps.push({
      id:       'uninvested_surplus',
      type:     'allocation',
      icon:     'TrendingUp',
      urgency:  'medium',
      title:    `R$ ${uninvestedSurplus.toFixed(0)}/mês da sobra não está sendo investido`,
      summary:  `${Math.round((1 - investPct) * 100)}% da sua sobra vai para conta corrente ou outros destinos.`,
      detail:   `Se esse valor fosse investido mensalmente com seu retorno médio atual (${calcWeightedReturn(allocation, rates).toFixed(2)}%/mês), você acumularia mais no longo prazo graças aos juros compostos.`,
      action:   'Ajuste o "Destino da Sobra" em Investimentos para alocar mais para investimentos.',
      impact:   uninvestedSurplus,
    });
  }

  // 💡 CDI abaixo de 100% (perda em relação ao benchmark)
  if ((rates.cdiPercentage || 100) < 100 && (allocation.cdi || 0) > 0) {
    const monthlyLoss = (allocation.cdi / 100) * (surplus > 0 ? investedSurplus : 0)
                      * annualToMonthly(rates.cdi * (1 - rates.cdiPercentage / 100)) * 100;
    opps.push({
      id:       'below_cdi',
      type:     'rate',
      icon:     'Percent',
      urgency:  'low',
      title:    `Você está rendendo ${rates.cdiPercentage}% do CDI — pode conseguir mais`,
      summary:  'Bancos digitais (Nubank, PicPay, C6) oferecem 100–115% do CDI com liquidez diária.',
      detail:   'A diferença entre 90% e 110% do CDI parece pequena, mas ao longo de 12+ meses representa centenas de reais a mais sem nenhum risco adicional.',
      action:   'Pesquise CDBs de liquidez diária em plataformas como XP, BTG ou Rico com 100%+ do CDI.',
      impact:   null,
    });
  }

  // 💡 Horizonte curto mas aportes altos em FII
  const durationMonths = financialData.durationMonths || 12;
  if (durationMonths <= 12 && (allocation.fii || 0) > 20) {
    opps.push({
      id:       'fii_short_horizon',
      type:     'risk',
      icon:     'AlertTriangle',
      urgency:  'medium',
      title:    'FIIs com horizonte curto — atenção ao risco',
      summary:  `Você tem ${allocation.fii}% em FII com planejamento de apenas ${durationMonths} meses.`,
      detail:   'FIIs são ativos de renda variável — seu preço oscila. Com horizonte menor que 12 meses, você pode precisar vender em queda. FIIs fazem mais sentido para horizontes de 2+ anos.',
      action:   'Se precisar do dinheiro em menos de 12 meses, considere mover parte dos FIIs para Tesouro Selic ou CDB com liquidez.',
      impact:   null,
    });
  }

  return opps.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
};

// ─── 4. Marcos projetados ─────────────────────────────────────────────────────

/**
 * Detecta quando o patrimônio vai atingir marcos relevantes.
 *
 * @returns {Milestone[]}
 */
export const buildMilestones = (financialData, projection) => {
  if (!projection || projection.length === 0) return [];

  const { initialPatrimony = 0, monthlyIncome = 0, fixedCosts = [], variableExpenses = [] } = financialData;
  const { total } = calcExpenses(fixedCosts, variableExpenses);
  const monthlyExpenses = monthlyIncome - (monthlyIncome - total);

  const milestones = [];

  // Marco: 3 meses de despesas (emergência mínima)
  const em3 = monthlyExpenses * 3;
  if (em3 > initialPatrimony) {
    const m = findMilestoneMonth(projection, em3);
    if (m) milestones.push({
      id:     'emergency_3m',
      icon:   'Shield',
      color:  'text-amber-400',
      label:  '3 meses de reserva',
      value:  em3,
      month:  m.month,
      label2: m.monthLabel,
      description: 'Reserva mínima de emergência atingida.',
    });
  }

  // Marco: 6 meses de despesas (emergência ideal)
  const em6 = monthlyExpenses * 6;
  if (em6 > initialPatrimony) {
    const m = findMilestoneMonth(projection, em6);
    if (m) milestones.push({
      id:     'emergency_6m',
      icon:   'ShieldCheck',
      color:  'text-emerald-400',
      label:  '6 meses de reserva',
      value:  em6,
      month:  m.month,
      label2: m.monthLabel,
      description: 'Reserva de emergência completa — meta dos especialistas.',
    });
  }

  // Marcos de valor absoluto
  const targets = [5000, 10000, 25000, 50000, 100000];
  targets.forEach(target => {
    if (target > initialPatrimony) {
      const m = findMilestoneMonth(projection, target);
      if (m) milestones.push({
        id:     `target_${target}`,
        icon:   'Target',
        color:  'text-blue-400',
        label:  `R$ ${target >= 1000 ? (target / 1000) + 'k' : target}`,
        value:  target,
        month:  m.month,
        label2: m.monthLabel,
        description: `Patrimônio de R$ ${target.toLocaleString('pt-BR')} atingido.`,
      });
    }
  });

  // Marco: rendimentos > aportes (ponto de inflexão dos juros compostos)
  let cumReturn = 0, cumContrib = 0, inflectionMonth = null;
  projection.forEach(m => {
    cumReturn += m.investmentReturns || 0;
    cumContrib += Math.max(0, m.surplusForInvestments || 0);
    if (!inflectionMonth && cumReturn >= cumContrib && cumContrib > 0) {
      inflectionMonth = m;
    }
  });
  if (inflectionMonth) {
    milestones.push({
      id:     'compound_inflection',
      icon:   'Zap',
      color:  'text-purple-400',
      label:  'Juros > Aportes',
      value:  null,
      month:  inflectionMonth.month,
      label2: inflectionMonth.monthLabel,
      description: 'A partir daqui, os juros compostos rendem mais do que você aporta. O dinheiro trabalha mais que você.',
    });
  }

  return milestones.sort((a, b) => a.month - b.month);
};

// ─── 5. Conselho de alocação ──────────────────────────────────────────────────

/**
 * Avalia a alocação atual e sugere ajustes baseados no perfil detectado.
 *
 * @returns {AllocationAdvice}
 */
export const buildAllocationAdvice = (financialData, settings) => {
  const { allocation = {}, durationMonths = 12, initialPatrimony = 0, fixedCosts = [], variableExpenses = [], monthlyIncome = 0 } = financialData;
  const rates = settings?.rates || {};

  const { total } = calcExpenses(fixedCosts, variableExpenses);
  const surplus = monthlyIncome - total;
  const monthlyExpenses = monthlyIncome - surplus;
  const emergencyMonths = monthlyExpenses > 0 ? initialPatrimony / monthlyExpenses : 0;

  // Detecta perfil
  let profile, profileLabel, profileDescription;
  if (emergencyMonths < 3) {
    profile = 'ultraconservative';
    profileLabel = 'Ultra-conservador (sem reserva)';
    profileDescription = 'Sem reserva de emergência, liquidez deve ser prioridade absoluta.';
  } else if (durationMonths <= 12) {
    profile = 'conservative';
    profileLabel = 'Conservador (curto prazo)';
    profileDescription = 'Horizonte curto exige preservação de capital e liquidez.';
  } else if (durationMonths <= 30) {
    profile = 'moderate';
    profileLabel = 'Moderado (médio prazo)';
    profileDescription = 'Equilíbrio entre crescimento e segurança.';
  } else {
    profile = 'growth';
    profileLabel = 'Crescimento (longo prazo)';
    profileDescription = 'Horizonte longo permite maior exposição a renda variável.';
  }

  // Alocações recomendadas por perfil
  const RECOMMENDED = {
    ultraconservative: { cdi: 80, selic: 20, cdb: 0,  fii: 0  },
    conservative:      { cdi: 50, selic: 30, cdb: 15, fii: 5  },
    moderate:          { cdi: 30, selic: 20, cdb: 25, fii: 25 },
    growth:            { cdi: 20, selic: 10, cdb: 25, fii: 45 },
  };

  const recommended = RECOMMENDED[profile];

  // Calcula retorno atual vs recomendado
  const currentReturn  = calcWeightedReturn(allocation, rates);
  const recReturn      = calcWeightedReturn(recommended, rates);
  const returnDelta    = recReturn - currentReturn;

  // Diferenças por ativo
  const diffs = Object.keys(recommended).map(asset => ({
    asset:   asset.toUpperCase(),
    current: allocation[asset] || 0,
    target:  recommended[asset],
    delta:   recommended[asset] - (allocation[asset] || 0),
  })).filter(d => d.delta !== 0);

  return {
    profile,
    profileLabel,
    profileDescription,
    currentAllocation:  allocation,
    recommendedAllocation: recommended,
    currentMonthlyReturn:  currentReturn,
    recommendedMonthlyReturn: recReturn,
    returnDelta,
    diffs,
    isAlreadyOptimal: diffs.length === 0,
  };
};

// ─── 6. Score de comportamento financeiro ─────────────────────────────────────

/**
 * Score focado no COMPORTAMENTO do investidor, não só nos números.
 * Complementa o ExplainableScore da Análise (que foca em saúde geral).
 *
 * @returns {BehaviorScore}
 */
export const buildBehaviorScore = (financialData, settings, projection) => {
  const { monthlyIncome = 0, initialPatrimony = 0, fixedCosts = [], variableExpenses = [],
          allocation = {}, tieredContributions = [], durationMonths = 12 } = financialData;
  const rates = settings?.rates || {};

  const { total } = calcExpenses(fixedCosts, variableExpenses);
  const surplus = monthlyIncome - total;
  const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;
  const monthlyReturn = calcWeightedReturn(allocation, rates);
  const totalReturns = projection?.reduce((s, m) => s + (m.investmentReturns || 0), 0) || 0;

  const items = [];
  let totalScore = 0;

  // Consistência de aportes (tem tiered contributions = planejou diferentes fases)
  const consistencyScore = tieredContributions.length > 0 ? 25 : savingsRate >= 10 ? 15 : 5;
  items.push({
    label:       'Consistência de aportes',
    score:       consistencyScore,
    maxScore:    25,
    description: tieredContributions.length > 0
      ? `Você planejou ${tieredContributions.length} faixas de aporte — excelente previsibilidade.`
      : savingsRate >= 10
      ? 'Você tem aportes regulares, mas sem planejamento por fases.'
      : 'Configure aportes consistentes para construir o hábito.',
  });
  totalScore += consistencyScore;

  // Horizonte de visão
  const horizonScore = durationMonths >= 36 ? 25 : durationMonths >= 24 ? 18 : durationMonths >= 12 ? 12 : 5;
  items.push({
    label:       'Visão de longo prazo',
    score:       horizonScore,
    maxScore:    25,
    description: durationMonths >= 36
      ? `Planejamento de ${durationMonths} meses — você pensa como investidor.`
      : `${durationMonths} meses de planejamento. Tente planejar para 3+ anos.`,
  });
  totalScore += horizonScore;

  // Aproveitamento dos juros compostos
  const totalContribs = projection?.reduce((s, m) => s + Math.max(0, m.surplusForInvestments || 0), 0) || 0;
  const compoundRatio = totalContribs > 0 ? totalReturns / totalContribs : 0;
  const compoundScore = compoundRatio >= 0.5 ? 25 : compoundRatio >= 0.25 ? 15 : compoundRatio > 0 ? 8 : 0;
  items.push({
    label:       'Aproveitamento dos juros compostos',
    score:       compoundScore,
    maxScore:    25,
    description: compoundRatio >= 0.5
      ? `Seus rendimentos já são ${(compoundRatio * 100).toFixed(0)}% do que você aportou — o dinheiro trabalha por você.`
      : compoundRatio > 0
      ? `Seus rendimentos chegam a ${(compoundRatio * 100).toFixed(0)}% dos aportes. O tempo vai amplificar isso.`
      : 'Configure investimentos para os juros compostos começarem a trabalhar.',
  });
  totalScore += compoundScore;

  // Qualidade da carteira (diversificação + taxas)
  const maxAlloc = Math.max(...Object.values(allocation).filter(v => !isNaN(v)));
  const qualityScore = maxAlloc <= 40 ? 25 : maxAlloc <= 60 ? 15 : maxAlloc <= 80 ? 8 : 3;
  items.push({
    label:       'Qualidade da carteira',
    score:       qualityScore,
    maxScore:    25,
    description: maxAlloc <= 40
      ? `Carteira bem diversificada — maior concentração é ${maxAlloc}%.`
      : `Concentração de ${maxAlloc}% em um único ativo. Diversifique para reduzir risco.`,
  });
  totalScore += qualityScore;

  const grade = totalScore >= 85 ? 'A' : totalScore >= 65 ? 'B' : totalScore >= 45 ? 'C' : totalScore >= 25 ? 'D' : 'F';

  return {
    totalScore: Math.round(totalScore),
    maxScore:   100,
    grade,
    items,
    summary: totalScore >= 65
      ? 'Você tem um comportamento financeiro sólido.'
      : totalScore >= 45
      ? 'Seu comportamento financeiro é regular — há espaço para evolução.'
      : 'Há ajustes importantes de comportamento a fazer.',
  };
};

// ─── Exportação principal ─────────────────────────────────────────────────────

/**
 * buildInsightReport — entry point principal.
 * Gera o relatório completo de insights em uma chamada.
 *
 * Preparado para IA: os retornos estruturados podem ser serializados
 * como contexto para um LLM gerar narrativas personalizadas no futuro.
 *
 * @param {object} financialData
 * @param {object} settings
 * @param {Array}  projection
 * @returns {InsightReport}
 */
export const buildInsightReport = (financialData, settings, projection) => {
  return {
    overview:         buildOverview(financialData, settings, projection),
    alerts:           buildAlerts(financialData, settings, projection),
    opportunities:    buildOpportunities(financialData, settings, projection),
    milestones:       buildMilestones(financialData, projection),
    allocationAdvice: buildAllocationAdvice(financialData, settings),
    behaviorScore:    buildBehaviorScore(financialData, settings, projection),
  };
};

export default buildInsightReport;