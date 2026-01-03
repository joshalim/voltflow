
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { EVTransaction, Language, Expense } from '../types';
import { Zap, DollarSign, TrendingUp, ShieldCheck, ReceiptText } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface DashboardProps {
  transactions: EVTransaction[];
  expenses: Expense[];
  lang: Language;
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#f43f5e'];

// Formatter to use dot as thousands separator and 0 decimals
const formatCOP = (num: number) => {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(num);
};

// Formatter for energy to use 2 decimal places
const formatKWh = (num: number) => {
  return num.toFixed(2);
};

const Dashboard: React.FC<DashboardProps> = ({ transactions, expenses, lang }) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const financialStats = useMemo(() => {
    const revenue = transactions.reduce((acc, tx) => {
      if (tx.status === 'PAID') acc.paid += tx.costCOP;
      else acc.unpaid += tx.costCOP;
      return acc;
    }, { paid: 0, unpaid: 0 });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalRevenue = revenue.paid + revenue.unpaid;
    const netProfit = totalRevenue - totalExpenses;

    return { ...revenue, totalRevenue, totalExpenses, netProfit };
  }, [transactions, expenses]);

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
    const days: Record<string, { date: string, energy: number, revenue: number, expense: number }> = {};
    
    transactions.forEach(tx => {
      const date = tx.startTime.split('T')[0];
      if (!days[date]) days[date] = { date, energy: 0, revenue: 0, expense: 0 };
      days[date].energy += tx.meterKWh;
      days[date].revenue += tx.costCOP;
    });

    expenses.forEach(exp => {
      const date = exp.date;
      if (!days[date]) days[date] = { date, energy: 0, revenue: 0, expense: 0 };
      days[date].expense += exp.amount;
    });

    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, expenses]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('networkOverview')}</h2>
        <p className="text-slate-500 font-medium">{t('performanceMetrics')}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t('totalRevenue')} value={`$${formatCOP(financialStats.totalRevenue)} COP`} icon={<DollarSign size={24} />} color="blue" />
        <StatCard label={t('totalExpenses')} value={`$${formatCOP(financialStats.totalExpenses)} COP`} icon={<ReceiptText size={24} />} color="rose" />
        <StatCard label={t('netProfit')} value={`$${formatCOP(financialStats.netProfit)} COP`} icon={<TrendingUp size={24} />} color="emerald" />
        <StatCard label={t('totalPaid')} value={`$${formatCOP(financialStats.paid)} COP`} icon={<ShieldCheck size={24} />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-50 p-6 rounded-3xl border shadow-sm">
          <h3 className="text-lg font-bold mb-6">{t('financialTrends')} ({t('revenueVsExpenses')})</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatCOP(v)} />
                <Tooltip formatter={(value: number) => [`$${formatCOP(value)}`, '']} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name={t('totalRevenue')} stroke="#3b82f6" fill="#eff6ff" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" name={t('totalExpenses')} stroke="#f43f5e" fill="#fff1f2" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border shadow-sm">
          <h3 className="text-lg font-bold mb-6">{t('paymentDistribution')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                  {paymentBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${formatCOP(value)}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 p-6 rounded-3xl border shadow-sm">
        <h3 className="text-lg font-bold mb-6">{t('energyTrend')}</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: number) => [`${formatKWh(value)} kWh`, '']} />
              <Area type="monotone" dataKey="energy" name={t('totalEnergy')} stroke="#f97316" fill="#fff7ed" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className={`p-3 rounded-2xl mb-4 w-fit ${
      color === 'orange' ? 'bg-orange-50 text-orange-600' : 
      color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
      color === 'blue' ? 'bg-blue-50 text-blue-600' :
      'bg-rose-50 text-rose-600'
    }`}>
      {icon}
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
    <h4 className="text-xl font-black text-slate-900 mt-1">{value}</h4>
  </div>
);

export default Dashboard;
