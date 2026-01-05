
import React, { useState, useEffect, useRef } from 'react';
import { OcppConfig, OcppLog, EVTransaction, Language, PricingRule, AccountGroup, EVCharger, ConnectorStatus, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import { Terminal, Activity, Square, Info, ShieldCheck, Zap, Server, Cpu, Radio, Power, Clock, Database, RefreshCw, Smartphone, Monitor, Globe, Link, Network, Wifi, Play, StopCircle } from 'lucide-react';
import ConnectorIcon from './ConnectorIcon';

interface OcppMonitorProps {
  ocppConfig: OcppConfig;
  lang: Language;
  role: UserRole;
  onNewTransaction: (tx: EVTransaction) => void;
  pricingRules: PricingRule[];
  accountGroups: AccountGroup[];
  chargers: EVCharger[];
  onUpdateCharger: (id: string, updates: Partial<EVCharger>) => void;
  onUpdateOcppConfig?: (updates: Partial<OcppConfig>) => void;
}

const OcppMonitor: React.FC<OcppMonitorProps> = ({ 
  ocppConfig, 
  lang, 
  role,
  onNewTransaction, 
  pricingRules, 
  accountGroups, 
  chargers,
  onUpdateCharger,
  onUpdateOcppConfig
}) => {
  const [logs, setLogs] = useState<OcppLog[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const isAdmin = role === 'ADMIN';

  const toggleListener = () => {
    if (onUpdateOcppConfig) {
      onUpdateOcppConfig({ isListening: !ocppConfig.isListening });
    }
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Derived Networking Stats
  const activeConnections = chargers.filter(c => c.status === 'ONLINE').length;
  const totalConnectors = chargers.reduce((acc, c) => acc + c.connectors.length, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Server className="text-orange-500" />
            {t('liveMonitor')}
          </h2>
          <p className="text-slate-500 font-medium">Network Operations Center (NOC) • OCPP 1.6J Management</p>
        </div>
        <div className="flex gap-2">
           {isAdmin && (
             <button 
              onClick={toggleListener}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg ${
                ocppConfig.isListening 
                ? 'bg-rose-500 text-white shadow-rose-100 hover:bg-rose-600' 
                : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'
              }`}
            >
              {ocppConfig.isListening ? <StopCircle size={20} /> : <Play size={20} />}
              {ocppConfig.isListening ? 'STOP CMS LISTENER' : 'START CMS LISTENER'}
            </button>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Connection Details Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Network size={14} className="text-orange-500" />
                Connection Center
              </h3>
              <div className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase ${
                ocppConfig.isListening ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
              }`}>
                {ocppConfig.isListening ? 'Listening' : 'Standby'}
              </div>
            </div>

            <div className="space-y-4">
              <NetworkField label="WSS Endpoint" value={`${ocppConfig.centralSystemUrl}`} icon={<Globe size={12}/>} />
              <div className="grid grid-cols-2 gap-3">
                <NetworkField label="Port" value={`${ocppConfig.port || 3085}`} icon={<Network size={12}/>} />
                <NetworkField label="Protocol" value="1.6J" icon={<Info size={12}/>} />
              </div>
              <NetworkField label="Auth" value={ocppConfig.securityProfile} icon={<ShieldCheck size={12}/>} />
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-500">Active Sockets</span>
                <span className="text-white">{activeConnections}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold mt-2">
                <span className="text-slate-500">Total Capacity</span>
                <span className="text-white">{totalConnectors} Load Points</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Cpu size={14} className="text-blue-500" />
               Hardware Inventory
             </h4>
             <div className="space-y-3">
                {chargers.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-700">{c.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-md ${
                      c.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>{c.status}</span>
                  </div>
                ))}
                {chargers.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">No registered hardware.</p>
                )}
             </div>
          </div>
        </div>

        {/* Real-time Socket Monitor */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {chargers.flatMap(charger => charger.connectors.map(connector => (
              <div key={`${charger.id}-${connector.id}`} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 relative group transition-all hover:border-orange-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${connector.status === 'CHARGING' ? 'bg-orange-50 text-orange-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                      <ConnectorIcon type={connector.type} size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm leading-none">{charger.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{connector.type}</span>
                         <div className="w-1 h-1 rounded-full bg-slate-200" />
                         <span className="text-[9px] font-mono text-slate-400">{connector.id.slice(-4)}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={connector.status} />
                </div>

                <div className="flex-1 min-h-[40px] flex items-center">
                  {connector.status === 'CHARGING' ? (
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <LiveMetric label="Load" value={`${connector.currentPowerKW?.toFixed(1) || '0.0'} kW`} />
                      <LiveMetric label="Session" value={`${connector.currentKWh?.toFixed(2) || '0.00'} kWh`} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 italic">
                      <Wifi size={10} />
                      {connector.status === 'AVAILABLE' ? 'Waiting for Hardware Trigger...' : 'Disconnected'}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   <div className="flex items-center gap-1">
                      <Clock size={10} />
                      {charger.lastHeartbeat ? new Date(charger.lastHeartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Activity'}
                   </div>
                   <span className="text-orange-500 font-bold">{connector.powerKW}kW Max</span>
                </div>
              </div>
            )))}
          </div>

          {/* NOC Console */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[300px]">
            <div className="p-4 bg-slate-800/50 flex items-center justify-between border-b border-slate-700">
               <div className="flex items-center gap-2">
                 <Terminal size={14} className="text-emerald-400" />
                 <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">NOC LIVE LOGS</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${ocppConfig.isListening ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-[8px] font-mono text-slate-500">{ocppConfig.isListening ? 'LISTENING ON PORT ' + ocppConfig.port : 'OFFLINE'}</span>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-3 custom-scrollbar">
               {logs.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2">
                    <Activity size={24} className="opacity-20" />
                    <p className="font-bold uppercase tracking-widest">Waiting for incoming OCPP 1.6 messages...</p>
                 </div>
               ) : (
                 logs.map(log => (
                   <div key={log.id} className="animate-in slide-in-from-left-2 duration-200">
                     <div className="flex items-center gap-2 mb-1">
                       <span className="text-slate-600">[{log.timestamp}]</span>
                       <span className={`font-black ${log.direction === 'IN' ? 'text-blue-400' : 'text-emerald-400'}`}>
                         {log.direction === 'IN' ? '◀' : '▶'}
                       </span>
                       <span className="text-white px-1 py-0.5 rounded-sm bg-slate-800 border border-slate-700 font-bold uppercase tracking-tighter">
                         {log.messageType}
                       </span>
                       {log.chargerId && <span className="text-slate-500">[{log.chargerId}]</span>}
                     </div>
                     <pre className="bg-black/30 p-2 rounded-lg text-slate-400 border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                       {JSON.stringify(log.payload, null, 1)}
                     </pre>
                   </div>
                 ))
               )}
               <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NetworkField = ({ label, value, icon }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
      {icon} {label}
    </label>
    <div className="bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-orange-400 truncate">
      {value}
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: ConnectorStatus }) => {
  const colors = {
    AVAILABLE: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    CHARGING: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
    OCCUPIED: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    FAULTED: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
    UNAVAILABLE: 'bg-slate-100 text-slate-400 border border-slate-200',
    FINISHING: 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase ${colors[status] || colors.AVAILABLE}`}>
      {status}
    </span>
  );
};

const LiveMetric = ({ label, value }: any) => (
  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{label}</span>
    <p className="text-[11px] font-black text-slate-800">{value}</p>
  </div>
);

export default OcppMonitor;
