
import React, { useMemo, useState } from 'react';
import { EVTransaction, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { User, Zap, DollarSign, ListOrdered, ChevronRight, FileText, ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';

interface AccountReportsProps {
  transactions: EVTransaction[];
  lang: Language;
}

interface AccountSummary {
  account: string;
  energy: number;
  cost: number;
  sessions: number;
  avgRate: number;
}

const AccountReports: React.FC<AccountReportsProps> = ({ transactions, lang }) => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const accountData = useMemo(() => {
    const summary: Record<string, AccountSummary> = {};
    
    transactions.forEach(tx => {
      if (!summary[tx.account]) {
        summary[tx.account] = {
          account: tx.account,
          energy: 0,
          cost: 0,
          sessions: 0,
          avgRate: 0
        };
      }
      const s = summary[tx.account];
      s.energy += tx.meterKWh;
      s.cost += tx.costCOP;
      s.sessions += 1;
    });

    return Object.values(summary).map(s => ({
      ...s,
      avgRate: s.energy > 0 ? s.cost / s.energy : 0
    })).sort((a, b) => b.cost - a.cost);
  }, [transactions]);

  const accountSessions = useMemo(() => {
    if (!selectedAccount) return [];
    return transactions
      .filter(tx => tx.account === selectedAccount)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [transactions, selectedAccount]);

  const selectedSummary = useMemo(() => {
    return accountData.find(s => s.account === selectedAccount);
  }, [accountData, selectedAccount]);

  const handleExportPDF = () => {
    window.print();
  };

  const formatDuration = (mins: number) => {
    if (!mins || mins < 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  if (selectedAccount && selectedSummary) {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedAccount(null)}
              className="no-print p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <User className="text-orange-500" size={28} />
                {selectedAccount}
              </h2>
              <p className="text-slate-500 font-medium">Detailed session history and billing for this account.</p>
            </div>
          </div>
          <button 
            onClick={handleExportPDF}
            className="no-print flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition shadow-lg shadow-slate-100"
          >
            <FileText size={18} />
            Print User Statement
          </button>
        </header>

        {/* User Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <DetailStatCard label="Total Sessions" value={selectedSummary.sessions} icon={<ListOrdered size={20} />} color="blue" />
          <DetailStatCard label="Energy Consumed" value={`${selectedSummary.energy.toLocaleString()} kWh`} icon={<Zap size={20} />} color="orange" />
          <DetailStatCard label="Total Amount" value={`$${selectedSummary.cost.toLocaleString()} COP`} icon={<DollarSign size={20} />} color="emerald" />
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden print-border-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Station / Connector</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Usage</th>
                  <th className="px-6 py-4">Rate</th>
                  <th className="px-6 py-4 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accountSessions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">
                          {new Date(tx.startTime).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(tx.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-300" />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs">{tx.station}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{tx.connector}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-500 text-xs">
                        <Clock size={12} className="text-slate-300" />
                        {formatDuration(tx.durationMinutes)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-700 text-sm">{tx.meterKWh.toFixed(1)} kWh</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-bold text-slate-400">${tx.appliedRate.toLocaleString()}/kWh</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-black text-slate-900">${tx.costCOP.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('accountOverview')}</h2>
          <p className="text-slate-500 font-medium">Aggregated billing and usage statistics by user account.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="no-print flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition shadow-lg shadow-slate-100"
        >
          <FileText size={18} />
          Export PDF
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden print-border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">{t('account')}</th>
                <th className="px-6 py-4">{t('totalSessions')}</th>
                <th className="px-6 py-4">{t('totalEnergy')}</th>
                <th className="px-6 py-4">{t('totalRevenue')}</th>
                <th className="px-6 py-4">{t('rate')} (Avg)</th>
                <th className="no-print px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accountData.map((s) => (
                <tr 
                  key={s.account} 
                  onClick={() => setSelectedAccount(s.account)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-xl text-orange-600 print-bg-none">
                        <User size={18} />
                      </div>
                      <span className="font-black text-slate-800 group-hover:text-orange-600 transition-colors">{s.account}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <ListOrdered size={14} className="text-slate-300" />
                      {s.sessions}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <Zap size={14} className="text-orange-400" />
                      {s.energy.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      <span className="text-[10px] text-slate-400 font-normal">kWh</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 font-black text-slate-900">
                      <DollarSign size={14} className="text-emerald-500" />
                      ${s.cost.toLocaleString()}
                      <span className="text-[10px] text-slate-400 font-normal">COP</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs font-bold text-slate-400">
                      ${Math.round(s.avgRate).toLocaleString()} / kWh
                    </span>
                  </td>
                  <td className="no-print px-6 py-6 text-right">
                    <ChevronRight size={18} className="text-slate-200 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                  </td>
                </tr>
              ))}
              {accountData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                    No account data available. Import sessions to see reports.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Distribution Visual Summary (Mini Cards) */}
      <div className="no-print grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountData.slice(0, 3).map((s, idx) => (
          <div key={idx} onClick={() => setSelectedAccount(s.account)} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between cursor-pointer hover:border-orange-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 px-2 py-1 rounded-md">Top Account #{idx+1}</span>
              <User size={16} className="text-slate-300" />
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-4">{s.account}</h4>
            <div className="space-y-2">
               <div className="flex justify-between text-xs font-bold">
                 <span className="text-slate-400">Revenue Contribution</span>
                 <span className="text-slate-900">${s.cost.toLocaleString()} COP</span>
               </div>
               <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                 <div 
                   className="bg-orange-500 h-full rounded-full" 
                   style={{ width: `${(s.cost / accountData[0].cost) * 100}%` }}
                 />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DetailStatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-2xl ${
      color === 'blue' ? 'bg-blue-50 text-blue-500' :
      color === 'orange' ? 'bg-orange-50 text-orange-500' :
      'bg-emerald-50 text-emerald-500'
    }`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default AccountReports;
