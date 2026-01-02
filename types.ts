
export type PaymentMethod = 'NEQUI' | 'DAVIPLATA' | 'EFECTIVO' | 'N/A';
export type TransactionStatus = 'PAID' | 'UNPAID';

export interface EVTransaction {
  id: string; // TxID
  station: string; // Station
  connector: string; // Connector
  account: string; // Account
  startTime: string; // Start Time
  endTime: string; // End Time
  meterKWh: number; // Meter value(kW.h)
  costCOP: number; // Calculated Cost ($COP)
  durationMinutes: number; // Calculated Duration
  appliedRate: number; // Applied Rate ($COP / kWh)
  status: TransactionStatus;
  paymentType: PaymentMethod;
  paymentDate?: string;
}

export interface AccountGroup {
  id: string;
  name: string;
  members: string[]; // List of account names
}

export interface PricingRule {
  id: string;
  targetId: string; // Account name or Group ID
  targetType: 'ACCOUNT' | 'GROUP' | 'DEFAULT';
  connector: string;
  ratePerKWh: number;
}

export type Language = 'en' | 'es';

export interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}
