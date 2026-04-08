import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
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

export const FinancialProvider = ({ children }) => {
  const { theme, toggleTheme, isDark, mounted: themeMounted } = useTheme();
  
  // State
  const [settings, setSettings] = useState(storageService.getDefaultSettings());
  const [financialData, setFinancialData] = useState(storageService.getDefaultFinancialData());
  const [scenarios, setScenarios] = useState([]);
  const [lifeObjectives, setLifeObjectives] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      const [storedSettings, storedFinancialData, storedScenarios, storedObjectives, storedDismissed] = await Promise.all([
        storageService.getSettings(),
        storageService.getFinancialData(),
        storageService.getScenarios(),
        storageService.getLifeObjectives(),
        storageService.getDismissedAlerts(),
      ]);

      if (storedSettings) setSettings(storedSettings);
      if (storedFinancialData) setFinancialData(storedFinancialData);
      if (storedScenarios) setScenarios(storedScenarios);
      if (storedObjectives) setLifeObjectives(storedObjectives);
      if (storedDismissed) setDismissedAlerts(storedDismissed);
      
      setIsLoaded(true);
    };

    loadData();
  }, []);

  // Persist settings
  useEffect(() => {
    if (isLoaded) {
      storageService.saveSettings(settings);
    }
  }, [settings, isLoaded]);

  // Persist financial data
  useEffect(() => {
    if (isLoaded) {
      storageService.saveFinancialData(financialData);
    }
  }, [financialData, isLoaded]);

  // Persist scenarios
  useEffect(() => {
    if (isLoaded) {
      storageService.saveScenarios(scenarios);
    }
  }, [scenarios, isLoaded]);

  // Persist life objectives
  useEffect(() => {
    if (isLoaded) {
      storageService.saveLifeObjectives(lifeObjectives);
    }
  }, [lifeObjectives, isLoaded]);

  // Persist dismissed alerts
  useEffect(() => {
    if (isLoaded) {
      storageService.saveDismissedAlerts(dismissedAlerts);
    }
  }, [dismissedAlerts, isLoaded]);

  // Settings management
  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const updateRates = useCallback((rateUpdates) => {
    setSettings(prev => ({
      ...prev,
      rates: { ...prev.rates, ...rateUpdates },
    }));
  }, []);

  // Financial data management
  const updateFinancialData = useCallback((updates) => {
    setFinancialData(prev => ({ ...prev, ...updates }));
  }, []);

  // Fixed costs
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

  // Variable expenses
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

  // Allocation
  const updateAllocation = useCallback((allocationUpdates) => {
    setFinancialData(prev => ({
      ...prev,
      allocation: { ...prev.allocation, ...allocationUpdates },
    }));
  }, []);

  // Scenarios
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

  // Life objectives
  const addLifeObjective = useCallback((objective) => {
    setLifeObjectives(prev => [...prev, { ...objective, id: generateId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateLifeObjective = useCallback((id, updates) => {
    setLifeObjectives(prev => prev.map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  const removeLifeObjective = useCallback((id) => {
    setLifeObjectives(prev => prev.filter(obj => obj.id !== id));
  }, []);

  // Alerts
  const dismissAlert = useCallback((alertId) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  }, []);

  const clearDismissedAlerts = useCallback(() => {
    setDismissedAlerts([]);
  }, []);

  // Reset all
  const resetAll = useCallback(async () => {
    await storageService.clearAll();
    setSettings(storageService.getDefaultSettings());
    setFinancialData(storageService.getDefaultFinancialData());
    setScenarios([]);
    setLifeObjectives([]);
    setDismissedAlerts([]);
  }, []);

  // Calculate projection
  const projection = useMemo(() => {
    if (!financialData.monthlyIncome || financialData.durationMonths <= 0) {
      return [];
    }

    return projectPatrimonyEvolution({
      startDate: financialData.startDate || new Date().toISOString().slice(0, 7),
      durationMonths: financialData.durationMonths || 12,
      initialPatrimony: financialData.initialPatrimony || 0,
      monthlyIncome: financialData.monthlyIncome,
      fixedCosts: financialData.fixedCosts || [],
      variableExpenses: financialData.variableExpenses || [],
      allocation: financialData.allocation || { cdi: 25, selic: 25, cdb: 25, fii: 25 },
      rates: settings.rates || DEFAULT_RATES,
      reinvestFii: financialData.reinvestFii ?? true,
      surplusAllocation: financialData.surplusAllocation,
      inflation: settings.inflation || 0,
      taxes: settings.taxes || { enabled: true, fiiExempt: true },
    });
  }, [financialData, settings.rates, settings.inflation, settings.taxes]);

  // Summary calculations
  const summary = useMemo(() => {
    // Calcular a sobra mensal independente da projeção
    const totalFixedCosts = (financialData.fixedCosts || []).reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalVariableExpenses = (financialData.variableExpenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const calculatedSurplus = (financialData.monthlyIncome || 0) - totalFixedCosts - totalVariableExpenses;
    const calculatedSavingsRate = financialData.monthlyIncome > 0 
      ? (calculatedSurplus / financialData.monthlyIncome) * 100 
      : 0;

    if (projection.length === 0) {
      return {
        currentPatrimony: financialData.initialPatrimony || 0,
        projectedPatrimony: financialData.initialPatrimony || 0,
        projectedPatrimonyReal: financialData.initialPatrimony || 0,
        totalGrowth: 0,
        totalGrowthPercentage: 0,
        totalContributions: 0,
        totalReturns: 0,
        monthlySurplus: calculatedSurplus,
        savingsRate: calculatedSavingsRate,
        inflationImpact: 0,
      };
    }

    const lastMonth = projection[projection.length - 1];
    const firstMonth = projection[0];
    const initial = financialData.initialPatrimony || 0;
    const totalContributions = projection.reduce((sum, m) => sum + Math.max(0, m.surplusForInvestments || m.surplus), 0);
    const totalReturns = projection.reduce((sum, m) => sum + m.investmentReturns, 0);

    return {
      currentPatrimony: initial,
      projectedPatrimony: lastMonth.patrimony,
      projectedPatrimonyReal: lastMonth.patrimonyReal,
      totalGrowth: lastMonth.patrimony - initial,
      totalGrowthPercentage: initial > 0 ? ((lastMonth.patrimony - initial) / initial) * 100 : 0,
      totalContributions,
      totalReturns,
      monthlySurplus: firstMonth.surplus || calculatedSurplus,
      savingsRate: financialData.monthlyIncome > 0 
        ? ((firstMonth.surplus || calculatedSurplus) / financialData.monthlyIncome) * 100 
        : 0,
      inflationImpact: lastMonth.patrimony - lastMonth.patrimonyReal,
    };
  }, [projection, financialData]);

  // Score breakdown
  const scoreBreakdown = useMemo(() => {
    return calculateScoreBreakdown({
      ...financialData,
      rates: settings.rates,
    }, projection);
  }, [financialData, settings.rates, projection]);

  // Smart alerts
  const alerts = useMemo(() => {
    return generateAlerts({
      ...financialData,
      rates: settings.rates,
    }, projection, dismissedAlerts);
  }, [financialData, settings.rates, projection, dismissedAlerts]);

  // Smart suggestions
  const suggestions = useMemo(() => {
    return generateSuggestions({
      ...financialData,
      rates: settings.rates,
    }, projection, scoreBreakdown);
  }, [financialData, settings.rates, projection, scoreBreakdown]);

  const value = {
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
    
    // Fixed costs
    addFixedCost,
    updateFixedCost,
    removeFixedCost,
    
    // Variable expenses
    addVariableExpense,
    updateVariableExpense,
    removeVariableExpense,
    
    // Allocation
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
