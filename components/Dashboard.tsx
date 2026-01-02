
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { EVTransaction, Language } from '../types';
import { Zap, DollarSign, Clock, Users, ShieldCheck, ShieldAlert } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface DashboardProps {
  transactions: EVTransaction[];
  lang: Language;
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#f43f5e'];

const Dashboard: React.FC<DashboardProps> = ({ transactions, lang }) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const financialStats = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.status === 'PAID') acc.paid += tx.costCOP;
      else acc.unpaid += tx.costCOP;
      return acc;
    }, { paid: 0, unpaid: 0 });
  }, [transactions]);

  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.status === 'PAID') {
        methods[tx.paymentType] = (methods[tx.paymentType] || 0) + tx.costCOP;
      }
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const timeSeriesData = useMemo(() => {
    const days: Record<string, number> = {};
    transactions.forEach(tx => {
      const date = tx.startTime.split('T')[0];
      days[date] = (days[date] || 0) + tx.meterKWh;
    });
    return Object.entries(days).map(([date, energy]) => ({ date, energy })).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('networkOverview')}</h2>
        <p className="text-slate-500 font-medium">{t('performanceMetrics')}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label={t('totalRevenue')} value={`$${(financialStats.paid + financialStats.unpaid).toLocaleString()} COP`} icon={<DollarSign size={24} />} color="orange" />
        <StatCard label={t('totalPaid')} value={`$${financialStats.paid.toLocaleString()} COP`} icon={<ShieldCheck size={24} />} color="emerald" />
        <StatCard label={t('totalUnpaid')} value={`$${financialStats.unpaid.toLocaleString()} COP`} icon={<ShieldAlert size={24} />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-50 p-6 rounded-3xl border shadow-sm">
          <h3 className="text-lg font-bold mb-6">{t('energyTrend')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="energy" stroke="#f97316" fill="#fff7ed" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border shadow-sm">
          <h3 className="text-lg font-bold mb-6">Payment Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                  {paymentBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className={`p-3 rounded-2xl mb-4 w-fit ${
      color === 'orange' ? 'bg-orange-50 text-orange-600' : 
      color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
    }`}>
      {icon}
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
    <h4 className="text-xl font-black text-slate-900 mt-1">{value}</h4>
  </div>
);

export default Dashboard;
