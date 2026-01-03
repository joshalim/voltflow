
import React, { useState, useMemo } from 'react';
import { EVTransaction, Language, TransactionStatus, PaymentMethod } from '../types';
import { Search, Download, Edit3, Trash2, CheckCircle, XCircle, CreditCard, Banknote, Wallet, Clock } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface TransactionTableProps {
  transactions: EVTransaction[];
  onClear: () => void;
  onUpdate: (id: string, updates: Partial<EVTransaction>) => void;
  onDelete: (id: string) => void;
  lang: Language;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onClear, onUpdate, onDelete, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTx, setEditingTx] = useState<EVTransaction | null>(null);
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const processed = useMemo(() => {
    return transactions.filter(tx => 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.station.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const formatDuration = (mins: number) => {
    if (!mins || mins < 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTx) {
      onUpdate(editingTx.id, {
        status: editingTx.status,
        paymentType: editingTx.paymentType,
        paymentDate: editingTx.paymentDate
      });
      setEditingTx(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">{t('transactions')}</h2>
          <p className="text-xs text-slate-400 font-medium">Manage and filter charging records by account or status.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search Account or ID..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <button onClick={onClear} className="px-4 py-2 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Account / ID</th>
                <th className="px-6 py-4">Usage & Rate</th>
                <th className="px-6 py-4">Charge Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processed.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{tx.account}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{tx.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700">{tx.meterKWh.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">kWh</span></p>
                    <p className="text-[10px] text-slate-400">${tx.appliedRate.toLocaleString()}/kWh</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-600">
                      <Clock size={14} className="text-orange-400" />
                      {formatDuration(tx.durationMinutes)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight ${
                      tx.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.status === 'PAID' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <PaymentIcon type={tx.paymentType} />
                      <div>
                        <p className="font-bold text-xs text-slate-700">{tx.paymentType}</p>
                        {tx.paymentDate && <p className="text-[10px] text-slate-400">{new Date(tx.paymentDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-orange-600 text-base">
                    ${tx.costCOP.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => setEditingTx(tx)} 
                        className="p-2 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                        title="Edit Transaction"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(tx.id)} 
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {processed.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-300 italic">
                    No transactions found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-in-center">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Edit Transaction</h3>
                <p className="text-xs text-slate-400 mt-1">Update payment details for <span className="font-bold text-slate-600">{editingTx.id}</span></p>
              </div>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Payment Status</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                  value={editingTx.status} 
                  onChange={e => setEditingTx({...editingTx, status: e.target.value as TransactionStatus})}
                >
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID</option>
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Payment Method</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                  value={editingTx.paymentType} 
                  onChange={e => setEditingTx({...editingTx, paymentType: e.target.value as PaymentMethod})}
                >
                  <option value="N/A">N/A</option>
                  <option value="NEQUI">NEQUI</option>
                  <option value="DAVIPLATA">DAVIPLATA</option>
                  <option value="EFECTIVO">EFECTIVO</option>
                </select>
              </div>

              {editingTx.status === 'PAID' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Payment Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                    value={editingTx.paymentDate?.split('T')[0] || ''} 
                    onChange={e => setEditingTx({...editingTx, paymentDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})} 
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-orange-600 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingTx(null)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-black hover:bg-slate-200 active:scale-95 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentIcon = ({ type }: { type: PaymentMethod }) => {
  switch (type) {
    case 'NEQUI': return <div className="p-1.5 bg-purple-50 rounded-lg"><Wallet size={14} className="text-purple-500" /></div>;
    case 'DAVIPLATA': return <div className="p-1.5 bg-red-50 rounded-lg"><CreditCard size={14} className="text-red-500" /></div>;
    case 'EFECTIVO': return <div className="p-1.5 bg-green-50 rounded-lg"><Banknote size={14} className="text-green-500" /></div>;
    default: return <div className="p-1.5 bg-slate-100 rounded-lg"><XCircle size={14} className="text-slate-300" /></div>;
  }
};

export default TransactionTable;
