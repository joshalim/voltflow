
import React from 'react';
import { EVTransaction, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { X, Printer, Zap, MapPin, Clock, Download } from 'lucide-react';

interface InvoiceModalProps {
  transaction: EVTransaction;
  lang: Language;
  onClose: () => void;
}

// Global formatters
const formatCOP = (num: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(num);
const formatKWh = (num: number) => num.toFixed(2);

const InvoiceModal: React.FC<InvoiceModalProps> = ({ transaction, lang, onClose }) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 no-print-overlay">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 no-print">
          <div className="flex items-center gap-2">
            <Printer size={20} className="text-orange-600" />
            <h3 className="text-lg font-black text-slate-800">{t('invoice')}</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition"
            >
              <Download size={16} />
              {t('printInvoice')}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white print:p-0">
          <div id="invoice-printable" className="space-y-10">
            {/* Branding & Info */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-600 p-2 rounded-lg">
                    <Zap className="text-white w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black tracking-tighter">
                    <span className="text-orange-600">SMART</span>
                    <span className="text-slate-800 ml-1">Charge</span>
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Powered by VoltFlow</p>
              </div>
              <div className="text-right space-y-1">
                <h4 className="text-xl font-black text-slate-800">{t('invoice')}</h4>
                <p className="text-slate-500 font-bold text-sm">#{transaction.id}</p>
                <p className="text-slate-400 text-xs">{new Date(transaction.startTime).toLocaleDateString()}</p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Bill To & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('billTo')}</h5>
                <div>
                  <p className="text-lg font-black text-slate-800">{transaction.account}</p>
                  <p className="text-slate-500 text-sm">Account Record # {transaction.account.split('-')[1] || '---'}</p>
                </div>
              </div>
              <div className="space-y-3 md:text-right">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('status')}</h5>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight ${
                  transaction.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {transaction.status === 'PAID' ? <Zap size={12} fill="currentColor" /> : <X size={12} />}
                  {transaction.status}
                </span>
                {transaction.status === 'PAID' && transaction.paymentDate && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    {t('paymentDate')}: {new Date(transaction.paymentDate).toLocaleDateString()} via {transaction.paymentType}
                  </p>
                )}
              </div>
            </div>

            {/* Station Summary */}
            <div className="bg-slate-50 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border border-slate-100">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('station')}</p>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><MapPin size={10} className="text-orange-500" /> {transaction.station}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('connector')}</p>
                <p className="text-xs font-bold text-slate-800 uppercase">{transaction.connector}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('startTime')}</p>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><Clock size={10} className="text-orange-500" /> {new Date(transaction.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('duration')}</p>
                <p className="text-xs font-bold text-slate-800">{transaction.durationMinutes} min</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-4 px-2">{t('description')}</th>
                      <th className="pb-4 px-2">{t('usage')}</th>
                      <th className="pb-4 px-2">{t('rate')}</th>
                      <th className="pb-4 px-2 text-right">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-6 px-2">
                        <p className="font-bold text-slate-800 text-sm">Electric Vehicle Charging Service</p>
                        <p className="text-xs text-slate-400 mt-1">Session ID: {transaction.id}</p>
                      </td>
                      <td className="py-6 px-2">
                        <span className="font-bold text-slate-700">{formatKWh(transaction.meterKWh)} kWh</span>
                      </td>
                      <td className="py-6 px-2">
                        <span className="text-slate-500 text-sm">${formatCOP(transaction.appliedRate)} / kWh</span>
                      </td>
                      <td className="py-6 px-2 text-right">
                        <span className="font-black text-slate-900">${formatCOP(transaction.costCOP)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-6 border-t border-slate-100">
              <div className="w-full max-w-[200px] space-y-3">
                <div className="flex justify-between items-center text-slate-500 text-sm">
                  <span>Subtotal</span>
                  <span>${formatCOP(transaction.costCOP)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-sm">
                  <span>Tax (0%)</span>
                  <span>$0</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="font-black text-slate-800">{t('total')}</span>
                  <span className="text-2xl font-black text-orange-600">${formatCOP(transaction.costCOP)} COP</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-10 text-center space-y-2">
              <p className="text-slate-400 text-xs font-medium italic">Thank you for charging with Smart Charge Infrastructure.</p>
              <p className="text-slate-300 text-[10px] uppercase font-bold tracking-widest">© 2025 VoltFlow Technologies Inc.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print-overlay {
            position: relative !important;
            background: white !important;
            padding: 0 !important;
          }
          .bg-white {
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          #invoice-printable {
            width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceModal;
