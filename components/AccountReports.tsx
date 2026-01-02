
import React, { useMemo } from 'react';
import { EVTransaction, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { User, Zap, DollarSign, ListOrdered, ChevronRight } from 'lucide-react';

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('accountOverview')}</h2>
        <p className="text-slate-500 font-medium">Aggregated billing and usage statistics by user account.</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">{t('account')}</th>
                <th className="px-6 py-4">{t('totalSessions')}</th>
                <th className="px-6 py-4">{t('totalEnergy')}</th>
                <th className="px-6 py-4">{t('totalRevenue')}</th>
                <th className="px-6 py-4">{t('rate')} (Avg)</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accountData.map((s) => (
                <tr key={s.account} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                        <User size={18} />
                      </div>
                      <span className="font-black text-slate-800">{s.account}</span>
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
                  <td className="px-6 py-6 text-right">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountData.slice(0, 3).map((s, idx) => (
          <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
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

export default AccountReports;
