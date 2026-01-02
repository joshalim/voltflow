
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Table as TableIcon, Zap, BrainCircuit, PlusCircle, Globe, Settings, BarChart3, Filter, Calendar, MapPin, User as UserIcon, X } from 'lucide-react';
import { MOCK_DATA, TRANSLATIONS, INITIAL_PRICING_RULES } from './constants';
import { EVTransaction, Language, PricingRule, AccountGroup } from './types';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import ImportModal from './components/ImportModal';
import AIInsights from './components/AIInsights';
import PricingSettings from './components/PricingSettings';
import AccountReports from './components/AccountReports';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<EVTransaction[]>(() => {
    const saved = localStorage.getItem('smartcharge_transactions_v2');
    return saved ? JSON.parse(saved) : MOCK_DATA;
  });

  const [pricingRules, setPricingRules] = useState<PricingRule[]>(() => {
    const saved = localStorage.getItem('smartcharge_pricing');
    return saved ? JSON.parse(saved) : INITIAL_PRICING_RULES;
  });

  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>(() => {
    const saved = localStorage.getItem('smartcharge_groups');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai' | 'pricing' | 'reports'>('dashboard');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStation, setSelectedStation] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  useEffect(() => {
    localStorage.setItem('smartcharge_transactions_v2', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('smartcharge_pricing', JSON.stringify(pricingRules));
  }, [pricingRules]);

  useEffect(() => {
    localStorage.setItem('smartcharge_groups', JSON.stringify(accountGroups));
  }, [accountGroups]);

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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const date = new Date(tx.startTime);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || date >= start) && (!end || date <= end);
      const matchesStation = selectedStation === 'all' || tx.station === selectedStation;
      const matchesAccount = accountFilter === 'all' || tx.account === accountFilter;
      return matchesDate && matchesStation && matchesAccount;
    });
  }, [transactions, startDate, endDate, selectedStation, accountFilter]);

  const handleUpdateTransaction = (id: string, updates: Partial<EVTransaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  };

  const handleUpdatePricingRule = (id: string, updates: Partial<PricingRule>) => {
    setPricingRules(prev => prev.map(rule => rule.id === id ? { ...rule, ...updates } : rule));
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedStation('all');
    setAccountFilter('all');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 fixed h-full z-30 shadow-sm">
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
          <NavItem icon={<BarChart3 size={20} />} label={t('reports')} active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <NavItem icon={<BrainCircuit size={20} />} label={t('aiInsights')} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          <NavItem icon={<Settings size={20} />} label={t('pricingRules')} active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')} />
        </nav>

        <div className="mt-auto pt-6 border-t space-y-4">
          <button 
            onClick={() => setIsImportModalOpen(true)} 
            className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-100"
          >
            <PlusCircle size={18} /> {t('importCsv')}
          </button>
          
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
             <Globe size={16} className="text-slate-400" />
             <div className="flex gap-1">
                <button onClick={() => setLang('en')} className={`px-2 py-1 rounded-md text-[10px] font-bold ${lang === 'en' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>ENG</button>
                <button onClick={() => setLang('es')} className={`px-2 py-1 rounded-md text-[10px] font-bold ${lang === 'es' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>ESP</button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Global Filter Bar */}
          {(['dashboard', 'transactions', 'reports'].includes(activeTab)) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Filter size={18} className="text-orange-600" />
                  {t('advancedFilters')}
                </div>
                <button onClick={resetFilters} className="text-xs text-orange-600 font-bold hover:underline">{t('resetFilters')}</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FilterField label={t('dateStart')} icon={<Calendar size={12} />} type="date" value={startDate} onChange={setStartDate} />
                <FilterField label={t('dateEnd')} icon={<Calendar size={12} />} type="date" value={endDate} onChange={setEndDate} />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <MapPin size={10} /> {t('station')}
                  </label>
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium" value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
                    <option value="all">All Stations</option>
                    {uniqueStations.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <UserIcon size={10} /> {t('account')}
                  </label>
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
                    <option value="all">All Accounts</option>
                    {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} lang={lang} />}
          {activeTab === 'transactions' && (
            <TransactionTable 
              transactions={filteredTransactions} 
              lang={lang} 
              onClear={() => { if(confirm('Are you sure?')) setTransactions([]); }} 
              onUpdate={handleUpdateTransaction} 
            />
          )}
          {activeTab === 'reports' && <AccountReports transactions={filteredTransactions} lang={lang} />}
          {activeTab === 'ai' && <AIInsights transactions={filteredTransactions} lang={lang} />}
          {activeTab === 'pricing' && (
            <PricingSettings 
              rules={pricingRules} 
              groups={accountGroups}
              onAddRule={(r) => setPricingRules([...pricingRules, { ...r, id: Date.now().toString() }])} 
              onUpdateRule={handleUpdatePricingRule}
              onDeleteRule={(id) => setPricingRules(pricingRules.filter(r => r.id !== id))} 
              onAddGroup={(g) => setAccountGroups([...accountGroups, { ...g, id: Date.now().toString() }])}
              onDeleteGroup={(id) => {
                setAccountGroups(accountGroups.filter(g => g.id !== id));
                setPricingRules(pricingRules.filter(r => r.targetId !== id || r.targetType !== 'GROUP'));
              }}
              onUpdateGroup={(id, updates) => setAccountGroups(accountGroups.map(g => g.id === id ? { ...g, ...updates } : g))}
              lang={lang} 
            />
          )}
        </div>
      </main>

      {isImportModalOpen && (
        <ImportModal 
          onClose={() => setIsImportModalOpen(false)} 
          pricingRules={pricingRules} 
          accountGroups={accountGroups}
          onImport={(data) => { 
            setTransactions([...data, ...transactions]); 
            setIsImportModalOpen(false); 
          }} 
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
