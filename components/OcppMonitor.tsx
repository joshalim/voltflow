
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
            <Activity className="text-orange-500" />
            {t('liveMonitor')}
          </h2>
          <p className="text-slate-500 font-medium">Real-time socket telemetry and OCPP packet analysis.</p>
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
              {ocppConfig.isListening ? 'STOP NOC' : 'START NOC'}
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
                Network Specs
              </h3>
              <div className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase ${
                ocppConfig.isListening ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
              }`}>
                {ocppConfig.isListening ? 'LIVE' : 'IDLE'}
              </div>
            </div>

            <div className="space-y-4">
              <NetworkField label="Domain" value={ocppConfig.domain} icon={<Globe size={12}/>} />
              <div className="grid grid-cols-2 gap-3">
                <NetworkField label="Port" value={ocppConfig.port.toString()} icon={<Database size={12}/>} />
                <NetworkField label="Protocol" value="1.6J" icon={<Info size={12}/>} />
              </div>
              <NetworkField label="Identity" value={ocppConfig.identity} icon={<ShieldCheck size={12}/>} />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
               <span className="text-[10px] font-black text-slate-500 uppercase">Sockets</span>
               <span className="text-orange-500 font-mono font-black">{activeConnections} / {chargers.length}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
               <Cpu size={14} className="text-blue-500" />
               Provisioned Hardware
             </h4>
             <div className="space-y-3">
                {chargers.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-700 truncate mr-2">{c.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                      c.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>{c.status}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Real-time Socket Monitor */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {chargers.flatMap(charger => charger.connectors.map(connector => (
              <div key={`${charger.id}-${connector.id}`} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 relative transition-all hover:border-orange-200">
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
                <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   <div className="flex items-center gap-1">
                      <Clock size={10} />
                      {charger.lastHeartbeat ? new Date(charger.lastHeartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                   </div>
                   <span className="text-orange-500 font-bold">{connector.powerKW}kW Max</span>
                </div>
              </div>
            )))}
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[300px]">
            <div className="p-4 bg-slate-800/50 flex items-center justify-between border-b border-slate-700">
               <div className="flex items-center gap-2">
                 <Terminal size={14} className="text-emerald-400" />
                 <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Live Trace</span>
               </div>
               <span className="text-[8px] font-mono text-slate-500 uppercase">Listening on port {ocppConfig.port}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-3 custom-scrollbar text-slate-400 italic text-center py-20">
               {logs.length === 0 ? "Waiting for incoming hardware packets..." : "Traces loading..."}
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

export default OcppMonitor;
