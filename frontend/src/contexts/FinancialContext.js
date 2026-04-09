import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from './AuthContext';
import { storageService } from '../services/storageService';
import {
  projectPatrimonyEvolution,
  generateId,
  formatCurrency,
  formatPercentage,
  CURRENCIES,
  DEFAULT_RATES,
} from '../services/financialEngine';
import { generateAlerts, calculateScoreBreakdown, generateSuggestions } from '../services/simulationEngine';

const FinancialContext = createContext(null);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

// ─── Constantes de fonte de pagamento ────────────────────────────────────────

// Templates prontos que o usuário pode usar como ponto de partida.
// O usuário pode personalizar nome e cor depois de escolher um template.
export const PAYMENT_SOURCE_TEMPLATES = [
  { type: 'checking',    label: 'Conta Corrente',    icon: 'wallet',      color: '#22c55e' },
  { type: 'credit_card', label: 'Cartão de Crédito', icon: 'credit-card', color: '#3b82f6' },
  { type: 'pix',         label: 'Pix',               icon: 'zap',         color: '#a855f7' },
  { type: 'cash',        label: 'Dinheiro',           icon: 'banknote',    color: '#f59e0b' },
  { type: 'benefit',     label: 'Benefício',          icon: 'gift',        color: '#ec4899' },
  { type: 'other',       label: 'Outro',              icon: 'more',        color: '#6b7280' },
];

// Limites de alerta: dispara quando o gasto da fonte atingir esses percentuais do limit mensal.
const LIMIT_ALERT_THRESHOLDS = [0.8, 1.0]; // 80% e 100%

