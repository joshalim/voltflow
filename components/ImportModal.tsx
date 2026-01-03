
import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, FileWarning } from 'lucide-react';
import { EVTransaction, PricingRule, AccountGroup } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onImport: (data: EVTransaction[]) => void;
  pricingRules: PricingRule[];
  accountGroups: AccountGroup[];
  existingTxIds: Set<string>;
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

const SPECIAL_ACCOUNTS = ['PORTERIA', 'Jorge Iluminacion', 'John Iluminacion'];

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, pricingRules, accountGroups, existingTxIds }) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<EVTransaction[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const getAppliedRate = (account: string, connector: string): number => {
    // 1. Priority logic for critical accounts
    if (SPECIAL_ACCOUNTS.includes(account)) {
      if (connector === 'CCS2') return 2500;
      if (connector === 'CHADEMO') return 2000;
      if (connector === 'J1772') return 1500;
    }

    // 2. Exact Rule Match (Specific Account)
    const exactRule = pricingRules.find(r => 
      r.targetType === 'ACCOUNT' && 
      r.targetId === account && 
      r.connector === connector
    );
    if (exactRule) return exactRule.ratePerKWh;

    // 3. Group Rule Match
    const parentGroup = accountGroups.find(g => g.members.includes(account));
    if (parentGroup) {
      const groupRule = pricingRules.find(r => 
        r.targetType === 'GROUP' && 
        r.targetId === parentGroup.id && 
        r.connector === connector
      );
      if (groupRule) return groupRule.ratePerKWh;
    }

    // 4. Default Rule Fallback
    const defaultRule = pricingRules.find(r => r.targetType === 'DEFAULT');
    return defaultRule ? defaultRule.ratePerKWh : 1200;
  };

  const calculateDuration = (start: string, end: string): number => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e)) return 0;
    const diffMs = e - s;
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const validateData = (headers: string[], rows: string[][]): { data: EVTransaction[], errors: string[], duplicates: number } => {
    const errors: string[] = [];
    const validTransactions: EVTransaction[] = [];
    const normalizedHeaders = headers.map(h => h.trim());
    const missingHeaders = REQUIRED_HEADERS.filter(req => !normalizedHeaders.includes(req));
    let duplicates = 0;
    const batchTxIds = new Set<string>();
    
    if (missingHeaders.length > 0) {
      return { data: [], errors: [`Missing: ${missingHeaders.join(', ')}`], duplicates: 0 };
    }

    const hMap: Record<string, number> = {};
    REQUIRED_HEADERS.forEach(req => hMap[req] = normalizedHeaders.indexOf(req));

    rows.forEach((row, index) => {
      const lineNum = index + 2;
      if (row.length < REQUIRED_HEADERS.length) return;

      const txId = row[hMap['TxID']].trim();
      
      // Check for duplicates (existing in app OR existing in this CSV batch)
      if (existingTxIds.has(txId) || batchTxIds.has(txId)) {
        duplicates++;
        return;
      }

      const station = row[hMap['Station']].trim();
      const connector = row[hMap['Connector']].trim();
      const account = row[hMap['Account']].trim();
      const startTime = row[hMap['Start Time']].trim();
      const endTime = row[hMap['End Time']].trim();
      const meterKWhValue = row[hMap['Meter value(kW.h)']].trim();
      const meterKWh = parseFloat(meterKWhValue);

      if (isNaN(meterKWh) || meterKWh <= 0) return;

      const startDateObj = new Date(startTime);
      const endDateObj = new Date(endTime);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        errors.push(`Line ${lineNum}: Invalid Time.`);
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
          costCOP: meterKWh * rate,
          durationMinutes: calculateDuration(startTime, endTime),
          appliedRate: rate,
          status: 'UNPAID',
          paymentType: 'N/A'
        });
      }
    });

    return { data: validTransactions, errors: errors.slice(0, 5), duplicates };
  };

  const handleFile = (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);
    setParsedData([]);
    setDuplicateCount(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length < 2) return;
        const { data, errors, duplicates } = validateData(lines[0].split(','), lines.slice(1).map(l => l.split(',')));
        if (errors.length > 0) setValidationErrors(errors);
        else {
          setParsedData(data);
          setDuplicateCount(duplicates);
        }
      } catch (err) {
        setValidationErrors(["Failed to read file. Please ensure it is a valid CSV."]);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const onDrag = (e: React.DragEvent) => { e.preventDefault(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-900/20 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-black text-slate-800">Import Transactions</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <div className="p-6">
          {!parsedData.length && duplicateCount === 0 && !isProcessing ? (
            <div onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center transition-all ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300'}`}>
              <div className="bg-orange-100 p-4 rounded-full mb-4">
                <Upload size={32} className="text-orange-600" />
              </div>
              <p className="font-black text-slate-800">Drop your CSV export here</p>
              <p className="text-xs text-slate-400 mt-1 mb-6">File must contain TxID, Station, Connector, Account, etc.</p>
              <label className="bg-orange-600 text-white px-8 py-3 rounded-xl cursor-pointer font-bold shadow-lg shadow-orange-100 hover:bg-orange-700 transition">
                Browse Files <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            </div>
          ) : isProcessing ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-slate-600">Validating entries...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parsedData.length > 0 && (
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4 animate-in slide-in-from-bottom-2">
                  <div className="bg-emerald-500 p-2 rounded-lg"><CheckCircle2 className="text-white" size={20} /></div>
                  <div>
                    <p className="text-emerald-900 font-black leading-tight">{parsedData.length} New Transactions</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Ready for billing update</p>
                  </div>
                </div>
              )}

              {duplicateCount > 0 && (
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-center gap-4 animate-in slide-in-from-bottom-2">
                  <div className="bg-amber-500 p-2 rounded-lg"><FileWarning className="text-white" size={20} /></div>
                  <div>
                    <p className="text-amber-900 font-black leading-tight">{duplicateCount} Duplicates Skipped</p>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">TxIDs already exist in system</p>
                  </div>
                </div>
              )}

              {parsedData.length === 0 && duplicateCount > 0 && (
                <div className="p-6 text-center">
                  <p className="text-slate-500 font-medium">No new transactions found in this file.</p>
                  <button onClick={() => {setDuplicateCount(0); setParsedData([]);}} className="mt-4 text-orange-600 font-bold hover:underline">Try another file</button>
                </div>
              )}

              {parsedData.length > 0 && (
                <>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pricing Logic Applied</h4>
                    <p className="text-xs text-slate-600">Calculated rates based on <span className="font-bold text-orange-600">Account Groups</span> and <span className="font-bold text-orange-600">Individual Overrides</span>.</p>
                  </div>
                  <button onClick={() => onImport(parsedData)} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-[0.98] transition">Finalize Import</button>
                </>
              )}
            </div>
          )}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold">
               <div className="flex items-center gap-2 mb-2"><AlertTriangle size={14} /> Validation Errors</div>
               <ul className="list-disc list-inside space-y-1">
                 {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
               </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
