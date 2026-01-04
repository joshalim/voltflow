
import React, { useState, useEffect, useRef } from 'react';
import { OcppConfig, OcppLog, EVTransaction, Language, PricingRule, AccountGroup, EVCharger, ConnectorStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { Terminal, Activity, Play, Square, Info, ShieldCheck, Zap, Server, Cpu, Radio, Power, Clock, Database, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import ConnectorIcon from './ConnectorIcon';

interface OcppMonitorProps {
  ocppConfig: OcppConfig;
  lang: Language;
  onNewTransaction: (tx: EVTransaction) => void;
  pricingRules: PricingRule[];
  accountGroups: AccountGroup[];
  chargers: EVCharger[];
  onUpdateCharger: (id: string, updates: Partial<EVCharger>) => void;
}

const OcppMonitor: React.FC<OcppMonitorProps> = ({ 
  ocppConfig, 
  lang, 
  onNewTransaction, 
  pricingRules, 
  accountGroups, 
  chargers,
  onUpdateCharger
}) => {
  const [logs, setLogs] = useState<OcppLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeChargerId, setActiveChargerId] = useState<string>(chargers[0]?.id || ocppConfig.chargePointId);
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
    const exactRule = pricingRules.find(r => r.targetType === 'ACCOUNT' && r.targetId === account && r.connector === connector);
    if (exactRule) return exactRule.ratePerKWh;
    const parentGroup = accountGroups.find(g => g.members.includes(account));
    if (parentGroup) {
      const groupRule = pricingRules.find(r => r.targetType === 'GROUP' && r.targetId === parentGroup.id && r.connector === connector);
      if (groupRule) return groupRule.ratePerKWh;
    }
    const defaultRule = pricingRules.find(r => r.targetType === 'DEFAULT');
    return defaultRule ? defaultRule.ratePerKWh : 1200;
  };

  const syncHardwareStatus = (chargerId: string, updates: Partial<EVCharger>) => {
    onUpdateCharger(chargerId, { ...updates, lastHeartbeat: new Date().toISOString() });
  };

  const simulateOcppFlow = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setLogs([]);

    const charger = chargers.find(c => c.id === activeChargerId) || chargers[0];
    if (!charger) {
      alert("Please add at least one charger in the Infrastructure section first.");
      setIsSimulating(false);
      return;
    }

    // 1. BootNotification
    addLog('IN', 'BootNotification', { chargePointModel: charger.model || 'VoltCore-X1', vendor: charger.vendor || 'VoltFlow', firmware: 'v2.4.0' });
    syncHardwareStatus(charger.id, { status: 'ONLINE', firmwareVersion: 'v2.4.0' });
    await new Promise(r => setTimeout(r, 1000));
    addLog('OUT', 'BootNotificationResponse', { status: 'Accepted', interval: 60 });

    // 2. Authorize
    addLog('IN', 'Authorize', { idTag: 'RFID_88_VIP' });
    await new Promise(r => setTimeout(r, 800));
    addLog('OUT', 'AuthorizeResponse', { idTagInfo: { status: 'Accepted' } });

    // 3. StartTransaction
    const txId = `CMS-${Math.floor(Math.random() * 1000000)}`;
    const startTime = new Date();
    const connectorIndex = 0;
    const connectorId = charger.connectors[connectorIndex]?.id || '1';
    
    addLog('IN', 'StartTransaction', { connectorId: 1, idTag: 'RFID_88_VIP', meterStart: 250, timestamp: startTime.toISOString() });
    
    // Update live socket state
    const chargingConnectors = [...charger.connectors];
    chargingConnectors[connectorIndex] = { ...chargingConnectors[connectorIndex], status: 'CHARGING', currentPowerKW: 42.5, voltage: 400, temperature: 38 };
    syncHardwareStatus(charger.id, { connectors: chargingConnectors });
    
    await new Promise(r => setTimeout(r, 800));
    addLog('OUT', 'StartTransactionResponse', { transactionId: txId });

    // 4. MeterValues Loop
    for (let i = 1; i <= 4; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const energy = (250 + (i * 1.5));
      addLog('IN', 'MeterValues', { connectorId: 1, transactionId: txId, meterValue: [{ sampledValue: [{ value: energy.toString(), unit: 'Wh' }] }] });
      
      const liveConnectors = [...charger.connectors];
      liveConnectors[connectorIndex] = { ...liveConnectors[connectorIndex], currentKWh: i * 1.5, currentPowerKW: 42.5 + (Math.random() * 2) };
      syncHardwareStatus(charger.id, { connectors: liveConnectors });
    }

    // 5. StopTransaction
    await new Promise(r => setTimeout(r, 1500));
    const endTime = new Date();
    const energyUsedKWh = 6.0;
    addLog('IN', 'StopTransaction', { transactionId: txId, idTag: 'RFID_88_VIP', meterStop: 256.0, timestamp: endTime.toISOString() });
    addLog('OUT', 'StopTransactionResponse', { idTagInfo: { status: 'Accepted' } });

    // Finalize Socket
    const finalConnectors = [...charger.connectors];
    finalConnectors[connectorIndex] = { ...finalConnectors[connectorIndex], status: 'AVAILABLE', currentKWh: 0, currentPowerKW: 0 };
    syncHardwareStatus(charger.id, { connectors: finalConnectors });

    // Save to global history
    const rate = getAppliedRate('RFID_88_VIP', charger.connectors[0]?.type || 'CCS2');
    onNewTransaction({
      id: txId,
      station: charger.name,
      connector: charger.connectors[0]?.type || 'CCS2',
      account: 'RFID_88_VIP',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      meterKWh: energyUsedKWh,
      costCOP: energyUsedKWh * rate,
      durationMinutes: 5,
      appliedRate: rate,
      status: 'UNPAID',
      paymentType: 'N/A'
    });
    setIsSimulating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Server className="text-orange-500" />
            {t('liveMonitor')}
          </h2>
          <p className="text-slate-500 font-medium">Network Operations Center for centralized EV fleet management.</p>
        </div>
        <div className="flex gap-2">
           <select 
             className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
             value={activeChargerId}
             onChange={(e) => setActiveChargerId(e.target.value)}
           >
             {chargers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
           <button 
            onClick={simulateOcppFlow} 
            disabled={isSimulating || chargers.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 disabled:opacity-50 transition shadow-lg shadow-slate-100"
          >
            {isSimulating ? <Activity className="animate-pulse" size={20} /> : <Play size={20} />}
            {isSimulating ? 'SIMULATING...' : 'SIMULATE FLOW'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Real-time Socket View */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {chargers.flatMap(charger => charger.connectors.map(connector => (
            <div key={`${charger.id}-${connector.id}`} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 relative group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${connector.status === 'CHARGING' ? 'bg-orange-50 text-orange-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                    <ConnectorIcon type={connector.type} size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm leading-none">{charger.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{connector.type} • {connector.id.slice(-4)}</span>
                  </div>
                </div>
                <StatusBadge status={connector.status} />
              </div>

              {connector.status === 'CHARGING' ? (
                <div className="grid grid-cols-3 gap-2 animate-in fade-in">
                  <LiveMetric label="Power" value={`${connector.currentPowerKW?.toFixed(1) || '0.0'} kW`} icon={<Zap size={10} />} />
                  <LiveMetric label="Energy" value={`${connector.currentKWh?.toFixed(2) || '0.00'} kWh`} icon={<Activity size={10} />} />
                  <LiveMetric label="Temp" value={`${connector.temperature || 32}°C`} icon={<Monitor size={10} />} />
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-slate-300 gap-2 italic text-xs font-medium">
                  <Clock size={12} /> Waiting for ID Tag...
                </div>
              )}

              {/* Instant Meter visualization */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-50 rounded-b-3xl overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-1000" 
                  style={{ width: connector.status === 'CHARGING' ? `${(connector.currentPowerKW || 0) / connector.powerKW * 100}%` : '0%' }} 
                />
              </div>
            </div>
          )))}
        </div>

        {/* CMS Console */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[500px]">
              <div className="p-4 bg-slate-800/50 flex items-center justify-between border-b border-slate-700">
                 <div className="flex items-center gap-2">
                   <Terminal size={14} className="text-emerald-400" />
                   <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">NOC CONSOLE</span>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-3">
                 {logs.map(log => (
                   <div key={log.id} className="animate-in slide-in-from-left-2 duration-200">
                     <div className="flex items-center gap-2 mb-1">
                       <span className="text-slate-600">[{log.timestamp.split(' ')[0]}]</span>
                       <span className={`font-black ${log.direction === 'IN' ? 'text-blue-400' : 'text-emerald-400'}`}>
                         {log.direction === 'IN' ? '◀' : '▶'}
                       </span>
                       <span className="text-white px-1 py-0.5 rounded-sm bg-slate-800 border border-slate-700 font-bold uppercase tracking-tighter">
                         {log.messageType}
                       </span>
                     </div>
                     <pre className="bg-black/30 p-2 rounded-lg text-slate-400 border border-slate-800 overflow-x-auto">
                       {JSON.stringify(log.payload, null, 1)}
                     </pre>
                   </div>
                 ))}
                 {logs.length === 0 && <p className="text-slate-700 italic">No communication logs recorded.</p>}
                 <div ref={logEndRef} />
              </div>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                CMS System Integrity
              </h3>
              <div className="space-y-3">
                 <IntegrityItem label="OCPP Protocol" value="1.6-J" />
                 <IntegrityItem label="WebSocket" value="Encrypted" />
                 <IntegrityItem label="Persistence" value="IndexedDB" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: ConnectorStatus }) => {
  const colors = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700',
    CHARGING: 'bg-orange-100 text-orange-700',
    OCCUPIED: 'bg-blue-100 text-blue-700',
    FAULTED: 'bg-red-100 text-red-700',
    UNAVAILABLE: 'bg-slate-200 text-slate-500',
    FINISHING: 'bg-purple-100 text-purple-700'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase ${colors[status] || colors.AVAILABLE}`}>
      {status}
    </span>
  );
};

const LiveMetric = ({ label, value, icon }: any) => (
  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
    <div className="flex items-center gap-1 text-slate-400 mb-0.5">
      {icon} <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-[10px] font-black text-slate-800">{value}</p>
  </div>
);

const IntegrityItem = ({ label, value }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-[10px] font-black text-slate-700">{value}</span>
  </div>
);

export default OcppMonitor;
