
import React, { useState } from 'react';
import { PricingRule, AccountGroup, Language, ApiConfig, OcppConfig, OcpiConfig } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Trash2, Users, LayoutGrid, Target, Link2, Key, Globe, Network, Activity, Download, Zap, DollarSign, Server, ShieldCheck, Link } from 'lucide-react';

interface PricingSettingsProps {
  rules: PricingRule[];
  groups: AccountGroup[];
  apiConfig: ApiConfig;
  ocppConfig: OcppConfig;
  ocpiConfig: OcpiConfig;
  onAddRule: (rule: Omit<PricingRule, 'id'>) => void;
  onUpdateRule: (id: string, rule: Partial<PricingRule>) => void;
  onDeleteRule: (id: string) => void;
  onAddGroup: (group: Omit<AccountGroup, 'id'>) => void;
  onUpdateGroup: (id: string, updates: Partial<AccountGroup>) => void;
  onDeleteGroup: (id: string) => void;
  onUpdateApiConfig: (config: Partial<ApiConfig>) => void;
  onUpdateOcppConfig: (config: Partial<OcppConfig>) => void;
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
  ocpiConfig,
  onAddRule, 
  onDeleteRule, 
  onAddGroup,
  onDeleteGroup,
  onUpdateOcpiConfig,
  onUpdateOcppConfig,
  onExportBackup,
  lang 
}) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  
  const [targetType, setTargetType] = useState<'ACCOUNT' | 'GROUP' | 'DEFAULT'>('ACCOUNT');
  const [targetId, setTargetId] = useState('');
  const [connector, setConnector] = useState('');
  const [rate, setRate] = useState('');

  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');

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
        <button onClick={onExportBackup} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition">
          <Download size={14} /> Backup JSON
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* OCPP Core Config */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Server size={20} className="text-orange-500" />
              {t('ocppIntegration')} Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConfigField label="Server Domain" value={ocppConfig.domain} onChange={(v: string) => onUpdateOcppConfig({ domain: v })} placeholder="ocpp.voltflow.io" icon={<Globe size={12}/>} />
              <ConfigField label="Server Port" value={ocppConfig.port.toString()} onChange={(v: string) => onUpdateOcppConfig({ port: parseInt(v) || 3085 })} placeholder="3085" icon={<Network size={12}/>} />
            </div>
            
            <ConfigField label="WebSocket Path" value={ocppConfig.path} onChange={(v: string) => onUpdateOcppConfig({ path: v })} placeholder="/ocpp" icon={<Link2 size={12}/>} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConfigField label="CMS Identity" value={ocppConfig.identity} onChange={(v: string) => onUpdateOcppConfig({ identity: v })} placeholder="VF-NOC-01" icon={<ShieldCheck size={12}/>} />
              <ConfigField label="Reference URL" value={ocppConfig.referenceUrl} onChange={(v: string) => onUpdateOcppConfig({ referenceUrl: v })} placeholder="https://docs..." icon={<Link size={12}/>} />
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Provisioning Hint</p>
              <code className="text-[11px] font-mono break-all text-slate-600">
                ws://{ocppConfig.domain}:{ocppConfig.port}{ocppConfig.path}/[ChargerID]
              </code>
            </div>
          </div>

          {/* OCPI Roaming Settings */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
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
                  <ConfigField label={t('ocpiUrl')} value={ocpiConfig.baseUrl} onChange={(v: string) => onUpdateOcpiConfig({ baseUrl: v })} icon={<Link2 size={12}/>} />
                  <div className="grid grid-cols-2 gap-4">
                    <ConfigField label={t('partyId')} value={ocpiConfig.partyId} onChange={(v: string) => onUpdateOcpiConfig({ partyId: v })} icon={<Target size={12}/>} />
                    <ConfigField label={t('countryCode')} value={ocpiConfig.countryCode} onChange={(v: string) => onUpdateOcpiConfig({ countryCode: v })} icon={<Globe size={12}/>} />
                  </div>
                  <ConfigField label={t('ocpiToken')} value={ocpiConfig.token} onChange={(v: string) => onUpdateOcpiConfig({ token: v })} icon={<Key size={12}/>} type="password" />
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Pricing Rules */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <DollarSign size={20} className="text-orange-500" />
              Billing Tier Logic
            </h3>
            
            <form onSubmit={handleAddRule} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 mb-8">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Target Type</label>
                    <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" value={targetType} onChange={(e) => setTargetType(e.target.value as any)}>
                      <option value="ACCOUNT">Individual</option>
                      <option value="GROUP">Group</option>
                      <option value="DEFAULT">Default</option>
                    </select>
                  </div>
                  {targetType !== 'DEFAULT' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Identity</label>
                      <input type="text" value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                    </div>
                  )}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Rate (COP/kWh)</label>
                    <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1 flex items-end">
                    <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-xl text-xs font-black hover:bg-orange-700 transition shadow-lg shadow-orange-100">Add Rule</button>
                  </div>
               </div>
            </form>

            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group transition-all hover:border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Zap size={14}/></div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{rule.targetId}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${rule.ratePerKWh}/kWh</p>
                    </div>
                  </div>
                  <button onClick={() => onDeleteRule(rule.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Account Groupings */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              Member Groupings
            </h3>
            <form onSubmit={handleAddGroup} className="space-y-4">
               <ConfigField label="Group Name" value={groupName} onChange={setGroupName} placeholder="Logistics Fleet" />
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member IDs</label>
                 <textarea value={groupMembers} onChange={e => setGroupMembers(e.target.value)} placeholder="ID1, ID2, ID3..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-medium outline-none h-24" />
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-2xl text-xs font-black hover:bg-blue-700 transition shadow-lg shadow-blue-100">Create Group</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigField = ({ label, value, onChange, placeholder, icon, type = "text" }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
      {icon} {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>
);

export default PricingSettings;
