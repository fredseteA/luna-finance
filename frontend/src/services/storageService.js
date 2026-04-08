import {
  doc, getDoc, setDoc, collection,
  getDocs, deleteDoc, query, where, writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Pega o uid do usuário atual (passado como parâmetro)
const userDoc = (uid, docName) => doc(db, 'users', uid, 'data', docName);

// ─── Defaults ────────────────────────────────────────────────
export const storageService = {
  getDefaultSettings: () => ({
    currency: 'BRL',
    theme: 'dark',
    rates: { cdi: 13.75, cdiPercentage: 100, selic: 13.75, cdb: 12.5, fii: 0.8 },
    inflation: 4.5,
    taxes: { enabled: true, fiiExempt: true },
  }),

  getDefaultFinancialData: () => ({
    monthlyIncome: 0,
    initialPatrimony: 0,
    fixedCosts: [],
    variableExpenses: [],
    allocation: { cdi: 40, selic: 20, cdb: 20, fii: 20 },
    startDate: new Date().toISOString().slice(0, 7),
    durationMonths: 12,
    reinvestFii: true,
    surplusAllocation: { investments: 100, emergencyFund: 0, savingsGoals: 0, keepCash: 0 },
  }),

  // ─── Leitura ─────────────────────────────────────────────
  getSettings: async (uid) => {
    if (!uid) return null;
    const snap = await getDoc(userDoc(uid, 'settings'));
    return snap.exists() ? snap.data() : null;
  },

  getFinancialData: async (uid) => {
    if (!uid) return null;
    const snap = await getDoc(userDoc(uid, 'financialData'));
    return snap.exists() ? snap.data() : null;
  },

  getScenarios: async (uid) => {
    if (!uid) return [];
    const snap = await getDoc(userDoc(uid, 'scenarios'));
    return snap.exists() ? (snap.data().list || []) : [];
  },

  getLifeObjectives: async (uid) => {
    if (!uid) return [];
    const snap = await getDoc(userDoc(uid, 'lifeObjectives'));
    return snap.exists() ? (snap.data().list || []) : [];
  },

  getDismissedAlerts: async (uid) => {
    if (!uid) return [];
    const snap = await getDoc(userDoc(uid, 'dismissedAlerts'));
    return snap.exists() ? (snap.data().list || []) : [];
  },

  // ─── Escrita ──────────────────────────────────────────────
  saveSettings: async (uid, data) => {
    if (!uid) return;
    await setDoc(userDoc(uid, 'settings'), data);
  },

  saveFinancialData: async (uid, data) => {
    if (!uid) return;
    await setDoc(userDoc(uid, 'financialData'), data);
  },

  saveScenarios: async (uid, list) => {
    if (!uid) return;
    await setDoc(userDoc(uid, 'scenarios'), { list });
  },

  saveLifeObjectives: async (uid, list) => {
    if (!uid) return;
    await setDoc(userDoc(uid, 'lifeObjectives'), { list });
  },

  saveDismissedAlerts: async (uid, list) => {
    if (!uid) return;
    await setDoc(userDoc(uid, 'dismissedAlerts'), { list });
  },

  // ─── Reset ────────────────────────────────────────────────
  clearAll: async (uid) => {
    if (!uid) return;
    const docs = ['settings', 'financialData', 'scenarios', 'lifeObjectives', 'dismissedAlerts'];
    const batch = writeBatch(db);
    docs.forEach(name => batch.delete(userDoc(uid, name)));
    await batch.commit();
  },
};