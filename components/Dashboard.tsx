
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { EVTransaction, Language, Expense, EVCharger } from '../types';
import { Zap, DollarSign, TrendingUp, ShieldCheck, ReceiptText, Activity, Server, Radio } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface DashboardProps {
  transactions: EVTransaction[];
  expenses: Expense[];
  chargers?: EVCharger[];
  lang: Language;
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#f43f5e'];

const formatCOP = (num: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(num);
const formatKWh = (num: number) => num.toFixed(2);

const Dashboard: React.FC<DashboardProps> = ({ transactions, expenses, chargers = [], lang }) => {
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

  const networkHealth = useMemo(() => {
    const total = chargers.length || 0;
    const online = chargers.filter(c => c.status === 'ONLINE').length;
    const connectors = chargers.flatMap(c => c.connectors);
    const charging = connectors.filter(conn => conn.status === 'CHARGING').length;
    const available = connectors.filter(conn => conn.status === 'AVAILABLE').length;
    const livePower = connectors.reduce((sum, conn) => sum + (conn.currentPowerKW || 0), 0);

    return {
      onlineRate: total > 0 ? (online / total * 100).toFixed(0) : '0',
      occupancy: connectors.length > 0 ? ((connectors.length - available) / connectors.length * 100).toFixed(0) : '0',
      livePower: livePower.toFixed(1)
    };
  }, [chargers]);

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

      {/* Network Health Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthCard label={t('networkHealth')} value={`${networkHealth.onlineRate}%`} desc="Chargers Online" icon={<Server size={18} />} color="emerald" />
        <HealthCard label={t('liveOccupancy')} value={`${networkHealth.occupancy}%`} desc="Connectors in Use" icon={<Radio size={18} />} color="orange" />
        <HealthCard label={t('activeEnergy')} value={`${networkHealth.livePower} kW`} desc="Real-time Demand" icon={<Zap size={18} />} color="blue" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t('totalRevenue')} value={`$${formatCOP(financialStats.totalRevenue)}`} icon={<DollarSign size={24} />} color="blue" />
        <StatCard label={t('totalExpenses')} value={`$${formatCOP(financialStats.totalExpenses)}`} icon={<ReceiptText size={24} />} color="rose" />
        <StatCard label={t('netProfit')} value={`$${formatCOP(financialStats.netProfit)}`} icon={<TrendingUp size={24} />} color="emerald" />
        <StatCard label={t('totalPaid')} value={`$${formatCOP(financialStats.paid)}`} icon={<ShieldCheck size={24} />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <Activity size={20} className="text-orange-500" />
            {t('financialTrends')}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${formatCOP(v)}`} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${formatCOP(value)}`, '']} 
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="revenue" name={t('totalRevenue')} stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" name={t('totalExpenses')} stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8">{t('paymentDistribution')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5}>
                  {paymentBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${formatCOP(value)}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const HealthCard = ({ label, value, desc, icon, color }: any) => (
  <div className={`p-6 rounded-3xl border shadow-sm flex items-center gap-5 ${
    color === 'emerald' ? 'bg-emerald-50/50 border-emerald-100' : 
    color === 'orange' ? 'bg-orange-50/50 border-orange-100' : 'bg-blue-50/50 border-blue-100'
  }`}>
    <div className={`p-3 rounded-2xl ${
      color === 'emerald' ? 'bg-emerald-500 text-white' : 
      color === 'orange' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
    }`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-black text-slate-800 leading-none">{value}</h4>
        <span className="text-[10px] font-bold text-slate-500">{desc}</span>
      </div>
    </div>
  </div>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group">
    <div className={`p-3 rounded-2xl mb-4 w-fit transition-transform group-hover:scale-110 ${
      color === 'orange' ? 'bg-orange-50 text-orange-600' : 
      color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
      color === 'blue' ? 'bg-blue-50 text-blue-600' :
      'bg-rose-50 text-rose-600'
    }`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <h4 className="text-xl font-black text-slate-900 mt-1">{value}</h4>
  </div>
);

export default Dashboard;
