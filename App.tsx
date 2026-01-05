
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Table as TableIcon, Zap, BrainCircuit, PlusCircle, Globe, Settings, BarChart3, Filter, Calendar, MapPin, User as UserIcon, X, ReceiptText, Layers, Save, CheckCircle2, Activity, Users, Settings2, Server, ShieldCheck, LogOut, Database } from 'lucide-react';
import { TRANSLATIONS } from './constants';
import { EVTransaction, Language, PricingRule, AccountGroup, Expense, ApiConfig, OcppConfig, User, EVCharger, AuthConfig, UserRole, OcpiConfig, PostgresConfig } from './types';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import ImportModal from './components/ImportModal';
import AIInsights from './components/AIInsights';
import PricingSettings from './components/PricingSettings';
import AccountReports from './components/AccountReports';
import Expenses from './components/Expenses';
import OcppMonitor from './components/OcppMonitor';
import UserManagement from './components/UserManagement';
import ChargerManagement from './components/ChargerManagement';
import Login from './components/Login';
import SecuritySettings from './components/SecuritySettings';
import { databaseService } from './services/databaseService';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [transactions, setTransactions] = useState<EVTransaction[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({ invoiceApiKey: '', invoiceApiUrl: '', isEnabled: false });
  const [ocppConfig, setOcppConfig] = useState<OcppConfig>({ centralSystemUrl: '', chargePointId: '', heartbeatInterval: 60, isListening: false });
  const [postgresConfig, setPostgresConfig] = useState<PostgresConfig>({ host: 'localhost', port: 5432, user: '', pass: '', database: '', ssl: false, isEnabled: false });
  const [ocpiConfig, setOcpiConfig] = useState<OcpiConfig>({ baseUrl: '', countryCode: '', isEnabled: false, partyId: '', token: '' });
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ adminPass: '', adminUser: '', viewOnlyAccounts: [] });
  const [users, setUsers] = useState<User[]>([]);
  const [chargers, setChargers] = useState<EVCharger[]>([]);
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai' | 'pricing' | 'reports' | 'expenses' | 'ocpp' | 'users' | 'chargers' | 'security'>('dashboard');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [isPgConnected, setIsPgConnected] = useState<boolean | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStation, setSelectedStation] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  // Initialize App Data
  useEffect(() => {
    const init = async () => {
      const data = await databaseService.load();
      setTransactions(data.transactions);
      setPricingRules(data.pricingRules);
      setAccountGroups(data.accountGroups);
      setExpenses(data.expenses);
      setApiConfig(data.apiConfig);
      setOcppConfig(data.ocppConfig);
      setPostgresConfig(data.postgresConfig);
      setOcpiConfig(data.ocpiConfig);
      setAuthConfig(data.authConfig);
      setUsers(data.users);
      setChargers(data.chargers);
      setIsInitialized(true);
    };
    init();
  }, []);

  // Periodic Save
  useEffect(() => {
    if (!isInitialized) return;
    const save = async () => {
      setIsSaving(true);
      await databaseService.save({
        transactions, pricingRules, accountGroups, expenses, 
        apiConfig, ocppConfig, postgresConfig, 
        ocpiConfig, authConfig, users, chargers
      });
      setTimeout(() => setIsSaving(false), 500);
    };
    const timer = setTimeout(save, 2000);
    return () => clearTimeout(timer);
  }, [transactions, pricingRules, accountGroups, expenses, apiConfig, ocppConfig, postgresConfig, ocpiConfig, authConfig, users, chargers, isInitialized]);

  // Health Checks
  useEffect(() => {
    const checkHealthes = async () => {
      if (postgresConfig.isEnabled) {
        const h = await databaseService.testPostgres(postgresConfig);
        setIsPgConnected(h.success);
      } else {
        setIsPgConnected(null);
      }
    };
    checkHealthes();
    const interval = setInterval(checkHealthes, 30000);
    return () => clearInterval(interval);
  }, [postgresConfig]);

  const uniqueStations = useMemo(() => Array.from(new Set(transactions.map(tx => tx.station))), [transactions]);
  const uniqueAccounts = useMemo(() => Array.from(new Set(transactions.map(tx => tx.account))).sort(), [transactions]);
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    transactions.forEach(tx => years.add(new Date(tx.startTime).getFullYear().toString()));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const date = new Date(tx.startTime);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      return (!start || date >= start) && (!end || date <= end) && 
             (selectedStation === 'all' || tx.station === selectedStation) &&
             (accountFilter === 'all' || tx.account === accountFilter) &&
             (selectedYear === 'all' || date.getFullYear().toString() === selectedYear);
    });
  }, [transactions, startDate, endDate, selectedStation, accountFilter, selectedYear]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Connecting to Infrastructure...</p>
        </div>
      </div>
    );
  }

  if (!currentUserRole) {
    return <Login authConfig={authConfig} lang={lang} onLangChange={setLang} onLogin={setCurrentUserRole} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="no-print hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 fixed h-full z-30 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-orange-500 p-2 rounded-lg shadow-lg">
            <Zap className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter">
            <span className="text-orange-600">SMART</span>
            <span className="text-slate-800 ml-1">Charge</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label={t('dashboard')} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<TableIcon size={18} />} label={t('transactions')} active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
          <NavItem icon={<Server size={18} />} label={t('liveMonitor')} active={activeTab === 'ocpp'} onClick={() => setActiveTab('ocpp')} />
          {currentUserRole === 'ADMIN' && (
            <>
              <NavItem icon={<Settings2 size={18} />} label={t('chargerManagement')} active={activeTab === 'chargers'} onClick={() => setActiveTab('chargers')} />
              <NavItem icon={<Users size={18} />} label={t('userManagement')} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            </>
          )}
          <NavItem icon={<BarChart3 size={18} />} label={t('reports')} active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <NavItem icon={<ReceiptText size={18} />} label={t('expenses')} active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
          <NavItem icon={<BrainCircuit size={18} />} label={t('aiInsights')} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          {currentUserRole === 'ADMIN' && (
            <NavItem icon={<Settings size={18} />} label={t('pricingRules')} active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')} />
          )}
          <NavItem icon={<ShieldCheck size={18} />} label={t('security')} active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
        </nav>

        <div className="mt-auto pt-6 border-t space-y-4">
          <div className="space-y-2 px-2">
             <StatusIndicator active={isSaving} label="Sync" icon={<Save size={10} />} color={isSaving ? 'orange' : 'emerald'} />
             <StatusIndicator active={isPgConnected === true} label="SQL" icon={<Database size={10} />} color={isPgConnected ? 'blue' : 'rose'} />
          </div>
          <button onClick={() => setCurrentUserRole(null)} className="w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-bold hover:bg-rose-100 transition flex items-center justify-center gap-2">
            <LogOut size={18} /> {t('logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} expenses={expenses} chargers={chargers} lang={lang} />}
          {activeTab === 'transactions' && <TransactionTable transactions={filteredTransactions} lang={lang} role={currentUserRole} onClear={() => setTransactions([])} onUpdate={(id, up) => setTransactions(transactions.map(t => t.id === id ? {...t, ...up} : t))} onDelete={(id) => setTransactions(transactions.filter(t => t.id !== id))} onBulkUpdate={(ids, up) => setTransactions(transactions.map(t => ids.includes(t.id) ? {...t, ...up} : t))} onBulkDelete={(ids) => setTransactions(transactions.filter(t => !ids.includes(t.id)))} />}
          {activeTab === 'reports' && <AccountReports transactions={filteredTransactions} lang={lang} />}
          {activeTab === 'expenses' && <Expenses expenses={expenses} role={currentUserRole} onAdd={(e) => setExpenses([...expenses, {...e, id: Date.now().toString()}])} onUpdate={(id, up) => setExpenses(expenses.map(e => e.id === id ? {...e, ...up} : e))} onDelete={(id) => setExpenses(expenses.filter(e => e.id !== id))} lang={lang} />}
          {activeTab === 'ai' && <AIInsights transactions={filteredTransactions} lang={lang} role={currentUserRole} />}
          {activeTab === 'ocpp' && <OcppMonitor ocppConfig={ocppConfig} lang={lang} role={currentUserRole} onNewTransaction={(t) => setTransactions([t, ...transactions])} pricingRules={pricingRules} accountGroups={accountGroups} chargers={chargers} onUpdateCharger={(id, up) => setChargers(chargers.map(c => c.id === id ? {...c, ...up} : c))} />}
          {activeTab === 'chargers' && <ChargerManagement chargers={chargers} onAddCharger={(c) => setChargers([...chargers, {...c, id: Date.now().toString(), createdAt: new Date().toISOString()}])} onUpdateCharger={(id, up) => setChargers(chargers.map(c => c.id === id ? {...c, ...up} : c))} onDeleteCharger={(id) => setChargers(chargers.filter(c => c.id !== id))} lang={lang} />}
          {activeTab === 'users' && <UserManagement users={users} onAddUser={(u) => setUsers([...users, {...u, id: Date.now().toString(), createdAt: new Date().toISOString()}])} onImportUsers={(nu) => setUsers([...users, ...nu.map(u => ({...u, id: Math.random().toString(), createdAt: new Date().toISOString()}))])} onUpdateUser={(id, up) => setUsers(users.map(u => u.id === id ? {...u, ...up} : u))} onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))} lang={lang} />}
          {activeTab === 'pricing' && <PricingSettings rules={pricingRules} groups={accountGroups} apiConfig={apiConfig} ocppConfig={ocppConfig} ocpiConfig={ocpiConfig} onAddRule={(r) => setPricingRules([...pricingRules, {...r, id: Date.now().toString()}])} onUpdateRule={(id, up) => setPricingRules(pricingRules.map(r => r.id === id ? {...r, ...up} : r))} onDeleteRule={(id) => setPricingRules(pricingRules.filter(r => r.id !== id))} onAddGroup={(g) => setAccountGroups([...accountGroups, {...g, id: Date.now().toString()}])} onDeleteGroup={(id) => setAccountGroups(accountGroups.filter(g => g.id !== id))} onUpdateGroup={(id, up) => setAccountGroups(accountGroups.map(g => g.id === id ? {...g, ...up} : g))} onUpdateApiConfig={(up) => setApiConfig(prev => ({ ...prev, ...up }))} onUpdateOcppConfig={(up) => setOcppConfig(prev => ({ ...prev, ...up }))} onUpdateOcpiConfig={(up) => setOcpiConfig(prev => ({ ...prev, ...up }))} onExportBackup={() => databaseService.exportBackup({ transactions, pricingRules, accountGroups, expenses, apiConfig, ocppConfig, postgresConfig, ocpiConfig, authConfig, users, chargers, lastUpdated: new Date().toISOString() })} onImportBackup={(f) => {}} lang={lang} />}
          {activeTab === 'security' && <SecuritySettings authConfig={authConfig} postgresConfig={postgresConfig} onUpdateAuthConfig={(up) => setAuthConfig(prev => ({ ...prev, ...up }))} onUpdatePostgresConfig={(up) => setPostgresConfig(prev => ({ ...prev, ...up }))} lang={lang} role={currentUserRole} />}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${active ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
    <span className={active ? 'text-orange-500' : 'text-slate-400'}>{icon}</span>
    <span className="text-sm">{label}</span>
  </button>
);

const StatusIndicator = ({ active, label, icon, color }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
       <div className={`w-1.5 h-1.5 rounded-full ${active ? `bg-${color}-500 animate-pulse` : 'bg-slate-300'}`} />
       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-${active ? color : 'slate'}-400`}>{icon}</span>
  </div>
);

export default App;
