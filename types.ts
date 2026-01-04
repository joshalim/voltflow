
export type PaymentMethod = 'NEQUI' | 'DAVIPLATA' | 'EFECTIVO' | 'N/A';
export type TransactionStatus = 'PAID' | 'UNPAID';
export type EntityStatus = 'ACTIVE' | 'INACTIVE';
export type UserType = 'PERSONAL' | 'BUSINESS';
export type ChargerStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
export type ConnectorStatus = 'AVAILABLE' | 'CHARGING' | 'OCCUPIED' | 'FAULTED' | 'UNAVAILABLE';

export interface Connector {
  id: string;
  type: string; // CCS2, CHADEMO, Type 2, J1772, etc.
  powerKW: number;
  status: ConnectorStatus;
}

export interface EVCharger {
  id: string;
  name: string;
  location: string;
  status: ChargerStatus;
  connectors: Connector[];
  createdAt: string;
}

export interface User {
  id: string;
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  cedula?: string;
  nit?: string;
  company?: string;
  rfidTag: string;
  placa: string;
  status: EntityStatus;
  createdAt: string;
}

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

export interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string;
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

export interface ApiConfig {
  invoiceApiUrl: string;
  invoiceApiKey: string;
  isEnabled: boolean;
}

export interface OcppConfig {
  centralSystemUrl: string;
  chargePointId: string;
  isListening: boolean;
  heartbeatInterval: number;
}

export interface OcppLog {
  id: string;
  timestamp: string;
  direction: 'IN' | 'OUT';
  messageType: string;
  payload: any;
}

export type Language = 'en' | 'es';

export interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}
