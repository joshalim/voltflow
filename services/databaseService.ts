
import { EVTransaction, PricingRule, AccountGroup, Expense, ApiConfig, OcppConfig, User, EVCharger, AuthConfig, OcpiConfig, PostgresConfig } from '../types';

export interface AppDatabase {
  transactions: EVTransaction[];
  pricingRules: PricingRule[];
  accountGroups: AccountGroup[];
  expenses: Expense[];
  apiConfig: ApiConfig;
  ocppConfig: OcppConfig;
  postgresConfig: PostgresConfig;
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
  // Fixed: Updated OcppConfig to match the interface definition in types.ts (removed chargePointId, added missing fields)
  ocppConfig: { 
    centralSystemUrl: 'ws://voltflow.io/ocpp', 
    port: 3085, 
    path: '/ocpp', 
    isListening: false, 
    heartbeatInterval: 60,
    securityProfile: 'PLAIN'
  },
  postgresConfig: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    pass: 'password',
    database: 'voltflow',
    ssl: false,
    isEnabled: false
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
  async save(data: Partial<AppDatabase>) {
    try {
      // We still sync to localstorage as a robust cache
      localStorage.setItem('voltflow_cache', JSON.stringify(data));

      if (data.postgresConfig?.isEnabled) {
        const response = await fetch('/api/db/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return response.ok;
      }
      return true;
    } catch (error) {
      console.error('Failed to save to Postgres:', error);
      return false;
    }
  },

  async load(): Promise<AppDatabase> {
    try {
      // First try to load from backend
      const response = await fetch('/api/db/load');
      if (response.ok) {
        const remoteData = await response.json();
        if (remoteData) return { ...DEFAULT_DB, ...remoteData };
      }

      // Fallback to cache
      const cached = localStorage.getItem('voltflow_cache');
      if (cached) return { ...DEFAULT_DB, ...JSON.parse(cached) };

      return DEFAULT_DB;
    } catch (error) {
      console.error('Failed to load data:', error);
      return DEFAULT_DB;
    }
  },

  async testPostgres(config: PostgresConfig) {
    const response = await fetch('/api/db/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await response.json();
  },

  exportBackup(data: AppDatabase) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voltflow_postgres_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
};
