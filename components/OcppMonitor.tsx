
import React, { useState, useEffect, useRef } from 'react';
import { OcppConfig, OcppLog, EVTransaction, Language, PricingRule, AccountGroup } from '../types';
import { TRANSLATIONS } from '../constants';
import { Terminal, Activity, Play, Square, Info, ShieldCheck, Zap } from 'lucide-react';

interface OcppMonitorProps {
  ocppConfig: OcppConfig;
  lang: Language;
  onNewTransaction: (tx: EVTransaction) => void;
  pricingRules: PricingRule[];
  accountGroups: AccountGroup[];
}

const OcppMonitor: React.FC<OcppMonitorProps> = ({ ocppConfig, lang, onNewTransaction, pricingRules, accountGroups }) => {
  const [logs, setLogs] = useState<OcppLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const addLog = (direction: 'IN' | 'OUT', type: string, payload: any) => {
    const newLog: OcppLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      direction,
      messageType: type,
      payload
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const getAppliedRate = (account: string, connector: string): number => {
    const exactRule = pricingRules.find(r => 
      r.targetType === 'ACCOUNT' && 
      r.targetId === account && 
      r.connector === connector
    );
    if (exactRule) return exactRule.ratePerKWh;

    const parentGroup = accountGroups.find(g => g.members.includes(account));
    if (parentGroup) {
      const groupRule = pricingRules.find(r => 
        r.targetType === 'GROUP' && 
        r.targetId === parentGroup.id && 
        r.connector === connector
      );
      if (groupRule) return groupRule.ratePerKWh;
    }

    const defaultRule = pricingRules.find(r => r.targetType === 'DEFAULT');
    return defaultRule ? defaultRule.ratePerKWh : 1200;
  };

  const simulateOcppFlow = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setLogs([]);

    // 1. BootNotification
    addLog('IN', 'BootNotification', { chargePointModel: 'VoltCore-X1', chargePointVendor: 'VoltFlow', firmwareVersion: 'v2.1.0' });
    await new Promise(r => setTimeout(r, 1000));
    addLog('OUT', 'BootNotificationResponse', { status: 'Accepted', currentTime: new Date().toISOString(), interval: 300 });

    // 2. StatusNotification
    addLog('IN', 'StatusNotification', { connectorId: 1, errorCode: 'NoError', status: 'Available' });
    await new Promise(r => setTimeout(r, 1000));

    // 3. StartTransaction
    const txId = `OCPP-${Math.floor(Math.random() * 1000000)}`;
    const startTime = new Date();
    addLog('IN', 'StartTransaction', { connectorId: 1, idTag: 'ID_USER_88', meterStart: 1250, timestamp: startTime.toISOString() });
    await new Promise(r => setTimeout(r, 800));
    addLog('OUT', 'StartTransactionResponse', { idTagInfo: { status: 'Accepted' }, transactionId: txId });

    // 4. MeterValues
    for (let i = 1; i <= 3; i++) {
      await new Promise(r => setTimeout(r, 2000));
      addLog('IN', 'MeterValues', { connectorId: 1, transactionId: txId, meterValue: [{ timestamp: new Date().toISOString(), sampledValue: [{ value: (1250 + (i * 2.5)).toString(), context: 'Sample.Periodic', measurand: 'Energy.Active.Import.Register', unit: 'Wh' }] }] });
    }

    // 5. StopTransaction
    await new Promise(r => setTimeout(r, 1500));
    const endTime = new Date();
    const energyUsedKWh = 7.5;
    addLog('IN', 'StopTransaction', { transactionId: txId, idTag: 'ID_USER_88', meterStop: 1257.5, timestamp: endTime.toISOString(), reason: 'EVDisconnected' });
    addLog('OUT', 'StopTransactionResponse', { idTagInfo: { status: 'Accepted' } });

    // Process new transaction
    const rate = getAppliedRate('ID_USER_88', 'CCS2');
    const newTx: EVTransaction = {
      id: txId,
      station: ocppConfig.chargePointId,
      connector: 'CCS2',
      account: 'ID_USER_88',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      meterKWh: energyUsedKWh,
      costCOP: energyUsedKWh * rate,
      durationMinutes: 1,
      appliedRate: rate,
      status: 'UNPAID',
      paymentType: 'N/A'
    };
    onNewTransaction(newTx);
    setIsSimulating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('liveMonitor')}</h2>
          <p className="text-slate-500 font-medium">Real-time OCPP 1.6 protocol communication for {ocppConfig.chargePointId}.</p>
        </div>
        <button 
          onClick={simulateOcppFlow} 
          disabled={isSimulating}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 disabled:opacity-50 transition shadow-lg shadow-slate-100"
        >
          {isSimulating ? <Activity className="animate-pulse" size={20} /> : <Play size={20} />}
          {isSimulating ? 'Receiving Data...' : 'Start Simulator'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 bg-slate-800 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Terminal size={16} className="text-emerald-400" />
                 <span className="text-xs font-mono font-bold text-slate-300">OCPP-J 1.6 CONSOLE</span>
               </div>
               <div className="flex gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-4">
              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                   <Activity size={32} />
                   <p>Waiting for incoming connection...</p>
                </div>
              )}
              {logs.map(log => (
                <div key={log.id} className="animate-in slide-in-from-left-2 duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-500">[{log.timestamp}]</span>
                    <span className={`font-black ${log.direction === 'IN' ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {log.direction === 'IN' ? '▶ RECV' : '◀ SEND'}
                    </span>
                    <span className="text-white bg-slate-700 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">
                      {log.messageType}
                    </span>
                  </div>
                  <pre className="bg-slate-950/50 p-2 rounded-lg text-slate-300 overflow-x-auto border border-slate-800/50">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" />
              {t('ocppStatus')}
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-500 font-bold uppercase tracking-widest">Protocol</span>
                 <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-black">OCPP 1.6-J</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-500 font-bold uppercase tracking-widest">Endpoint</span>
                 <span className="font-mono text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{ocppConfig.centralSystemUrl}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-500 font-bold uppercase tracking-widest">Auth</span>
                 <span className="font-bold text-slate-800">Basic/None</span>
               </div>
            </div>
          </div>

          <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl flex gap-4">
            <div className="bg-orange-500 p-2 rounded-xl text-white h-fit"><Info size={24} /></div>
            <div className="space-y-1">
              <h4 className="font-black text-orange-900">How to receive data?</h4>
              <p className="text-xs text-orange-700 leading-relaxed">
                Connect your physical EV chargers to the Endpoint URL above. Use <strong>{ocppConfig.chargePointId}</strong> as the Charge Point Identity. VoltFlow will automatically process incoming transactions based on your pricing rules.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <Zap size={18} className="text-orange-500" />
              Connector #1 Status
            </h3>
            <div className="flex items-center gap-4">
               <div className={`w-3 h-3 rounded-full ${isSimulating ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               <p className="text-sm font-bold text-slate-700">{isSimulating ? 'CHARGING' : 'AVAILABLE'}</p>
            </div>
            {isSimulating && (
               <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Session Live Data</p>
                  <p className="text-lg font-black text-slate-800">7.52 kWh</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OcppMonitor;
