
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Table as TableIcon, Zap, BrainCircuit, PlusCircle, Globe, Settings, BarChart3, Filter, Calendar, MapPin, User as UserIcon, X, ReceiptText, Layers, Save, CheckCircle2, Activity, Users, Settings2, Server, ShieldCheck, LogOut } from 'lucide-react';
import { TRANSLATIONS } from './constants';
import { EVTransaction, Language, PricingRule, AccountGroup, Expense, ApiConfig, OcppConfig, User, EVCharger, InfluxConfig, AuthConfig, UserRole, OcpiConfig } from './types';
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
  const initialDb = databaseService.load();

  const [transactions, setTransactions] = useState<EVTransaction[]>(initialDb.transactions);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(initialDb.pricingRules);
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>(initialDb.accountGroups);
  const [expenses, setExpenses] = useState<Expense[]>(initialDb.expenses);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(initialDb.apiConfig);
  const [ocppConfig, setOcppConfig] = useState<OcppConfig>(initialDb.ocppConfig);
  const [influxConfig, setInfluxConfig] = useState<InfluxConfig>(initialDb.influxConfig);
  const [ocpiConfig, setOcpiConfig] = useState<OcpiConfig>(initialDb.ocpiConfig);
  const [authConfig, setAuthConfig] = useState<AuthConfig>(initialDb.authConfig);
  const [users, setUsers] = useState<User[]>(initialDb.users || []);
  const [chargers, setChargers] = useState<EVCharger[]>(initialDb.chargers || []);
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai' | 'pricing' | 'reports' | 'expenses' | 'ocpp' | 'users' | 'chargers' | 'security'>('dashboard');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [isSaving, setIsSaving] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStation, setSelectedStation] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  useEffect(() => {
    setIsSaving(true);
    databaseService.save({
      transactions,
      pricingRules,
      accountGroups,
      expenses,
      apiConfig,
      ocppConfig,
      influxConfig,
      ocpiConfig,
      authConfig,
      users,
      chargers
    });
    const timer = setTimeout(() => setIsSaving(false), 800);
    return () => clearTimeout(timer);
  }, [transactions, pricingRules, accountGroups, expenses, apiConfig, ocppConfig, influxConfig, ocpiConfig, authConfig, users, chargers]);

  const uniqueStations = useMemo(() => {
    const stations = new Set<string>();
    transactions.forEach(tx => stations.add(tx.station));
    return Array.from(stations);
  }, [transactions]);

  const uniqueAccounts = useMemo(() => {
    const accounts = new Set<string>();
    transactions.forEach(tx => accounts.add(tx.account));
    return Array.from(accounts).sort();
  }, [transactions]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    transactions.forEach(tx => {
      const y = new Date(tx.startTime).getFullYear().toString();
      years.add(y);
    });
    expenses.forEach(ex => {
      const y = new Date(ex.date).getFullYear().toString();
      years.add(y);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transactions, expenses]);

  const existingTxIds = useMemo(() => new Set(transactions.map(tx => tx.id)), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const date = new Date(tx.startTime);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || date >= start) && (!end || date <= end);
      const matchesStation = selectedStation === 'all' || tx.station === selectedStation;
      const matchesAccount = accountFilter === 'all' || tx.account === accountFilter;
      const matchesYear = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
      return matchesDate && matchesStation && matchesAccount && matchesYear;
    });
  }, [transactions, startDate, endDate, selectedStation, accountFilter, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const date = new Date(exp.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || date >= start) && (!end || date <= end);
      const matchesYear = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
      return matchesDate && matchesYear;
    });
  }, [expenses, startDate, endDate, selectedYear]);

  const handleUpdateTransaction = (id: string, updates: Partial<EVTransaction>) => {
    if (currentUserRole !== 'ADMIN') return;
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  };

  const handleBulkUpdateTransactions = (ids: string[], updates: Partial<EVTransaction>) => {
    if (currentUserRole !== 'ADMIN') return;
    setTransactions(prev => prev.map(tx => ids.includes(tx.id) ? { ...tx, ...updates } : tx));
  };

  const handleDeleteTransaction = (id: string) => {
    if (currentUserRole !== 'ADMIN') return;
    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
  };

  const handleBulkDeleteTransactions = (ids: string[]) => {
    if (currentUserRole !== 'ADMIN') return;
    if (confirm(`Are you sure you want to delete ${ids.length} selected transactions? This action cannot be undone.`)) {
      setTransactions(prev => prev.filter(tx => !ids.includes(tx.id)));
    }
  };

  const handleAddExpense = (exp: Omit<Expense, 'id'>) => {
    if (currentUserRole !== 'ADMIN') return;
    setExpenses(prev => [...prev, { ...exp, id: Date.now().toString() }]);
  };

  const handleUpdateExpense = (id: string, updates: Partial<Expense>) => {
    if (currentUserRole !== 'ADMIN') return;
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp));
  };

  const handleDeleteExpense = (id: string) => {
    if (currentUserRole !== 'ADMIN') return;
    if (confirm('Delete this expense?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleUpdatePricingRule = (id: string, updates: Partial<PricingRule>) => {
    if (currentUserRole !== 'ADMIN') return;
    setPricingRules(prev => prev.map(rule => rule.id === id ? { ...rule, ...updates } : rule));
  };

  const handleImportBackup = async (file: File) => {
    if (currentUserRole !== 'ADMIN') return;
    const restored = await databaseService.importBackup(file);
    if (restored) {
      setTransactions(restored.transactions);
      setPricingRules(restored.pricingRules);
      setAccountGroups(restored.accountGroups);
      setExpenses(restored.expenses);
      setApiConfig(restored.apiConfig);
      setOcppConfig(restored.ocppConfig);
      setInfluxConfig(restored.influxConfig);
      setOcpiConfig(restored.ocpiConfig || initialDb.ocpiConfig);
      setAuthConfig(restored.authConfig);
      setUsers(restored.users || []);
      setChargers(restored.chargers || []);
      alert('Database restored successfully.');
    } else {
      alert('Error restoring database. File might be corrupted.');
    }
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedStation('all');
    setAccountFilter('all');
    setSelectedYear('all');
  };

  const handleOcppTransaction = (tx: EVTransaction) => {
    setTransactions(prev => [tx, ...prev]);
  };

  const handleImportUsers = (newUsers: Omit<User, 'id' | 'createdAt'>[]) => {
    if (currentUserRole !== 'ADMIN') return;
    const usersWithMeta = newUsers.map(u => ({
      ...u,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    }));
    setUsers(prev => [...prev, ...usersWithMeta]);
  };

  const handleAddCharger = (charger: Omit<EVCharger, 'id' | 'createdAt'>) => {
    if (currentUserRole !== 'ADMIN') return;
    setChargers(prev => [...prev, { 
      ...charger, 
      id: `charger-${Date.now()}`, 
      createdAt: new Date().toISOString() 
    }]);
  };

  const handleUpdateCharger = (id: string, updates: Partial<EVCharger>) => {
    if (currentUserRole !== 'ADMIN') return;
    setChargers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteCharger = (id: string) => {
    if (currentUserRole !== 'ADMIN') return;
    if (confirm('Are you sure you want to delete this charger?')) {
      setChargers(prev => prev.filter(c => c.id !== id));
    }
  };

  if (!currentUserRole) {
    return <Login authConfig={authConfig} lang={lang} onLangChange={setLang} onLogin={setCurrentUserRole} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 animate-in fade-in duration-700">
      <aside className="no-print hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 fixed h-full z-30 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-orange-500 p-2 rounded-lg shadow-lg shadow-orange-200">
            <Zap className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter">
            <span className="text-orange-600">SMART</span>
            <span className="text-slate-800 ml-1">Charge</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label={t('dashboard')} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<TableIcon size={20} />} label={t('transactions')} active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
          <NavItem icon={<Server size={20} />} label={t('liveMonitor')} active={activeTab === 'ocpp'} onClick={() => setActiveTab('ocpp')} />
          {currentUserRole === 'ADMIN' && (
            <>
              <NavItem icon={<Settings2 size={20} />} label={t('chargerManagement')} active={activeTab === 'chargers'} onClick={() => setActiveTab('chargers')} />
              <NavItem icon={<Users size={20} />} label={t('userManagement')} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            </>
          )}
          <NavItem icon={<BarChart3 size={20} />} label={t('reports')} active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <NavItem icon={<ReceiptText size={20} />} label={t('expenses')} active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
          <NavItem icon={<BrainCircuit size={20} />} label={t('aiInsights')} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          {currentUserRole === 'ADMIN' && (
            <NavItem icon={<Settings size={20} />} label={t('pricingRules')} active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')} />
          )}
          <NavItem icon={<ShieldCheck size={20} />} label={t('security')} active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
        </nav>

        <div className="mt-auto pt-6 border-t space-y-4">
          <div className="flex items-center justify-between px-2 py-1">
             <div className="flex items-center gap-2">
                {isSaving ? (
                  <Save size={14} className="text-slate-300 animate-pulse" />
                ) : (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                )}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isSaving ? 'Saving...' : 'All Saved'}
                </span>
             </div>
          </div>

          {currentUserRole === 'ADMIN' && (
            <button 
              onClick={() => setIsImportModalOpen(true)} 
              className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-100"
            >
              <PlusCircle size={18} /> {t('importCsv')}
            </button>
          )}
          
          <button 
            onClick={() => setCurrentUserRole(null)} 
            className="flex items-center justify-center gap-2 w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-bold hover:bg-rose-100 transition"
          >
            <LogOut size={18} /> {t('logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8 print-p-0">
        <div className="max-w-6xl mx-auto space-y-8">
          {(['dashboard', 'transactions', 'reports', 'expenses'].includes(activeTab)) && (
            <div className="no-print bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Filter size={18} className="text-orange-600" />
                  {t('advancedFilters')}
                </div>
                <button onClick={resetFilters} className="text-xs text-orange-600 font-bold hover:underline">{t('resetFilters')}</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Layers size={10} /> {t('year')}
                  </label>
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    <option value="all">{t('allYears')}</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <FilterField label={t('dateStart')} icon={<Calendar size={12} />} type="date" value={startDate} onChange={setStartDate} />
                <FilterField label={t('dateEnd')} icon={<Calendar size={12} />} type="date" value={endDate} onChange={setEndDate} />
                {activeTab !== 'expenses' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <MapPin size={10} /> {t('station')}
                      </label>
                      <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium" value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
                        <option value="all">{t('allStations')}</option>
                        {uniqueStations.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                        <UserIcon size={10} /> {t('account')}
                      </label>
                      <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
                        <option value="all">{t('allAccounts')}</option>
                        {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} expenses={filteredExpenses} chargers={chargers} lang={lang} />}
          {activeTab === 'transactions' && (
            <TransactionTable 
              transactions={filteredTransactions} 
              lang={lang} 
              role={currentUserRole}
              onClear={() => { if(confirm('Are you sure you want to clear all transactions?')) setTransactions([]); }} 
              onUpdate={handleUpdateTransaction}
              onDelete={handleDeleteTransaction}
              onBulkUpdate={handleBulkUpdateTransactions}
              onBulkDelete={handleBulkDeleteTransactions}
            />
          )}
          {activeTab === 'reports' && <AccountReports transactions={filteredTransactions} lang={lang} />}
          {activeTab === 'expenses' && <Expenses expenses={filteredExpenses} role={currentUserRole} onAdd={handleAddExpense} onUpdate={handleUpdateExpense} onDelete={handleDeleteExpense} lang={lang} />}
          {activeTab === 'ai' && <AIInsights transactions={filteredTransactions} lang={lang} role={currentUserRole} onRefresh={activeTab === 'ai' ? () => {} : undefined} />}
          {activeTab === 'ocpp' && <OcppMonitor ocppConfig={ocppConfig} influxConfig={influxConfig} lang={lang} role={currentUserRole} onNewTransaction={handleOcppTransaction} pricingRules={pricingRules} accountGroups={accountGroups} chargers={chargers} onUpdateCharger={handleUpdateCharger} />}
          {activeTab === 'chargers' && currentUserRole === 'ADMIN' && (
            <ChargerManagement 
              chargers={chargers}
              onAddCharger={handleAddCharger}
              onUpdateCharger={handleUpdateCharger}
              onDeleteCharger={handleDeleteCharger}
              lang={lang}
            />
          )}
          {activeTab === 'users' && currentUserRole === 'ADMIN' && (
            <UserManagement 
              users={users}
              onAddUser={(u) => setUsers([...users, { ...u, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }])}
              onImportUsers={handleImportUsers}
              onUpdateUser={(id, updates) => setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u))}
              onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))}
              lang={lang}
            />
          )}
          {activeTab === 'pricing' && currentUserRole === 'ADMIN' && (
            <PricingSettings 
              rules={pricingRules} 
              groups={accountGroups}
              apiConfig={apiConfig}
              ocppConfig={ocppConfig}
              influxConfig={influxConfig}
              ocpiConfig={ocpiConfig}
              onAddRule={(r) => setPricingRules([...pricingRules, { ...r, id: Date.now().toString() }])} 
              onUpdateRule={handleUpdatePricingRule}
              onDeleteRule={(id) => setPricingRules(pricingRules.filter(r => r.id !== id))} 
              onAddGroup={(g) => setAccountGroups([...accountGroups, { ...g, id: Date.now().toString() }])}
              onDeleteGroup={(id) => {
                setAccountGroups(accountGroups.filter(g => g.id !== id));
                setPricingRules(pricingRules.filter(r => r.targetId !== id || r.targetType !== 'GROUP'));
              }}
              onUpdateGroup={(id, updates) => setAccountGroups(accountGroups.map(g => g.id === id ? { ...g, ...updates } : g))}
              onUpdateApiConfig={(updates) => setApiConfig({ ...apiConfig, ...updates })}
              onUpdateOcppConfig={(updates) => setOcppConfig({ ...ocppConfig, ...updates })}
              onUpdateInfluxConfig={(updates) => setInfluxConfig({ ...influxConfig, ...updates })}
              onUpdateOcpiConfig={(updates) => setOcpiConfig({ ...ocpiConfig, ...updates })}
              onExportBackup={() => databaseService.exportBackup()}
              onImportBackup={handleImportBackup}
              lang={lang} 
            />
          )}
          {activeTab === 'security' && (
            <SecuritySettings 
              authConfig={authConfig} 
              onUpdateAuthConfig={(updates) => setAuthConfig({ ...authConfig, ...updates })} 
              lang={lang} 
              role={currentUserRole} 
            />
          )}
        </div>
      </main>

      {isImportModalOpen && currentUserRole === 'ADMIN' && (
        <ImportModal 
          onClose={() => setIsImportModalOpen(false)} 
          pricingRules={pricingRules} 
          accountGroups={accountGroups}
          existingTxIds={existingTxIds}
          onImport={(data) => { 
            setTransactions([...data, ...transactions]); 
            setIsImportModalOpen(false); 
          }} 
          lang={lang}
        />
      )}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-slate-100 text-orange-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
    <span className={active ? 'text-orange-500' : 'text-slate-400'}>{icon}</span>
    <span className="text-sm">{label}</span>
  </button>
);

const FilterField = ({ label, icon, value, onChange, type = "text", placeholder = "" }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">{icon} {label}</label>
    <input type={type} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium" value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export default App;
