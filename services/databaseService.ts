
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
  ocppConfig: { 
    domain: 'voltflow.io', 
    port: 3085, 
    path: '/ocpp', 
    identity: 'VF-CORE-01',
    referenceUrl: 'https://docs.voltflow.io/ocpp-specs',
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
      // Sync to localstorage as a secondary failover cache for the current device
      localStorage.setItem('voltflow_cache', JSON.stringify(data));

      // Attempt to save to server (which persists to PostgreSQL)
      const response = await fetch('/api/db/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Postgres save failed, data is only in local cache:', error);
      return false;
    }
  },

  async load(): Promise<AppDatabase> {
    try {
      // First try to load from the server's PostgreSQL connection
      const response = await fetch('/api/db/load');
      if (response.ok) {
        const remoteData = await response.json();
        // If server has data, it is the absolute source of truth
        if (remoteData) return { ...DEFAULT_DB, ...remoteData };
      }

      // Fallback to local device cache only if server is unavailable or empty
      const cached = localStorage.getItem('voltflow_cache');
      if (cached) return { ...DEFAULT_DB, ...JSON.parse(cached) };

      return DEFAULT_DB;
    } catch (error) {
      console.error('Failed to load data from server:', error);
      // Last resort fallback
      const cached = localStorage.getItem('voltflow_cache');
      return cached ? JSON.parse(cached) : DEFAULT_DB;
    }
  },

  async testPostgres(config: PostgresConfig) {
    // This endpoint now also PERSISTS the config on the server if successful
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
    link.download = `voltflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
};
