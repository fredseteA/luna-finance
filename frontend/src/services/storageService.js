/**
 * Storage Service
 * Abstraction layer for data persistence
 * Currently uses localStorage, prepared for Firebase integration
 */

const STORAGE_KEYS = {
  SETTINGS: 'fp_settings',
  FINANCIAL_DATA: 'fp_financial_data',
  SCENARIOS: 'fp_scenarios',
  GOALS: 'fp_goals',
  LIFE_OBJECTIVES: 'fp_life_objectives',
  ALERTS_DISMISSED: 'fp_alerts_dismissed',
};

// Storage adapter interface for future Firebase migration
class LocalStorageAdapter {
  async get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage [${key}]:`, error);
      return null;
    }
  }

  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage [${key}]:`, error);
      return false;
    }
  }

  async remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage [${key}]:`, error);
      return false;
    }
  }

  async clear() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Listen for changes (for cross-tab sync)
  subscribe(key, callback) {
    const handler = (event) => {
      if (event.key === key && event.newValue) {
        try {
          callback(JSON.parse(event.newValue));
        } catch (e) {
          console.error('Error parsing storage event:', e);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

// Firebase adapter placeholder for future implementation
class FirebaseAdapter {
  constructor(/* firebaseConfig */) {
    // TODO: Initialize Firebase
    console.log('Firebase adapter not yet implemented');
  }

  async get(key) {
    // TODO: Implement Firebase get
    throw new Error('Firebase not implemented');
  }

  async set(key, value) {
    // TODO: Implement Firebase set
    throw new Error('Firebase not implemented');
  }

  async remove(key) {
    // TODO: Implement Firebase remove
    throw new Error('Firebase not implemented');
  }

  async clear() {
    // TODO: Implement Firebase clear
    throw new Error('Firebase not implemented');
  }

  subscribe(key, callback) {
    // TODO: Implement Firebase realtime listener
    throw new Error('Firebase not implemented');
  }
}

// Storage service factory
class StorageService {
  constructor() {
    // Default to localStorage, can be switched to Firebase
    this.adapter = new LocalStorageAdapter();
    this.keys = STORAGE_KEYS;
  }

  // Switch to Firebase adapter when ready
  useFirebase(config) {
    this.adapter = new FirebaseAdapter(config);
  }

  // Settings
  async getSettings() {
    return await this.adapter.get(this.keys.SETTINGS) || this.getDefaultSettings();
  }

  async saveSettings(settings) {
    return await this.adapter.set(this.keys.SETTINGS, settings);
  }

  getDefaultSettings() {
    return {
      currency: 'BRL',
      theme: 'dark',
      rates: {
        cdi: 13.75,
        cdiPercentage: 100,
        selic: 13.75,
        cdb: 12.5,
        fii: 0.8,
      },
      inflation: 4.5,
      taxes: {
        enabled: true,
        fiiExempt: true,
      },
    };
  }

  // Financial Data
  async getFinancialData() {
    return await this.adapter.get(this.keys.FINANCIAL_DATA) || this.getDefaultFinancialData();
  }

  async saveFinancialData(data) {
    return await this.adapter.set(this.keys.FINANCIAL_DATA, data);
  }

  getDefaultFinancialData() {
    const currentDate = new Date();
    return {
      monthlyIncome: 0,
      initialPatrimony: 0,
      fixedCosts: [],
      variableExpenses: [],
      allocation: { cdi: 40, selic: 20, cdb: 20, fii: 20 },
      startDate: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
      durationMonths: 12,
      reinvestFii: true,
      surplusAllocation: {
        investments: 100,
        emergencyFund: 0,
        savingsGoals: 0,
        keepCash: 0,
      },
    };
  }

  // Scenarios
  async getScenarios() {
    return await this.adapter.get(this.keys.SCENARIOS) || [];
  }

  async saveScenarios(scenarios) {
    return await this.adapter.set(this.keys.SCENARIOS, scenarios);
  }

  // Goals
  async getGoals() {
    return await this.adapter.get(this.keys.GOALS) || [];
  }

  async saveGoals(goals) {
    return await this.adapter.set(this.keys.GOALS, goals);
  }

  // Life Objectives
  async getLifeObjectives() {
    return await this.adapter.get(this.keys.LIFE_OBJECTIVES) || [];
  }

  async saveLifeObjectives(objectives) {
    return await this.adapter.set(this.keys.LIFE_OBJECTIVES, objectives);
  }

  // Dismissed Alerts
  async getDismissedAlerts() {
    return await this.adapter.get(this.keys.ALERTS_DISMISSED) || [];
  }

  async saveDismissedAlerts(alerts) {
    return await this.adapter.set(this.keys.ALERTS_DISMISSED, alerts);
  }

  // Clear all data
  async clearAll() {
    return await this.adapter.clear();
  }

  // Subscribe to changes
  subscribeToSettings(callback) {
    return this.adapter.subscribe(this.keys.SETTINGS, callback);
  }

  subscribeToFinancialData(callback) {
    return this.adapter.subscribe(this.keys.FINANCIAL_DATA, callback);
  }
}

// Export singleton instance
export const storageService = new StorageService();
export { STORAGE_KEYS };
export default storageService;