export const FinancialProvider = ({ children }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  // ─── State ────────────────────────────────────────────────────────────────

  const [settings, setSettings]               = useState(storageService.getDefaultSettings());
  const [financialData, setFinancialData]     = useState(storageService.getDefaultFinancialData());
  const [scenarios, setScenarios]             = useState([]);
  const [lifeObjectives, setLifeObjectives]   = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [transactions, setTransactions]       = useState([]);
  const [paymentSources, setPaymentSources]   = useState([]);   // ← NOVO
  const [isLoaded, setIsLoaded]               = useState(false);

  const { theme, toggleTheme, isDark, mounted: themeMounted, setTheme } = useTheme(settings.theme);

  // ─── Carrega dados do Firestore ───────────────────────────────────────────

  useEffect(() => {
    if (!uid) {
      setIsLoaded(false);
      return;
    }

    const loadData = async () => {
      setIsLoaded(false);
      const [
        storedSettings,
        storedFinancialData,
        storedScenarios,
        storedObjectives,
        storedDismissed,
        storedTransactions,
        storedPaymentSources,          // ← NOVO
      ] = await Promise.all([
        storageService.getSettings(uid),
        storageService.getFinancialData(uid),
        storageService.getScenarios(uid),
        storageService.getLifeObjectives(uid),
        storageService.getDismissedAlerts(uid),
        storageService.getTransactions(uid),
        storageService.getPaymentSources(uid),  // ← NOVO
      ]);

      if (storedSettings)       setSettings(storedSettings);
      if (storedFinancialData)  setFinancialData(storedFinancialData);
      if (storedScenarios)      setScenarios(storedScenarios);
      if (storedObjectives)     setLifeObjectives(storedObjectives);
      if (storedDismissed)      setDismissedAlerts(storedDismissed);
      if (storedTransactions)   setTransactions(storedTransactions);
      if (storedPaymentSources) setPaymentSources(storedPaymentSources); // ← NOVO

      setIsLoaded(true);
    };

    loadData();
  }, [uid]);

  // ─── Sincronização de tema ────────────────────────────────────────────────

  useEffect(() => {
    if (isLoaded && uid) setSettings(prev => ({ ...prev, theme }));
  }, [theme]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoaded && settings.theme) setTheme(settings.theme);
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Persistência ────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoaded && uid) storageService.saveSettings(uid, settings);
  }, [settings, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid) storageService.saveFinancialData(uid, financialData);
  }, [financialData, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid) storageService.saveScenarios(uid, scenarios);
  }, [scenarios, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid) storageService.saveLifeObjectives(uid, lifeObjectives);
  }, [lifeObjectives, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid) storageService.saveDismissedAlerts(uid, dismissedAlerts);
  }, [dismissedAlerts, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid) storageService.saveTransactions(uid, transactions);
  }, [transactions, isLoaded, uid]);

  // ← NOVO: persiste paymentSources
  useEffect(() => {
    if (isLoaded && uid) storageService.savePaymentSources(uid, paymentSources);
  }, [paymentSources, isLoaded, uid]);

  // ─── Settings ─────────────────────────────────────────────────────────────

  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const updateRates = useCallback((rateUpdates) => {
    setSettings(prev => ({
      ...prev,
      rates: { ...prev.rates, ...rateUpdates },
    }));
  }, []);

  // ─── Financial data ───────────────────────────────────────────────────────

  const updateFinancialData = useCallback((updates) => {
    setFinancialData(prev => ({ ...prev, ...updates }));
  }, []);

  const addFixedCost = useCallback((cost) => {
    setFinancialData(prev => ({
      ...prev,
      fixedCosts: [...prev.fixedCosts, { ...cost, id: generateId() }],
    }));
  }, []);

  const updateFixedCost = useCallback((id, updates) => {
    setFinancialData(prev => ({
      ...prev,
      fixedCosts: prev.fixedCosts.map(cost =>
        cost.id === id ? { ...cost, ...updates } : cost
      ),
    }));
  }, []);

  const removeFixedCost = useCallback((id) => {
    setFinancialData(prev => ({
      ...prev,
      fixedCosts: prev.fixedCosts.filter(cost => cost.id !== id),
    }));
  }, []);

  const addVariableExpense = useCallback((expense) => {
    setFinancialData(prev => ({
      ...prev,
      variableExpenses: [...prev.variableExpenses, { ...expense, id: generateId() }],
    }));
  }, []);

  const updateVariableExpense = useCallback((id, updates) => {
    setFinancialData(prev => ({
      ...prev,
      variableExpenses: prev.variableExpenses.map(exp =>
        exp.id === id ? { ...exp, ...updates } : exp
      ),
    }));
  }, []);

  const removeVariableExpense = useCallback((id) => {
    setFinancialData(prev => ({
      ...prev,
      variableExpenses: prev.variableExpenses.filter(exp => exp.id !== id),
    }));
  }, []);

  const updateAllocation = useCallback((allocationUpdates) => {
    setFinancialData(prev => ({
      ...prev,
      allocation: { ...prev.allocation, ...allocationUpdates },
    }));
  }, []);

  // ─── Scenarios ────────────────────────────────────────────────────────────

  const saveScenario = useCallback((name) => {
    const newScenario = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      config: { ...financialData, rates: { ...settings.rates } },
    };
    setScenarios(prev => [...prev, newScenario]);
    return newScenario;
  }, [financialData, settings.rates]);

  const loadScenario = useCallback((scenarioId) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setFinancialData(scenario.config);
      if (scenario.config.rates) {
        setSettings(prev => ({ ...prev, rates: scenario.config.rates }));
      }
    }
  }, [scenarios]);

  const deleteScenario = useCallback((scenarioId) => {
    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
  }, []);

  // ─── Life objectives ──────────────────────────────────────────────────────

  const addLifeObjective = useCallback((objective) => {
    setLifeObjectives(prev => [
      ...prev,
      { ...objective, id: generateId(), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const updateLifeObjective = useCallback((id, updates) => {
    setLifeObjectives(prev =>
      prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj)
    );
  }, []);

  const removeLifeObjective = useCallback((id) => {
    setLifeObjectives(prev => prev.filter(obj => obj.id !== id));
  }, []);

  // ─── Alerts ───────────────────────────────────────────────────────────────

  const dismissAlert = useCallback((alertId) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  }, []);

  const clearDismissedAlerts = useCallback(() => {
    setDismissedAlerts([]);
  }, []);

  // ─── Transactions ─────────────────────────────────────────────────────────
  // Lançamentos pontuais do dia a dia.
  // Estrutura: { id, description, amount, category, date, sourceId, createdAt }
  // sourceId é opcional — null significa "sem fonte específica".

  const addTransaction = useCallback((transaction) => {
    const now = new Date();
    setTransactions(prev => [
      {
        ...transaction,
        id:        generateId(),
        date:      transaction.date || now.toISOString().slice(0, 10),
        sourceId:  transaction.sourceId || null,
        createdAt: now.toISOString(),
      },
      ...prev, // mais recente primeiro
    ]);
  }, []);

  const removeTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // Transactions do mês atual (YYYY-MM)
  const currentMonthTransactions = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions.filter(t => t.date?.startsWith(currentMonth));
  }, [transactions]);

  // Total gasto em lançamentos no mês atual (todas as fontes)
  const totalTransactionsThisMonth = useMemo(() => {
    return currentMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [currentMonthTransactions]);

  // ─── NOVO: Payment Sources ────────────────────────────────────────────────
  // Fontes de pagamento: conta própria, cartão de terceiro, pix, etc.
  // Estrutura: {
  //   id, name, type, owner, ownerName, color,
  //   isDefault, includeInProjection, monthlyLimit
  // }

  const addPaymentSource = useCallback((source) => {
    setPaymentSources(prev => {
      // Se for marcado como default, remove o default das outras
      const updated = source.isDefault
        ? prev.map(s => ({ ...s, isDefault: false }))
        : prev;

      return [
        ...updated,
        {
          ...source,
          id:        generateId(),
          createdAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const updatePaymentSource = useCallback((id, updates) => {
    setPaymentSources(prev => {
      // Se está setando isDefault = true, remove das outras
      if (updates.isDefault) {
        return prev.map(s =>
          s.id === id
            ? { ...s, ...updates }
            : { ...s, isDefault: false }
        );
      }
      return prev.map(s => s.id === id ? { ...s, ...updates } : s);
    });
  }, []);

  const removePaymentSource = useCallback((id) => {
    setPaymentSources(prev => prev.filter(s => s.id !== id));
  }, []);

  // Fonte padrão (usada no modal quando nenhuma é selecionada)
  const defaultPaymentSource = useMemo(() => {
    return paymentSources.find(s => s.isDefault) || paymentSources[0] || null;
  }, [paymentSources]);

  // ─── NOVO: Gastos por fonte no mês atual ─────────────────────────────────
  // Retorna um Map de sourceId → total gasto no mês.
  // Transactions sem sourceId ficam em key null.

  const spentBySourceThisMonth = useMemo(() => {
    const map = new Map();
    currentMonthTransactions.forEach(t => {
      const key = t.sourceId || null;
      map.set(key, (map.get(key) || 0) + (t.amount || 0));
    });
    return map;
  }, [currentMonthTransactions]);

  // ─── NOVO: Alertas de limite por fonte ───────────────────────────────────
  // Gera alertas quando uma fonte com monthlyLimit atinge 80% ou 100%.

  const sourceLimitAlerts = useMemo(() => {
    const alerts = [];

    paymentSources.forEach(source => {
      if (!source.monthlyLimit || source.monthlyLimit <= 0) return;

      const spent = spentBySourceThisMonth.get(source.id) || 0;
      const ratio = spent / source.monthlyLimit;

      LIMIT_ALERT_THRESHOLDS.forEach(threshold => {
        if (ratio >= threshold) {
          alerts.push({
            id:        `source-limit-${source.id}-${threshold}`,
            sourceId:  source.id,
            sourceName: source.name,
            threshold,
            spent,
            limit:     source.monthlyLimit,
            ratio,
            // 80% = warning, 100% = danger
            level:     threshold >= 1.0 ? 'danger' : 'warning',
          });
        }
      });
    });

    return alerts;
  }, [paymentSources, spentBySourceThisMonth]);

  // ─── NOVO: Total gasto apenas de fontes incluídas na projeção ─────────────
  // Usado para calcular o termômetro do "seu dinheiro" (excluindo cartão do pai, etc.)

  const totalOwnSourcesThisMonth = useMemo(() => {
    const ownSourceIds = new Set(
      paymentSources
        .filter(s => s.includeInProjection)
        .map(s => s.id)
    );

    // Inclui também transactions sem sourceId (consideradas da conta própria)
    return currentMonthTransactions
      .filter(t => !t.sourceId || ownSourceIds.has(t.sourceId))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [currentMonthTransactions, paymentSources]);

  // ─── Reset ────────────────────────────────────────────────────────────────

  const resetAll = useCallback(async () => {
    await storageService.clearAll(uid);
    setSettings(storageService.getDefaultSettings());
    setFinancialData(storageService.getDefaultFinancialData());
    setScenarios([]);
    setLifeObjectives([]);
    setDismissedAlerts([]);
    setTransactions([]);
    setPaymentSources([]);
    setIsLoaded(false);
  }, [uid]);

  // ─── Projeção ─────────────────────────────────────────────────────────────

  const projection = useMemo(() => {
    if (!financialData.monthlyIncome || financialData.durationMonths <= 0) return [];
    return projectPatrimonyEvolution({
      startDate:        financialData.startDate || new Date().toISOString().slice(0, 7),
      durationMonths:   financialData.durationMonths || 12,
      initialPatrimony: financialData.initialPatrimony || 0,
      monthlyIncome:    financialData.monthlyIncome,
      fixedCosts:       financialData.fixedCosts || [],
      variableExpenses: financialData.variableExpenses || [],
      allocation:       financialData.allocation || { cdi: 25, selic: 25, cdb: 25, fii: 25 },
      rates:            settings.rates || DEFAULT_RATES,
      reinvestFii:      financialData.reinvestFii ?? true,
      surplusAllocation: financialData.surplusAllocation,
      inflation:        settings.inflation || 0,
      taxes:            settings.taxes || { enabled: true, fiiExempt: true },
    });
  }, [financialData, settings.rates, settings.inflation, settings.taxes]);

  // ─── Summary ──────────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const totalFixedCosts       = (financialData.fixedCosts       || []).reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalVariableExpenses = (financialData.variableExpenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const calculatedSurplus     = (financialData.monthlyIncome || 0) - totalFixedCosts - totalVariableExpenses;
    const calculatedSavingsRate = financialData.monthlyIncome > 0
      ? (calculatedSurplus / financialData.monthlyIncome) * 100
      : 0;

    if (projection.length === 0) {
      return {
        currentPatrimony:      financialData.initialPatrimony || 0,
        projectedPatrimony:    financialData.initialPatrimony || 0,
        projectedPatrimonyReal: financialData.initialPatrimony || 0,
        totalGrowth:           0,
        totalGrowthPercentage: 0,
        totalContributions:    0,
        totalReturns:          0,
        monthlySurplus:        calculatedSurplus,
        savingsRate:           calculatedSavingsRate,
        inflationImpact:       0,
      };
    }

    const lastMonth          = projection[projection.length - 1];
    const firstMonth         = projection[0];
    const initial            = financialData.initialPatrimony || 0;
    const totalContributions = projection.reduce((sum, m) => sum + Math.max(0, m.surplusForInvestments || m.surplus), 0);
    const totalReturns       = projection.reduce((sum, m) => sum + m.investmentReturns, 0);

    return {
      currentPatrimony:       initial,
      projectedPatrimony:     lastMonth.patrimony,
      projectedPatrimonyReal: lastMonth.patrimonyReal,
      totalGrowth:            lastMonth.patrimony - initial,
      totalGrowthPercentage:  initial > 0 ? ((lastMonth.patrimony - initial) / initial) * 100 : 0,
      totalContributions,
      totalReturns,
      monthlySurplus:  firstMonth.surplus || calculatedSurplus,
      savingsRate:     financialData.monthlyIncome > 0
        ? ((firstMonth.surplus || calculatedSurplus) / financialData.monthlyIncome) * 100
        : 0,
      inflationImpact: lastMonth.patrimony - lastMonth.patrimonyReal,
    };
  }, [projection, financialData]);

  // ─── Score ────────────────────────────────────────────────────────────────

  const scoreBreakdown = useMemo(() => {
    return calculateScoreBreakdown({
      ...financialData,
      rates: settings.rates,
    }, projection);
  }, [financialData, settings.rates, projection]);

  // ─── Alerts (sistema + limites de fonte) ──────────────────────────────────

  const alerts = useMemo(() => {
    return generateAlerts({
      ...financialData,
      rates: settings.rates,
    }, projection, dismissedAlerts);
  }, [financialData, settings.rates, projection, dismissedAlerts]);

  // ─── Suggestions ──────────────────────────────────────────────────────────

  const suggestions = useMemo(() => {
    return generateSuggestions({
      ...financialData,
      rates: settings.rates,
    }, projection, scoreBreakdown);
  }, [financialData, settings.rates, projection, scoreBreakdown]);

  // ─── Context value ────────────────────────────────────────────────────────

  const value = {
    // Auth
    user,

    // Settings
    settings,
    updateSettings,
    updateRates,
    currency: settings.currency,
    setCurrency: (currency) => updateSettings({ currency }),

    // Theme
    theme,
    toggleTheme,
    isDark,
    mounted: themeMounted && isLoaded,

    // Financial data
    financialData,
    updateFinancialData,
    addFixedCost,
    updateFixedCost,
    removeFixedCost,
    addVariableExpense,
    updateVariableExpense,
    removeVariableExpense,
    updateAllocation,

    // Scenarios
    scenarios,
    saveScenario,
    loadScenario,
    deleteScenario,

    // Life objectives
    lifeObjectives,
    addLifeObjective,
    updateLifeObjective,
    removeLifeObjective,

    // Alerts
    alerts,
    dismissedAlerts,
    dismissAlert,
    clearDismissedAlerts,

    // Transactions
    transactions,
    addTransaction,
    removeTransaction,
    currentMonthTransactions,
    totalTransactionsThisMonth,

    // Payment Sources ← NOVO
    paymentSources,
    addPaymentSource,
    updatePaymentSource,
    removePaymentSource,
    defaultPaymentSource,
    spentBySourceThisMonth,
    sourceLimitAlerts,
    totalOwnSourcesThisMonth,

    // Calculations
    projection,
    summary,
    scoreBreakdown,
    suggestions,

    // Reset
    resetAll,

    // Utilities
    formatCurrency: (value) => formatCurrency(value, settings.currency),
    formatPercentage,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

export default FinancialContext;