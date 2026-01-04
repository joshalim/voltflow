
import React, { useState, useEffect } from 'react';
import { PricingRule, AccountGroup, Language, ApiConfig, OcppConfig, InfluxConfig, OcpiConfig, InfluxPrecision } from '../types';
import { TRANSLATIONS } from '../constants';
// Fix: Added Zap and DollarSign to the imported icons from lucide-react to resolve "Cannot find name" errors
import { Plus, Trash2, Users, LayoutGrid, Target, Link2, Key, Globe, ShieldCheck, Database, Download, Activity, Network, CheckCircle2, AlertTriangle, RefreshCw, Clock, Zap, DollarSign } from 'lucide-react';
import { influxService } from '../services/influxService';

interface PricingSettingsProps {
  rules: PricingRule[];
  groups: AccountGroup[];
  apiConfig: ApiConfig;
  ocppConfig: OcppConfig;
  influxConfig: InfluxConfig;
  ocpiConfig: OcpiConfig;
  onAddRule: (rule: Omit<PricingRule, 'id'>) => void;
  onUpdateRule: (id: string, rule: Partial<PricingRule>) => void;
  onDeleteRule: (id: string) => void;
  onAddGroup: (group: Omit<AccountGroup, 'id'>) => void;
  onUpdateGroup: (id: string, updates: Partial<AccountGroup>) => void;
  onDeleteGroup: (id: string) => void;
  onUpdateApiConfig: (config: Partial<ApiConfig>) => void;
  onUpdateOcppConfig: (config: Partial<OcppConfig>) => void;
  onUpdateInfluxConfig: (config: Partial<InfluxConfig>) => void;
  onUpdateOcpiConfig: (config: Partial<OcpiConfig>) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  lang: Language;
}

