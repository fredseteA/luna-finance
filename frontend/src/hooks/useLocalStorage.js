import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for localStorage persistence
 * Handles serialization, error handling, and sync across tabs
 */
export const useLocalStorage = (key, initialValue) => {
  // Get initial value from localStorage or use provided default
  const getStoredValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState(getStoredValue);

  // Update localStorage when value changes
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function (like useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch custom event for cross-tab sync
        window.dispatchEvent(new CustomEvent('localStorage-change', {
          detail: { key, value: valueToStore }
        }));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage change for "${key}":`, error);
        }
      }
    };

    const handleCustomChange = (event) => {
      if (event.detail.key === key) {
        setStoredValue(event.detail.value);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorage-change', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorage-change', handleCustomChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for managing multiple related localStorage items
 */
export const useFinancialStorage = () => {
  const [settings, setSettings, resetSettings] = useLocalStorage('financial-settings', {
    currency: 'BRL',
    theme: 'dark',
    rates: {
      cdi: 13.75,
      cdiPercentage: 100,
      selic: 13.75,
      cdb: 12.5,
      fii: 0.8,
    },
  });

  const [financialData, setFinancialData, resetFinancialData] = useLocalStorage('financial-data', {
    monthlyIncome: 0,
    initialPatrimony: 0,
    fixedCosts: [],
    variableExpenses: [],
    allocation: {
      cdi: 40,
      selic: 20,
      cdb: 20,
      fii: 20,
    },
    startDate: new Date().toISOString().slice(0, 7),
    durationMonths: 12,
    reinvestFii: true,
  });

  const [scenarios, setScenarios, resetScenarios] = useLocalStorage('financial-scenarios', []);

  const resetAll = useCallback(() => {
    resetSettings();
    resetFinancialData();
    resetScenarios();
  }, [resetSettings, resetFinancialData, resetScenarios]);

  return {
    settings,
    setSettings,
    financialData,
    setFinancialData,
    scenarios,
    setScenarios,
    resetAll,
  };
};

export default useLocalStorage;
