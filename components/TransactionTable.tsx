
import React, { useState, useMemo } from 'react';
import { EVTransaction, Language, TransactionStatus, PaymentMethod, UserRole } from '../types';
import { Search, Edit3, Trash2, CheckCircle, XCircle, CreditCard, Banknote, Wallet, Clock, CheckSquare, Square, Layers, X, FileText } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import ConnectorIcon from './ConnectorIcon';
import InvoiceModal from './InvoiceModal';

interface TransactionTableProps {
  transactions: EVTransaction[];
  onClear: () => void;
  onUpdate: (id: string, updates: Partial<EVTransaction>) => void;
  onDelete: (id: string) => void;
  onBulkUpdate: (ids: string[], updates: Partial<EVTransaction>) => void;
  onBulkDelete: (ids: string[]) => void;
  lang: Language;
  role: UserRole;
}

const formatCOP = (num: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(num);
const formatKWh = (num: number) => num.toFixed(2);

const TransactionTable: React.FC<TransactionTableProps> = ({ 
  transactions, 
  onClear, 
  onUpdate, 
  onDelete, 
  onBulkUpdate, 
  onBulkDelete, 
  lang,
  role
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingTx, setEditingTx] = useState<EVTransaction | null>(null);
  const [invoiceTx, setInvoiceTx] = useState<EVTransaction | null>(null);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  
  const [bulkStatus, setBulkStatus] = useState<TransactionStatus>('PAID');
  const [bulkPaymentType, setBulkPaymentType] = useState<PaymentMethod>('N/A');
  const [bulkPaymentDate, setBulkPaymentDate] = useState<string>('');

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isAdmin = role === 'ADMIN';

  const processed = useMemo(() => {
    return transactions.filter(tx => 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.station.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const toggleSelectAll = () => {
    if (!isAdmin) return;
    if (selectedIds.size === processed.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processed.map(tx => tx.id)));
    }
  };

  const toggleSelect = (id: string) => {
    if (!isAdmin) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const formatDuration = (mins: number) => {
    if (!mins || mins < 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTx && isAdmin) {
      onUpdate(editingTx.id, {
        status: editingTx.status,
        paymentType: editingTx.paymentType,
        paymentDate: editingTx.paymentDate
      });
      setEditingTx(null);
    }
  };

  const handleBulkUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) {
      onBulkUpdate(Array.from(selectedIds), {
        status: bulkStatus,
        paymentType: bulkPaymentType,
        paymentDate: bulkStatus === 'PAID' ? (bulkPaymentDate || new Date().toISOString()) : undefined
      });
      setIsBulkEditing(false);
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (isAdmin) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-6 relative">
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
              placeholder={t('searchAccountPlaceholder')} 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          {isAdmin && (
            <button onClick={onClear} className="px-4 py-2 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">
              {t('clear')}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-16">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-orange-500 transition-colors">
                      {selectedIds.size === processed.length && processed.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </th>
                )}
                <th className="px-6 py-4">{t('account')} / {t('txId')}</th>
                <th className="px-6 py-4">{t('startTime')}</th>
                <th className="px-6 py-4">{t('station')} / {t('connector')}</th>
                <th className="px-6 py-4">{t('usage')} & {t('rate')}</th>
                <th className="px-6 py-4">{t('cost')}</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4">{t('paymentType')}</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processed.map(tx => {
                const isSelected = selectedIds.has(tx.id);
                return (
                  <tr key={tx.id} className={`hover:bg-slate-50/50 transition-colors group ${isSelected ? 'bg-orange-50/30' : ''}`}>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <button onClick={() => toggleSelect(tx.id)} className={`${isSelected ? 'text-orange-600' : 'text-slate-300'} hover:text-orange-500 transition-colors`}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{tx.account}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tx.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-xs">
                          {new Date(tx.startTime).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(tx.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-orange-200 transition-colors">
                          <ConnectorIcon type={tx.connector} size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs">{tx.station}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{tx.connector}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700">{formatKWh(tx.meterKWh)} <span className="text-[10px] text-slate-400 font-normal">kWh</span></p>
                      <p className="text-[10px] text-slate-400">${formatCOP(tx.appliedRate)}/kWh</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900">${formatCOP(tx.costCOP)}</p>
                      <div className="flex items-center gap-1.5 font-bold text-slate-400 text-[10px]">
                        <Clock size={12} className="text-orange-400" />
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => setInvoiceTx(tx)} 
                          className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title={t('invoice')}
                        >
                          <FileText size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => setEditingTx(tx)} 
                              className="p-2 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                              title={t('edit')}
                            >
                              <Edit3 size={18} />
                            </button>
                            <button 
                              onClick={() => onDelete(tx.id)} 
                              className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title={t('delete')}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {processed.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-6 py-20 text-center text-slate-300 italic">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.size > 0 && isAdmin && (
        <div className="no-print fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-slate-700/50 backdrop-blur-xl">
            <div className="flex items-center gap-2 pr-6 border-r border-slate-700">
              <div className="bg-orange-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black">
                {selectedIds.size}
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-slate-400">{t('selected')}</span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsBulkEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                <Layers size={16} className="text-orange-500" />
                {t('edit')}
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl text-sm font-bold transition-all"
              >
                <Trash2 size={16} />
                {t('delete')}
              </button>
            </div>

            <button 
              onClick={() => setSelectedIds(new Set())}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {isBulkEditing && isAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-in-center">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Bulk Edit Transactions</h3>
                <p className="text-xs text-slate-400 mt-1">Updating <span className="font-bold text-orange-600">{selectedIds.size}</span> records at once.</p>
              </div>
              <button onClick={() => setIsBulkEditing(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleBulkUpdate} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('status')}</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                  value={bulkStatus} 
                  onChange={e => setBulkStatus(e.target.value as TransactionStatus)}
                >
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID</option>
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('paymentType')}</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                  value={bulkPaymentType} 
                  onChange={e => setBulkPaymentType(e.target.value as PaymentMethod)}
                >
                  <option value="N/A">N/A</option>
                  <option value="NEQUI">NEQUI</option>
                  <option value="DAVIPLATA">DAVIPLATA</option>
                  <option value="EFECTIVO">EFECTIVO</option>
                </select>
              </div>

              {bulkStatus === 'PAID' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('paymentDate')}</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" 
                    value={bulkPaymentDate} 
                    onChange={e => setBulkPaymentDate(e.target.value)} 
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-orange-600 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all">
                  Apply Changes
                </button>
                <button type="button" onClick={() => setIsBulkEditing(false)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-black hover:bg-slate-200 active:scale-95 transition-all">
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTx && isAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-in-center">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">{t('editTransaction')}</h3>
                <p className="text-xs text-slate-400 mt-1">{t('saveChanges')} <span className="font-bold text-slate-600">{editingTx.id}</span></p>
              </div>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('status')}</label>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('paymentType')}</label>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('paymentDate')}</label>
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
                  {t('saveChanges')}
                </button>
                <button type="button" onClick={() => setEditingTx(null)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-black hover:bg-slate-200 active:scale-95 transition-all">
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoiceTx && (
        <InvoiceModal 
          transaction={invoiceTx} 
          lang={lang} 
          onClose={() => setInvoiceTx(null)} 
        />
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
