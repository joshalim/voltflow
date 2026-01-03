
import React, { useState } from 'react';
import { Expense, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Trash2, Calendar, Receipt, DollarSign, Tag } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onDelete: (id: string) => void;
  lang: Language;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAdd, onDelete, lang }) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !date) return;
    onAdd({
      description: desc,
      amount: parseFloat(amount),
      date
    });
    setDesc('');
    setAmount('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('expenses')}</h2>
        <p className="text-slate-500 font-medium">Track operational costs and infrastructure maintenance.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Receipt size={20} className="text-orange-500" />
              {t('addExpense')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Tag size={10} /> {t('expenseDescription')}
                </label>
                <input 
                  type="text" value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="e.g. Electricity Bill, Repair..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <DollarSign size={10} /> {t('expenseAmount')}
                </label>
                <input 
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Calendar size={10} /> {t('expenseDate')}
                </label>
                <input 
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-[0.98] transition mt-2 flex items-center justify-center gap-2">
                <Plus size={20} />
                {t('addExpense')}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">{t('expenseDate')}</th>
                    <th className="px-6 py-4">{t('expenseDescription')}</th>
                    <th className="px-6 py-4">{t('expenseAmount')}</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.sort((a,b) => b.date.localeCompare(a.date)).map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-500">{exp.date}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-slate-800">{exp.description}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-rose-600">-${exp.amount.toLocaleString()} COP</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => onDelete(exp.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-300 italic font-medium">
                        No expenses recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
