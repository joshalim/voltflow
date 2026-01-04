
import { EVTransaction, PricingRule, AccountGroup, Expense, ApiConfig, OcppConfig, User, EVCharger, InfluxConfig } from '../types';

const STORAGE_KEY = 'voltflow_db_v6';

export interface AppDatabase {
  transactions: EVTransaction[];
  pricingRules: PricingRule[];
  accountGroups: AccountGroup[];
  expenses: Expense[];
  apiConfig: ApiConfig;
  ocppConfig: OcppConfig;
  influxConfig: InfluxConfig;
  users: User[];
  chargers: EVCharger[];
  lastUpdated: string;
}

const DEFAULT_DB: AppDatabase = {
  transactions: [],
  pricingRules: [],
  accountGroups: [],
  expenses: [],
  apiConfig: { invoiceApiUrl: '', invoiceApiKey: '', isEnabled: false },
  ocppConfig: { centralSystemUrl: 'ws://voltflow.local/ocpp', chargePointId: 'CP001', isListening: false, heartbeatInterval: 60 },
  influxConfig: { url: '', token: '', org: '', bucket: '', isEnabled: false },
  users: [],
  chargers: [],
  lastUpdated: new Date().toISOString()
};

export const databaseService = {
  save(data: Partial<AppDatabase>) {
    try {
      const current = this.load();
      const updated = { ...current, ...data, lastUpdated: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to save to database:', error);
      return false;
    }
  },

  load(): AppDatabase {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_DB;
      return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load from database:', error);
      return DEFAULT_DB;
    }
  },

  exportBackup() {
    const data = this.load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voltflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  async importBackup(file: File): Promise<AppDatabase | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (parsed.transactions && Array.isArray(parsed.transactions)) {
            this.save(parsed);
            resolve(parsed);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Invalid backup file:', error);
          resolve(null);
        }
      };
      reader.readAsText(file);
    });
  }
};
