
export type PaymentMethod = 'NEQUI' | 'DAVIPLATA' | 'EFECTIVO' | 'N/A';
export type TransactionStatus = 'PAID' | 'UNPAID';
export type EntityStatus = 'ACTIVE' | 'INACTIVE';
export type UserType = 'PERSONAL' | 'BUSINESS';
export type ChargerStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
export type ConnectorStatus = 'AVAILABLE' | 'CHARGING' | 'OCCUPIED' | 'FAULTED' | 'UNAVAILABLE' | 'FINISHING';
export type UserRole = 'ADMIN' | 'USER' | null;

export interface ViewOnlyAccount {
  id: string;
  user: string;
  pass: string;
}

export interface AuthConfig {
  adminUser: string;
  adminPass: string;
  viewOnlyAccounts: ViewOnlyAccount[];
}

export interface InfluxConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
  isEnabled: boolean;
}

export interface Connector {
  id: string;
  type: string;
  powerKW: number;
  status: ConnectorStatus;
  currentKWh?: number;
  currentPowerKW?: number;
  voltage?: number;
  temperature?: number;
}

export interface EVCharger {
  id: string;
  name: string;
  location: string;
  status: ChargerStatus;
  connectors: Connector[];
  createdAt: string;
  lastHeartbeat?: string;
  model?: string;
  firmwareVersion?: string;
  vendor?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  cedula?: string;
  nit?: string;
  company?: string;
  rfidTag: string;
  placa?: string;
  status: EntityStatus;
  createdAt: string;
}

export interface EVTransaction {
  id: string;
  station: string;
  connector: string;
  account: string;
  startTime: string;
  endTime: string;
  meterKWh: number;
  costCOP: number;
  durationMinutes: number;
  appliedRate: number;
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
  members: string[];
}

export interface PricingRule {
  id: string;
  targetId: string;
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