const PricingSettings: React.FC<PricingSettingsProps> = ({ 
  rules, 
  groups, 
  apiConfig,
  ocppConfig,
  influxConfig,
  ocpiConfig,
  onAddRule, 
  onDeleteRule, 
  onAddGroup,
  onDeleteGroup,
  onUpdateApiConfig,
  onUpdateOcppConfig,
  onUpdateInfluxConfig,
  onUpdateOcpiConfig,
  onExportBackup,
  lang 
}) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const [isInfluxHealthy, setIsInfluxHealthy] = useState<boolean | null>(null);
  const [influxMessage, setInfluxMessage] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  
  const [targetType, setTargetType] = useState<'ACCOUNT' | 'GROUP' | 'DEFAULT'>('ACCOUNT');
  const [targetId, setTargetId] = useState('');
  const [connector, setConnector] = useState('');
  const [rate, setRate] = useState('');

  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');

  useEffect(() => {
    if (influxConfig.url && influxConfig.isEnabled) {
      influxService.checkHealth(influxConfig).then(res => {
        setIsInfluxHealthy(res.healthy);
        setInfluxMessage(res.message);
      });
    } else {
      setIsInfluxHealthy(null);
      setInfluxMessage('');
    }
  }, [influxConfig.url, influxConfig.isEnabled]);

  const handleTestInflux = async () => {
    setIsTesting(true);
    setInfluxMessage('Testing connection...');
    
    const health = await influxService.checkHealth(influxConfig);
    if (!health.healthy) {
      setIsInfluxHealthy(false);
      setInfluxMessage(`Health check failed: ${health.message}`);
      setIsTesting(false);
      return;
    }

    const writeTest = await influxService.testWritePermissions(influxConfig);
    setIsInfluxHealthy(writeTest.success);
    setInfluxMessage(writeTest.success ? 'Full Read/Write connection established!' : `Write error: ${writeTest.message}`);
    setIsTesting(false);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType !== 'DEFAULT' && !targetId) return;
    if (!connector || !rate) return;
    
    onAddRule({
      targetId: targetType === 'DEFAULT' ? 'Default' : targetId,
      targetType,
      connector,
      ratePerKWh: parseFloat(rate)
    });
    setTargetId('');
    setConnector('');
    setRate('');
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;
    onAddGroup({
      name: groupName,
      members: groupMembers.split(',').map(m => m.trim()).filter(m => m !== '')
    });
    setGroupName('');
    setGroupMembers('');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('pricingRules')}</h2>
          <p className="text-slate-500 font-medium">{t('pricingRulesSubtitle')}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={onExportBackup} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition">
             <Download size={14} /> {t('exportPdf').replace('PDF', 'JSON')}
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* InfluxDB v2 Settings */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Database size={20} className="text-purple-500" />
                {t('influxDbSettings')}
              </h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isInfluxHealthy === true ? 'bg-emerald-500 animate-pulse' : isInfluxHealthy === false ? 'bg-rose-500' : 'bg-slate-300'}`} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isInfluxHealthy === true ? t('connected') : isInfluxHealthy === false ? 'Error' : t('disconnected')}
                </span>
              </div>
            </div>

            <div className="space-y-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-bold text-slate-700">{t('enableIntegration')}</span>
                 <button 
                  onClick={() => onUpdateInfluxConfig({ isEnabled: !influxConfig.isEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${influxConfig.isEnabled ? 'bg-purple-500' : 'bg-slate-300'}`}
                 >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${influxConfig.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ConfigField label={t('influxUrl')} value={influxConfig.url} onChange={(v: string) => onUpdateInfluxConfig({ url: v })} placeholder="http://localhost:8086" icon={<Link2 size={12}/>} />
                  <ConfigField label={t('influxOrg')} value={influxConfig.org} onChange={(v: string) => onUpdateInfluxConfig({ org: v })} placeholder="my-org" icon={<Activity size={12}/>} />
                  <ConfigField label={t('influxBucket')} value={influxConfig.bucket} onChange={(v: string) => onUpdateInfluxConfig({ bucket: v })} placeholder="voltflow" icon={<Database size={12}/>} />
                  <ConfigField label={t('influxToken')} value={influxConfig.token} onChange={(v: string) => onUpdateInfluxConfig({ token: v })} placeholder="API Token" icon={<Key size={12}/>} type="password" />
                  <ConfigField label="Prefix" value={influxConfig.measurementPrefix} onChange={(v: string) => onUpdateInfluxConfig({ measurementPrefix: v })} placeholder="vlt_" icon={<Target size={12}/>} />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Clock size={12}/> Precision
                    </label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
                      value={influxConfig.precision} 
                      onChange={(e) => onUpdateInfluxConfig({ precision: e.target.value as InfluxPrecision })}
                    >
                      <option value="s">Seconds (s)</option>
                      <option value="ms">Milliseconds (ms)</option>
                      <option value="us">Microseconds (us)</option>
                      <option value="ns">Nanoseconds (ns)</option>
                    </select>
                  </div>
               </div>

               <div className="pt-2 border-t border-slate-200 flex flex-col gap-3">
                  <button 
                    onClick={handleTestInflux}
                    disabled={isTesting || !influxConfig.url || !influxConfig.isEnabled}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition"
                  >
                    {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Network size={14} />}
                    Test Connection
                  </button>
                  {influxMessage && (
                    <div className={`p-2 rounded-lg text-[10px] font-bold flex items-start gap-2 ${isInfluxHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {isInfluxHealthy ? <CheckCircle2 size={12} className="mt-0.5" /> : <AlertTriangle size={12} className="mt-0.5" />}
                      {influxMessage}
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* OCPI Roaming Settings */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Network size={20} className="text-emerald-500" />
              {t('ocpiIntegration')}
            </h3>

            <div className="space-y-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-bold text-slate-700">{t('enableIntegration')}</span>
                 <button 
                  onClick={() => onUpdateOcpiConfig({ isEnabled: !ocpiConfig.isEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ocpiConfig.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                 >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ocpiConfig.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
               </div>

               <div className="space-y-4">
                  <ConfigField label={t('ocpiUrl')} value={ocpiConfig.baseUrl} onChange={(v: string) => onUpdateOcpiConfig({ baseUrl: v })} placeholder="https://api.roaming.com/ocpi/cpo" icon={<Link2 size={12}/>} />
                  <div className="grid grid-cols-2 gap-4">
                    <ConfigField label={t('partyId')} value={ocpiConfig.partyId} onChange={(v: string) => onUpdateOcpiConfig({ partyId: v })} placeholder="VLT" icon={<Target size={12}/>} />
                    <ConfigField label={t('countryCode')} value={ocpiConfig.countryCode} onChange={(v: string) => onUpdateOcpiConfig({ countryCode: v })} placeholder="CO" icon={<Globe size={12}/>} />
                  </div>
                  <ConfigField label={t('ocpiToken')} value={ocpiConfig.token} onChange={(v: string) => onUpdateOcpiConfig({ token: v })} placeholder="Client Token A" icon={<Key size={12}/>} type="password" />
               </div>
            </div>
          </div>

          {/* Account Groupings */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              {t('accountGroupings')}
            </h3>
            
            <form onSubmit={handleAddGroup} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 mb-6">
              <ConfigField label="Group Name" value={groupName} onChange={setGroupName} placeholder="e.g. Corporate Accounts" icon={<Users size={12}/>} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Activity size={12}/> Members (Comma separated IDs)
                </label>
                <textarea 
                  value={groupMembers} 
                  onChange={e => setGroupMembers(e.target.value)}
                  placeholder="RFID_01, RFID_02, RFID_03..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                {t('createGroup')}
              </button>
            </form>

            <div className="space-y-3">
              {groups.map(g => (
                <div key={g.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group/item transition-all hover:border-blue-200">
                  <div>
                    <h4 className="font-black text-slate-800 text-sm leading-none">{g.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{g.members.length} members</p>
                  </div>
                  <button onClick={() => onDeleteGroup(g.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Pricing Rules */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Target size={20} className="text-orange-500" />
              {t('addRule')}
            </h3>
            
            <form onSubmit={handleAddRule} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <LayoutGrid size={12}/> {t('targetType')}
                  </label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
                    value={targetType} 
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setTargetType(val);
                      if (val === 'DEFAULT') setTargetId('Default');
                      else setTargetId('');
                    }}
                  >
                    <option value="ACCOUNT">Individual Account</option>
                    <option value="GROUP">Account Group</option>
                    <option value="DEFAULT">System Default</option>
                  </select>
                </div>
                
                {targetType !== 'DEFAULT' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Target size={12}/> {t('targetEntity')}
                    </label>
                    {targetType === 'GROUP' ? (
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
                        value={targetId} 
                        onChange={(e) => setTargetId(e.target.value)}
                      >
                        <option value="">Select Group...</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    ) : (
                      <input 
                        type="text" required value={targetId} onChange={e => setTargetId(e.target.value)}
                        placeholder="RFID Tag or Account ID"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Zap size={12}/> {t('connector')}
                  </label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
                    value={connector} 
                    onChange={(e) => setConnector(e.target.value)}
                  >
                    <option value="">Any Connector...</option>
                    <option value="CCS2">CCS2 (DC)</option>
                    <option value="CHADEMO">CHAdeMO (DC)</option>
                    <option value="GBT">GB/T (DC)</option>
                    <option value="TYPE 2">Type 2 (AC)</option>
                    <option value="J1772">J1772 (AC)</option>
                  </select>
                </div>
                <TargetField label={t('ratePerKWh')} value={rate} onChange={setRate} placeholder="1200" icon={<DollarSign size={12}/>} type="number" />
              </div>

              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl text-xs font-black hover:bg-orange-700 transition shadow-lg shadow-orange-100">
                {t('addRule')}
              </button>
            </form>

            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group/item transition-all hover:border-orange-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${rule.targetType === 'ACCOUNT' ? 'bg-orange-50 text-orange-500' : rule.targetType === 'GROUP' ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'}`}>
                      {rule.targetType === 'ACCOUNT' ? <Target size={16} /> : rule.targetType === 'GROUP' ? <Users size={16} /> : <Activity size={16} />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm leading-none">
                        {rule.targetType === 'GROUP' ? groups.find(g => g.id === rule.targetId)?.name : rule.targetId}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        {rule.connector || 'All Connectors'} • <span className="text-orange-600">${rule.ratePerKWh}/kWh</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => onDeleteRule(rule.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {rules.length === 0 && (
                <div className="py-12 text-center text-slate-300 italic text-sm">{t('noRules')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigField = ({ label, value, onChange, placeholder, icon, type = "text" }: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string; 
  icon?: React.ReactNode; 
  type?: string 
}) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
      {icon} {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>
);

const TargetField = ({ label, value, onChange, placeholder, icon, type = "text" }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
      {icon} {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>
);

export default PricingSettings;
