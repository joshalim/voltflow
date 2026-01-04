
import { EVTransaction, PricingRule, AccountGroup, Expense, ApiConfig, OcppConfig, User, EVCharger, InfluxConfig, AuthConfig, OcpiConfig } from '../types';

const STORAGE_KEY = 'voltflow_db_v9';

export interface AppDatabase {
  transactions: EVTransaction[];
  pricingRules: PricingRule[];
  accountGroups: AccountGroup[];
  expenses: Expense[];
  apiConfig: ApiConfig;
  ocppConfig: OcppConfig;
  influxConfig: InfluxConfig;
  ocpiConfig: OcpiConfig;
  authConfig: AuthConfig;
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
  influxConfig: { 
    url: 'influx-proxy', // Relative path to use the server.js proxy
    token: 'B2V-5IfB5bGNr8dP9Z6_7NI3gCdZqmTjV_dDS2m2eJRc-W61fkFVDO1djiRdWkEVYwtVpSe2EJRV8PBCC6LuxA==', 
    org: 'iluminacion', 
    bucket: 'SMARTCHARGE', 
    measurementPrefix: 'vlt_', 
    precision: 's', 
    isEnabled: true 
  },
  ocpiConfig: { baseUrl: '', token: '', partyId: 'VLT', countryCode: 'CO', isEnabled: false },
  authConfig: {
    adminUser: 'smartcharge',
    adminPass: 'qazwsx!',
    viewOnlyAccounts: [
      { id: 'default-user', user: 'user', pass: 'user123' }
    ]
  },
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
      if (!saved) {
        // Migration check for older versions
        const oldV8 = localStorage.getItem('voltflow_db_v8');
        if (oldV8) {
          const parsed = JSON.parse(oldV8);
          return { ...DEFAULT_DB, ...parsed, ocpiConfig: DEFAULT_DB.ocpiConfig };
        }
        return DEFAULT_DB;
      }
      const parsed = JSON.parse(saved);
      
      // Migration check
      if (!parsed.ocpiConfig) {
        parsed.ocpiConfig = DEFAULT_DB.ocpiConfig;
      }
      if (parsed.influxConfig && !parsed.influxConfig.measurementPrefix) {
        parsed.influxConfig.measurementPrefix = DEFAULT_DB.influxConfig.measurementPrefix;
        parsed.influxConfig.precision = DEFAULT_DB.influxConfig.precision;
      }
      
      return parsed;
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
