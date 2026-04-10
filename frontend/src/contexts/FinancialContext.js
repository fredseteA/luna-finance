import React, { createContext, useContext, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from './AuthContext';
import { storageService } from '../services/storageService';
import {
  projectPatrimonyEvolution,
  generateId,
  formatCurrency,
  formatPercentage,
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

export const PAYMENT_SOURCE_TEMPLATES = [
  { type: 'checking',    label: 'Conta Corrente',    icon: 'wallet',      color: '#22c55e' },
  { type: 'credit_card', label: 'Cartão de Crédito', icon: 'credit-card', color: '#3b82f6' },
  { type: 'pix',         label: 'Pix',               icon: 'zap',         color: '#a855f7' },
  { type: 'cash',        label: 'Dinheiro',           icon: 'banknote',    color: '#f59e0b' },
  { type: 'benefit',     label: 'Benefício',          icon: 'gift',        color: '#ec4899' },
  { type: 'other',       label: 'Outro',              icon: 'more',        color: '#6b7280' },
];

const LIMIT_ALERT_THRESHOLDS = [0.8, 1.0];
const LOAD_TIMEOUT_MS = 10000;

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
  const [paymentSources, setPaymentSources]   = useState([]);
  const [isLoaded, setIsLoaded]               = useState(false);
  const isInitialLoadRef = useRef(true);

  const { theme, toggleTheme, isDark, mounted: themeMounted, setTheme } = useTheme(settings.theme);

  // ─── Carrega dados do Firestore ───────────────────────────────────────────

  useEffect(() => {
    if (!uid) {
      setIsLoaded(false);
      isInitialLoadRef.current = true;
      return;
    }

    const loadData = async () => {
      setIsLoaded(false);
      isInitialLoadRef.current = true;
      const withTimeout = (promise) =>
        Promise.race([
          promise,
          new Promise((resolve) =>
            setTimeout(() => resolve(null), LOAD_TIMEOUT_MS)
          ),
        ]);
        
      try {
        const [
          storedSettings,
          storedFinancialData,
          storedScenarios,
          storedObjectives,
          storedDismissed,
          storedTransactions,
          storedPaymentSources,
        ] = await Promise.all([
          withTimeout(storageService.getSettings(uid)),
          withTimeout(storageService.getFinancialData(uid)),
          withTimeout(storageService.getScenarios(uid)),
          withTimeout(storageService.getLifeObjectives(uid)),
          withTimeout(storageService.getDismissedAlerts(uid)),
          withTimeout(storageService.getTransactions(uid)),
          withTimeout(storageService.getPaymentSources(uid)),
        ]);

        if (storedSettings)       setSettings(storedSettings);
        if (storedFinancialData)  setFinancialData(storedFinancialData);
        if (storedScenarios)      setScenarios(storedScenarios);
        if (storedObjectives)     setLifeObjectives(storedObjectives);
        if (storedDismissed)      setDismissedAlerts(storedDismissed);
        if (storedTransactions)   setTransactions(storedTransactions);
        if (storedPaymentSources) setPaymentSources(storedPaymentSources);

      } catch (error) {
        console.error('[FinancialContext] Erro ao carregar dados:', error);
      } finally {
        setIsLoaded(true);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 1000);
      }
    };

    loadData();
  }, [uid]);

  // ─── Sincronização de tema ────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded || !uid) return;
    setSettings(prev => {
      if (prev.theme === theme) return prev; 
      return { ...prev, theme };
    });
  }, [theme, isLoaded, uid]);

  useEffect(() => {
    if (!isLoaded || !settings.theme) return;
    setTheme(settings.theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, settings.theme]);


  useEffect(() => {
    if (isLoaded && uid && !isInitialLoadRef.current)
      storageService.saveSettings(uid, settings);
  }, [settings, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid && !isInitialLoadRef.current)
      storageService.saveFinancialData(uid, financialData);
  }, [financialData, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid && !isInitialLoadRef.current)
      storageService.saveScenarios(uid, scenarios);
  }, [scenarios, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid && !isInitialLoadRef.current)
      storageService.saveLifeObjectives(uid, lifeObjectives);
  }, [lifeObjectives, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid && !isInitialLoadRef.current)
      storageService.saveDismissedAlerts(uid, dismissedAlerts);
  }, [dismissedAlerts, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid && !isInitialLoadRef.current)
      storageService.saveTransactions(uid, transactions);
  }, [transactions, isLoaded, uid]);

  useEffect(() => {
    if (isLoaded && uid && !isInitialLoadRef.current)
      storageService.savePaymentSources(uid, paymentSources);
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
      ...prev,
    ]);
  }, []);

  const removeTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const currentMonthTransactions = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions.filter(t => t.date?.startsWith(currentMonth));
  }, [transactions]);

  const totalTransactionsThisMonth = useMemo(() => {
    return currentMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [currentMonthTransactions]);

  // ─── Payment Sources ──────────────────────────────────────────────────────

  const addPaymentSource = useCallback((source) => {
    setPaymentSources(prev => {
      const updated = source.isDefault
        ? prev.map(s => ({ ...s, isDefault: false }))
        : prev;
      return [
        ...updated,
        { ...source, id: generateId(), createdAt: new Date().toISOString() },
      ];
    });
  }, []);

  const updatePaymentSource = useCallback((id, updates) => {
    setPaymentSources(prev => {
      if (updates.isDefault) {
        return prev.map(s =>
          s.id === id ? { ...s, ...updates } : { ...s, isDefault: false }
        );
      }
      return prev.map(s => s.id === id ? { ...s, ...updates } : s);
    });
  }, []);

  const removePaymentSource = useCallback((id) => {
    setPaymentSources(prev => prev.filter(s => s.id !== id));
  }, []);

  const defaultPaymentSource = useMemo(() => {
    return paymentSources.find(s => s.isDefault) || paymentSources[0] || null;
  }, [paymentSources]);

  const spentBySourceThisMonth = useMemo(() => {
    const map = new Map();
    currentMonthTransactions.forEach(t => {
      const key = t.sourceId || null;
      map.set(key, (map.get(key) || 0) + (t.amount || 0));
    });
    return map;
  }, [currentMonthTransactions]);

  const sourceLimitAlerts = useMemo(() => {
    const result = [];
    paymentSources.forEach(source => {
      if (!source.monthlyLimit || source.monthlyLimit <= 0) return;
      const spent = spentBySourceThisMonth.get(source.id) || 0;
      const ratio = spent / source.monthlyLimit;
      LIMIT_ALERT_THRESHOLDS.forEach(threshold => {
        if (ratio >= threshold) {
          result.push({
            id:         `source-limit-${source.id}-${threshold}`,
            sourceId:   source.id,
            sourceName: source.name,
            threshold,
            spent,
            limit:      source.monthlyLimit,
            ratio,
            level:      threshold >= 1.0 ? 'danger' : 'warning',
          });
        }
      });
    });
    return result;
  }, [paymentSources, spentBySourceThisMonth]);

  const totalOwnSourcesThisMonth = useMemo(() => {
    const ownSourceIds = new Set(
      paymentSources.filter(s => s.includeInProjection).map(s => s.id)
    );
    return currentMonthTransactions
      .filter(t => !t.sourceId || ownSourceIds.has(t.sourceId))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [currentMonthTransactions, paymentSources]);

  // ─── Reset ────────────────────────────────────────────────────────────────

  const resetAll = useCallback(async () => {
    await storageService.clearAll(uid);
    isInitialLoadRef.current = true; // ← antes do setIsLoaded
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
      startDate:         financialData.startDate || new Date().toISOString().slice(0, 7),
      durationMonths:    financialData.durationMonths || 12,
      initialPatrimony:  financialData.initialPatrimony || 0,
      monthlyIncome:     financialData.monthlyIncome,
      fixedCosts:        financialData.fixedCosts || [],
      variableExpenses:  financialData.variableExpenses || [],
      allocation:        financialData.allocation || { cdi: 25, selic: 25, cdb: 25, fii: 25 },
      rates:             settings.rates || DEFAULT_RATES,
      reinvestFii:       financialData.reinvestFii ?? true,
      surplusAllocation: financialData.surplusAllocation,
      inflation:         settings.inflation || 0,
      taxes:             settings.taxes || { enabled: true, fiiExempt: true },
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
        currentPatrimony:       financialData.initialPatrimony || 0,
        projectedPatrimony:     financialData.initialPatrimony || 0,
        projectedPatrimonyReal: financialData.initialPatrimony || 0,
        totalGrowth:            0,
        totalGrowthPercentage:  0,
        totalContributions:     0,
        totalReturns:           0,
        monthlySurplus:         calculatedSurplus,
        savingsRate:            calculatedSavingsRate,
        inflationImpact:        0,
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

  // ─── Alerts ───────────────────────────────────────────────────────────────

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
    user,
    settings,
    updateSettings,
    updateRates,
    currency: settings.currency,
    setCurrency: (currency) => updateSettings({ currency }),
    theme,
    toggleTheme,
    isDark,
    mounted: isLoaded,        
    themeMounted,

    financialData,
    updateFinancialData,
    addFixedCost,
    updateFixedCost,
    removeFixedCost,
    addVariableExpense,
    updateVariableExpense,
    removeVariableExpense,
    updateAllocation,
    scenarios,
    saveScenario,
    loadScenario,
    deleteScenario,
    lifeObjectives,
    addLifeObjective,
    updateLifeObjective,
    removeLifeObjective,
    alerts,
    dismissedAlerts,
    dismissAlert,
    clearDismissedAlerts,
    transactions,
    addTransaction,
    removeTransaction,
    currentMonthTransactions,
    totalTransactionsThisMonth,
    paymentSources,
    addPaymentSource,
    updatePaymentSource,
    removePaymentSource,
    defaultPaymentSource,
    spentBySourceThisMonth,
    sourceLimitAlerts,
    totalOwnSourcesThisMonth,
    projection,
    summary,
    scoreBreakdown,
    suggestions,
    resetAll,
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