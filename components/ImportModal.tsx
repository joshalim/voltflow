
import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, FileWarning, Zap, Info } from 'lucide-react';
import { EVTransaction, PricingRule, AccountGroup, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ImportModalProps {
  onClose: () => void;
  onImport: (data: EVTransaction[]) => void;
  pricingRules: PricingRule[];
  accountGroups: AccountGroup[];
  existingTxIds: Set<string>;
  lang: Language;
  getAppliedRate: (account: string, connector: string) => number;
}

const REQUIRED_HEADERS = [
  'TxID',
  'Station',
  'Connector',
  'Account',
  'Start Time',
  'End Time',
  'Meter value(kW.h)'
];

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, pricingRules, accountGroups, existingTxIds, lang, getAppliedRate }) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<EVTransaction[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [zeroUsageCount, setZeroUsageCount] = useState(0);

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const calculateDuration = (start: string, end: string): number => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e)) return 0;
    const diffMs = e - s;
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const validateData = (headers: string[], rows: string[][]): { data: EVTransaction[], errors: string[], duplicates: number, zeroUsage: number } => {
    const errors: string[] = [];
    const validTransactions: EVTransaction[] = [];
    const normalizedHeaders = headers.map(h => h.trim());
    const missingHeaders = REQUIRED_HEADERS.filter(req => !normalizedHeaders.includes(req));
    let duplicates = 0;
    let zeroUsage = 0;
    const batchTxIds = new Set<string>();
    
    if (missingHeaders.length > 0) {
      return { data: [], errors: [`Missing headers: ${missingHeaders.join(', ')}`], duplicates: 0, zeroUsage: 0 };
    }

    const hMap: Record<string, number> = {};
    REQUIRED_HEADERS.forEach(req => hMap[req] = normalizedHeaders.indexOf(req));

    rows.forEach((row, index) => {
      const lineNum = index + 2;
      if (row.length < REQUIRED_HEADERS.length) return;

      const txId = row[hMap['TxID']]?.trim();
      if (!txId) return;
      
      const meterKWhValue = row[hMap['Meter value(kW.h)']]?.trim();
      const meterKWh = parseFloat(meterKWhValue);

      // CRITICAL: Filter out transactions with 0 or invalid meter value
      if (isNaN(meterKWh) || meterKWh <= 0) {
        zeroUsage++;
        return;
      }

      if (existingTxIds.has(txId) || batchTxIds.has(txId)) {
        duplicates++;
        return;
      }

      const station = row[hMap['Station']]?.trim() || 'Unknown';
      const connector = row[hMap['Connector']]?.trim() || 'N/A';
      const account = row[hMap['Account']]?.trim() || 'Anonymous';
      const startTime = row[hMap['Start Time']]?.trim();
      const endTime = row[hMap['End Time']]?.trim();

      const startDateObj = new Date(startTime);
      const endDateObj = new Date(endTime);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        errors.push(`Line ${lineNum}: Invalid Time format.`);
      }

      if (errors.length === 0) {
        batchTxIds.add(txId);
        const rate = getAppliedRate(account, connector);
        validTransactions.push({
          id: txId,
          station,
          connector,
          account,
          startTime: startDateObj.toISOString(),
          endTime: endDateObj.toISOString(),
          meterKWh,
          costCOP: Math.round(meterKWh * rate),
          durationMinutes: calculateDuration(startTime, endTime),
          appliedRate: rate,
          status: 'UNPAID',
          paymentType: 'N/A'
        });
      }
    });

    return { data: validTransactions, errors: errors.slice(0, 5), duplicates, zeroUsage };
  };

  const handleFile = (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);
    setParsedData([]);
    setDuplicateCount(0);
    setZeroUsageCount(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length < 2) {
          setValidationErrors(["CSV file is empty or missing data rows."]);
          setIsProcessing(false);
          return;
        }
        const { data, errors, duplicates, zeroUsage } = validateData(lines[0].split(','), lines.slice(1).map(l => l.split(',')));
        if (errors.length > 0) setValidationErrors(errors);
        else {
          setParsedData(data);
          setDuplicateCount(duplicates);
          setZeroUsageCount(zeroUsage);
        }
      } catch (err) {
        setValidationErrors(["Failed to read file. Please ensure it is a valid CSV format."]);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const onDrag = (e: React.DragEvent) => { e.preventDefault(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-800">{t('importTransactions')}</h3>
            <p className="text-xs text-slate-400 font-medium">Bulk processing for Ocpp exports</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8">
          {!parsedData.length && duplicateCount === 0 && zeroUsageCount === 0 && !isProcessing && validationErrors.length === 0 ? (
            <div 
              onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
              className={`border-3 border-dashed rounded-[2rem] p-12 flex flex-col items-center transition-all ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300'}`}
            >
              <div className="bg-orange-100 p-5 rounded-full mb-6">
                <Upload size={40} className="text-orange-600" />
              </div>
              <p className="font-black text-lg text-slate-800 text-center">{t('dropCsv')}</p>
              <p className="text-xs text-slate-400 mt-2 mb-8 text-center max-w-[200px]">Ensure headers match standard Ocpp CSV exports.</p>
              
              <label className="bg-orange-600 text-white px-8 py-3.5 rounded-2xl cursor-pointer font-black shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all">
                {t('browseFiles')}
                <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            </div>
          ) : isProcessing ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mb-6"></div>
              <p className="font-black text-slate-600 uppercase tracking-widest text-[10px]">{t('validatingEntries')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {validationErrors.length > 0 && (
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 space-y-2">
                  <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase">
                    <AlertTriangle size={16} /> Validation Failed
                  </div>
                  <ul className="text-xs text-rose-500 list-disc list-inside font-medium">
                    {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                  <button onClick={() => setValidationErrors([])} className="text-[10px] font-black text-rose-600 uppercase hover:underline mt-2">Try Again</button>
                </div>
              )}

              {parsedData.length > 0 && (
                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-5 animate-in slide-in-from-bottom-2">
                  <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-100"><CheckCircle2 className="text-white" size={24} /></div>
                  <div>
                    <p className="text-emerald-900 font-black text-lg leading-tight">{parsedData.length} {t('newTransactions')}</p>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">Validated & Price Matched</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {duplicateCount > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 animate-in slide-in-from-bottom-2">
                    <div className="bg-slate-400 p-2 rounded-xl"><FileWarning className="text-white" size={16} /></div>
                    <div>
                      <p className="text-slate-900 font-black text-sm leading-tight">{duplicateCount} Duplicates</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ignored</p>
                    </div>
                  </div>
                )}

                {zeroUsageCount > 0 && (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3 animate-in slide-in-from-bottom-2">
                    <div className="bg-amber-500 p-2 rounded-xl"><Info className="text-white" size={16} /></div>
                    <div>
                      <p className="text-amber-900 font-black text-sm leading-tight">{zeroUsageCount} Zero Use</p>
                      <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Skipped</p>
                    </div>
                  </div>
                )}
              </div>

              {parsedData.length > 0 && (
                <div className="space-y-4">
                  <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                    <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Zap size={10} /> Dynamic Billing Engine
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Costs pre-calculated using <span className="text-orange-600 font-black">Account Hierarchy</span>. Total value: <span className="font-black text-slate-800">${new Intl.NumberFormat().format(parsedData.reduce((s,t) => s + t.costCOP, 0))} COP</span>.
                    </p>
                  </div>
                  <button 
                    onClick={() => onImport(parsedData)} 
                    className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload size={20} />
                    {t('finalizeImport')}
                  </button>
                </div>
              )}

              {parsedData.length === 0 && (duplicateCount > 0 || zeroUsageCount > 0 || validationErrors.length > 0) && (
                <button 
                  onClick={() => { setDuplicateCount(0); setZeroUsageCount(0); setParsedData([]); setValidationErrors([]); }}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Restart Process
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
