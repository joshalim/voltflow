
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Table as TableIcon, Zap, BrainCircuit, PlusCircle, Globe, Settings, BarChart3, Filter, Calendar, MapPin, User as UserIcon, X, ReceiptText, Layers, Save, CheckCircle2, Activity, Users, Settings2, Server, ShieldCheck, LogOut, Database, Languages, Network, Smartphone, Upload } from 'lucide-react';
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
import MobileApp from './components/MobileApp';
import { databaseService } from './services/databaseService';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [transactions, setTransactions] = useState<EVTransaction[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({ invoiceApiKey: '', invoiceApiUrl: '', isEnabled: false });
  const [ocppConfig, setOcppConfig] = useState<OcppConfig>({ 
    domain: 'voltflow.io', 
    port: 3085, 
    path: '/ocpp', 
    identity: 'VF-CORE-01',
    referenceUrl: 'https://docs.voltflow.io/ocpp-specs',
    heartbeatInterval: 60, 
    isListening: false,
    securityProfile: 'PLAIN'
  });
  const [postgresConfig, setPostgresConfig] = useState<PostgresConfig>({ host: 'localhost', port: 5432, user: '', pass: '', database: '', ssl: false, isEnabled: false });
  const [ocpiConfig, setOcpiConfig] = useState<OcpiConfig>({ baseUrl: '', countryCode: '', isEnabled: false, partyId: '', token: '' });
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ adminPass: '', adminUser: '', viewOnlyAccounts: [] });
  const [users, setUsers] = useState<User[]>([]);
  const [chargers, setChargers] = useState<EVCharger[]>([]);
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai' | 'pricing' | 'reports' | 'expenses' | 'network' | 'users' | 'security'>('dashboard');
  const [infraSubTab, setInfraSubTab] = useState<'live' | 'hardware'>('live');
  const [lang, setLang] = useState<Language>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Added missing state variables for transaction filtering
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStation, setSelectedStation] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  // Centralized Pricing Logic - Robust implementation
  const getAppliedRate = (account: string, connectorType: string): number => {
    // Priority 1: Exact Account + Specific Connector
    const accConn = pricingRules.find(r => r.targetType === 'ACCOUNT' && r.targetId === account && r.connector === connectorType);
    if (accConn) return accConn.ratePerKWh;

    // Priority 2: Account Global (ALL connectors)
    const accAll = pricingRules.find(r => r.targetType === 'ACCOUNT' && r.targetId === account && r.connector === 'ALL');
    if (accAll) return accAll.ratePerKWh;

    // Priority 3: Group Rules
    const group = accountGroups.find(g => g.members.includes(account));
    if (group) {
      const groupConn = pricingRules.find(r => r.targetType === 'GROUP' && r.targetId === group.name && r.connector === connectorType);
      if (groupConn) return groupConn.ratePerKWh;

      const groupAll = pricingRules.find(r => r.targetType === 'GROUP' && r.targetId === group.name && r.connector === 'ALL');
      if (groupAll) return groupAll.ratePerKWh;
    }

    // Priority 4: System Defaults
    const defConn = pricingRules.find(r => r.targetType === 'DEFAULT' && r.connector === connectorType);
    if (defConn) return defConn.ratePerKWh;

    const defGlobal = pricingRules.find(r => r.targetType === 'DEFAULT' && r.connector === 'ALL');
    if (defGlobal) return defGlobal.ratePerKWh;

    return 1500; // Final hard fallback
  };

  // Initialize App Data
  useEffect(() => {
    const init = async () => {
      const data = await databaseService.load();
      setTransactions(data.transactions || []);
      setPricingRules(data.pricingRules || []);
      setAccountGroups(data.accountGroups || []);
      setExpenses(data.expenses || []);
      setApiConfig(data.apiConfig || { invoiceApiKey: '', invoiceApiUrl: '', isEnabled: false });
      if (data.ocppConfig) setOcppConfig(prev => ({ ...prev, ...data.ocppConfig }));
      setPostgresConfig(data.postgresConfig || { host: 'localhost', port: 5432, user: '', pass: '', database: '', ssl: false, isEnabled: false });
      setOcpiConfig(data.ocpiConfig || { baseUrl: '', countryCode: '', isEnabled: false, partyId: '', token: '' });
      setAuthConfig(data.authConfig || { adminPass: '', adminUser: '', viewOnlyAccounts: [] });
      setUsers(data.users || []);
      setChargers(data.chargers || []);
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

  const handleStartSession = (chargerId: string, connectorId: string) => {
    if (!currentUser) return;
    const charger = chargers.find(c => c.id === chargerId);
    if (!charger) return;
    const connectorObj = charger.connectors.find(c => c.id === connectorId);
    if (!connectorObj) return;

    const rate = getAppliedRate(currentUser.rfidTag || currentUser.email, connectorObj.type);
    
    const newTx: EVTransaction = {
      id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      station: charger.name,
      connector: connectorObj.type,
      account: currentUser.rfidTag || currentUser.name,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      meterKWh: 0,
      costCOP: 0,
      durationMinutes: 0,
      appliedRate: rate,
      status: 'UNPAID',
      paymentType: 'N/A'
    };
    
    setTransactions(prev => [newTx, ...prev]);
  };

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
    return (
      <Login 
        authConfig={authConfig} 
        lang={lang} 
        onLangChange={setLang} 
        onLogin={(role, user) => {
          setCurrentUserRole(role);
          if (user) setCurrentUser(user);
          else {
            setCurrentUser({ id: 'ADMIN-01', name: 'System Admin', email: 'admin@voltflow.io', phone: '000', userType: 'PERSONAL', rfidTag: 'ADMIN', status: 'ACTIVE', createdAt: '' });
          }
        }} 
        users={users}
      />
    );
  }

  if (viewMode === 'MOBILE' && currentUser) {
    return (
      <MobileApp 
        user={currentUser} 
        chargers={chargers} 
        transactions={transactions} 
        lang={lang} 
        onLogout={() => { setCurrentUserRole(null); setViewMode('DESKTOP'); }}
        onExitPortal={() => setViewMode('DESKTOP')}
        onStartSession={handleStartSession}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Sticky Header */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center gap-2">
          <Zap className="text-orange-500 w-5 h-5" />
          <span className="font-black text-slate-800 tracking-tighter">SMART Charge</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode('MOBILE')} className="p-2 bg-orange-50 text-orange-600 rounded-lg">
            <Smartphone size={18} />
          </button>
          <button onClick={() => setCurrentUserRole(null)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
            <LogOut size={18} />
          </button>
        </div>
      </header>

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

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <NavItem icon={<LayoutDashboard size={18} />} label={t('dashboard')} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<TableIcon size={18} />} label={t('transactions')} active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
          <NavItem icon={<Network size={18} />} label={t('chargerManagement')} active={activeTab === 'network'} onClick={() => setActiveTab('network')} />
          {currentUserRole === 'ADMIN' && (
             <NavItem icon={<Users size={18} />} label={t('userManagement')} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
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
          <button 
            onClick={() => setViewMode('MOBILE')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 text-orange-600 rounded-xl font-black text-xs border border-orange-100 hover:bg-orange-100 transition-all"
          >
            <Smartphone size={16} /> Driver Portal Mode
          </button>
          
          <div className="flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-100 mb-2">
            <button onClick={() => setLang('en')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black transition-all ${lang === 'en' ? 'bg-white shadow-sm text-orange-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>ENG</button>
            <button onClick={() => setLang('es')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black transition-all ${lang === 'es' ? 'bg-white shadow-sm text-orange-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>ESP</button>
          </div>
          <div className="space-y-2 px-2">
             <StatusIndicator active={isSaving} label="Sync" icon={<Save size={10} />} color={isSaving ? 'orange' : 'emerald'} />
          </div>
          <button onClick={() => setCurrentUserRole(null)} className="w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-bold hover:bg-rose-100 transition flex items-center justify-center gap-2">
            <LogOut size={18} /> {t('logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} expenses={expenses} chargers={chargers} lang={lang} />}
          {activeTab === 'transactions' && (
            <TransactionTable 
              transactions={filteredTransactions} 
              lang={lang} 
              role={currentUserRole} 
              onClear={() => setTransactions([])} 
              onUpdate={(id, up) => setTransactions(transactions.map(t => t.id === id ? {...t, ...up} : t))} 
              onDelete={(id) => setTransactions(transactions.filter(t => t.id !== id))} 
              onBulkUpdate={(ids, up) => setTransactions(transactions.map(t => ids.includes(t.id) ? {...t, ...up} : t))} 
              onBulkDelete={(ids) => setTransactions(transactions.filter(t => !ids.includes(t.id)))}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          )}
          
          {activeTab === 'network' && (
            <div className="space-y-6">
              <div className="flex bg-white p-1 rounded-2xl border border-slate-200 w-fit no-print">
                <button 
                  onClick={() => setInfraSubTab('live')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${infraSubTab === 'live' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Activity size={16} /> {t('liveMonitor')}
                </button>
                <button 
                  onClick={() => setInfraSubTab('hardware')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${infraSubTab === 'hardware' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Settings2 size={16} /> {t('chargerList')}
                </button>
              </div>

              {infraSubTab === 'live' ? (
                <OcppMonitor 
                  ocppConfig={ocppConfig} 
                  onUpdateOcppConfig={(up) => setOcppConfig(prev => ({ ...prev, ...up }))} 
                  lang={lang} role={currentUserRole} 
                  onNewTransaction={(t) => setTransactions([t, ...transactions])} 
                  pricingRules={pricingRules} accountGroups={accountGroups} 
                  chargers={chargers} 
                  onUpdateCharger={(id, up) => setChargers(chargers.map(c => c.id === id ? {...c, ...up} : c))} 
                />
              ) : (
                <ChargerManagement 
                  chargers={chargers} 
                  onAddCharger={(c) => setChargers([...chargers, {...c, id: Date.now().toString(), createdAt: new Date().toISOString()}])} 
                  onUpdateCharger={(id, up) => setChargers(chargers.map(c => c.id === id ? {...c, ...up} : c))} 
                  onDeleteCharger={(id) => setChargers(chargers.filter(c => c.id !== id))} 
                  lang={lang} 
                />
              )}
            </div>
          )}

          {activeTab === 'reports' && <AccountReports transactions={filteredTransactions} lang={lang} />}
          {activeTab === 'expenses' && <Expenses expenses={expenses} role={currentUserRole} onAdd={(e) => setExpenses([...expenses, {...e, id: Date.now().toString()}])} onUpdate={(id, up) => setExpenses(expenses.map(e => e.id === id ? {...e, ...up} : e))} onDelete={(id) => setExpenses(expenses.filter(e => e.id !== id))} lang={lang} />}
          {activeTab === 'ai' && <AIInsights transactions={filteredTransactions} lang={lang} role={currentUserRole} />}
          {activeTab === 'users' && <UserManagement users={users} onAddUser={(u) => setUsers([...users, {...u, id: Date.now().toString(), createdAt: new Date().toISOString()}])} onImportUsers={(nu) => setUsers([...users, ...nu.map(u => ({...u, id: Math.random().toString(), createdAt: new Date().toISOString()}))])} onUpdateUser={(id, up) => setUsers(users.map(u => u.id === id ? {...u, ...up} : u))} onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))} lang={lang} />}
          {activeTab === 'pricing' && <PricingSettings rules={pricingRules} groups={accountGroups} apiConfig={apiConfig} ocppConfig={ocppConfig} ocpiConfig={ocpiConfig} onAddRule={(r) => setPricingRules([...pricingRules, {...r, id: Date.now().toString()}])} onUpdateRule={(id, up) => setPricingRules(pricingRules.map(r => r.id === id ? {...r, ...up} : r))} onDeleteRule={(id) => setPricingRules(pricingRules.filter(r => r.id !== id))} onAddGroup={(g) => setAccountGroups([...accountGroups, {...g, id: Date.now().toString()}])} onDeleteGroup={(id) => setAccountGroups(accountGroups.filter(g => g.id !== id))} onUpdateGroup={(id, up) => setAccountGroups(accountGroups.map(g => g.id === id ? {...g, ...up} : g))} onUpdateApiConfig={(up) => setApiConfig(prev => ({ ...prev, ...up }))} onUpdateOcppConfig={(up) => setOcppConfig(prev => ({ ...prev, ...up }))} onUpdateOcpiConfig={(up) => setOcpiConfig(prev => ({ ...prev, ...up }))} onExportBackup={() => databaseService.exportBackup({ transactions, pricingRules, accountGroups, expenses, apiConfig, ocppConfig, postgresConfig, ocpiConfig, authConfig, users, chargers, lastUpdated: new Date().toISOString() })} onImportBackup={(f) => {}} lang={lang} />}
          {activeTab === 'security' && <SecuritySettings authConfig={authConfig} postgresConfig={postgresConfig} onUpdateAuthConfig={(up) => setAuthConfig(prev => ({ ...prev, ...up }))} onUpdatePostgresConfig={(up) => setPostgresConfig(prev => ({ ...prev, ...up }))} lang={lang} role={currentUserRole} />}
        </div>
      </main>

      {isImportModalOpen && (
        <ImportModal 
          lang={lang}
          pricingRules={pricingRules}
          accountGroups={accountGroups}
          existingTxIds={new Set(transactions.map(t => t.id))}
          onClose={() => setIsImportModalOpen(false)}
          onImport={(newTxs) => {
            setTransactions(prev => [...newTxs, ...prev]);
            setIsImportModalOpen(false);
          }}
          getAppliedRate={getAppliedRate}
        />
      )}
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
