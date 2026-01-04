
import React, { useState } from 'react';
import { Expense, Language, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Trash2, Calendar, Receipt, DollarSign, Tag, Edit3, XCircle } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (id: string, expense: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  lang: Language;
  role: UserRole;
}

const formatCOP = (num: number) => {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(num);
};

const Expenses: React.FC<ExpensesProps> = ({ expenses, role, onAdd, onUpdate, onDelete, lang }) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isAdmin = role === 'ADMIN';

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [editingExp, setEditingExp] = useState<Expense | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || !date || !isAdmin) return;
    onAdd({
      description: desc,
      amount: parseFloat(amount),
      date
    });
    setDesc('');
    setAmount('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExp && isAdmin) {
      onUpdate(editingExp.id, {
        description: editingExp.description,
        amount: editingExp.amount,
        date: editingExp.date
      });
      setEditingExp(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('expenses')}</h2>
        <p className="text-slate-500 font-medium">{t('expensesSubtitle')}</p>
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
                  disabled={!isAdmin}
                  placeholder="e.g. Electricity Bill..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <DollarSign size={10} /> {t('expenseAmount')}
                </label>
                <input 
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Calendar size={10} /> {t('expenseDate')}
                </label>
                <input 
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                />
              </div>

              {isAdmin && (
                <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-[0.98] transition mt-2 flex items-center justify-center gap-2">
                  <Plus size={20} />
                  {t('addExpense')}
                </button>
              )}
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
                        <span className="font-black text-rose-600">-${formatCOP(exp.amount)} COP</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {isAdmin && (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingExp(exp)} className="p-2 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => onDelete(exp.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editingExp && isAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-in-center">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Edit Expense</h3>
                <p className="text-xs text-slate-400 mt-1">Update operational cost details</p>
              </div>
              <button onClick={() => setEditingExp(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('expenseDescription')}</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                  value={editingExp.description} 
                  onChange={e => setEditingExp({...editingExp, description: e.target.value})}
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('expenseAmount')}</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                  value={editingExp.amount} 
                  onChange={e => setEditingExp({...editingExp, amount: parseFloat(e.target.value)})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('expenseDate')}</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                  value={editingExp.date} 
                  onChange={e => setEditingExp({...editingExp, date: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-orange-600 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all">
                  {t('saveChanges')}
                </button>
                <button type="button" onClick={() => setEditingExp(null)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-black hover:bg-slate-200 active:scale-95 transition-all">
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
