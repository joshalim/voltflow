
import React, { useState } from 'react';
import { PricingRule, AccountGroup, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Trash2, Info, Edit3, Check, X, Users, User, LayoutGrid, Target } from 'lucide-react';

interface PricingSettingsProps {
  rules: PricingRule[];
  groups: AccountGroup[];
  onAddRule: (rule: Omit<PricingRule, 'id'>) => void;
  onUpdateRule: (id: string, rule: Partial<PricingRule>) => void;
  onDeleteRule: (id: string) => void;
  onAddGroup: (group: Omit<AccountGroup, 'id'>) => void;
  onUpdateGroup: (id: string, updates: Partial<AccountGroup>) => void;
  onDeleteGroup: (id: string) => void;
  lang: Language;
}

const PricingSettings: React.FC<PricingSettingsProps> = ({ 
  rules, 
  groups, 
  onAddRule, 
  onUpdateRule, 
  onDeleteRule, 
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
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
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('pricingRules')}</h2>
        <p className="text-slate-500 font-medium">{t('pricingRulesSubtitle')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Users size={20} className="text-orange-500" />
              {t('accountGroupings')}
            </h3>
            
            <form onSubmit={handleAddGroup} className="space-y-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('account')} {t('year')}</label>
                  <input 
                    type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
                    placeholder="e.g. VIP Fleet"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 invisible">Action</label>
                  <button type="submit" className="w-full bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-900 transition">
                    {t('createGroup')}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member Accounts (Comma separated)</label>
                <textarea 
                  value={groupMembers} onChange={e => setGroupMembers(e.target.value)}
                  placeholder="John Doe, Account-123..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium h-16 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </form>

            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><LayoutGrid size={16} /></div>
                      <h4 className="font-black text-slate-800">{group.name}</h4>
                    </div>
                    <button onClick={() => onDeleteGroup(group.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.members.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md border border-slate-200">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Target size={20} className="text-orange-500" />
              {t('pricingRules')}
            </h3>

            <form onSubmit={handleAddRule} className="space-y-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('targetType')}</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                      value={targetType} onChange={e => setTargetType(e.target.value as any)}
                    >
                      <option value="ACCOUNT">Specific Account</option>
                      <option value="GROUP">Account Group</option>
                      <option value="DEFAULT">Global Default</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('targetEntity')}</label>
                    {targetType === 'GROUP' ? (
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                        value={targetId} onChange={e => setTargetId(e.target.value)}
                      >
                        <option value="">Select Group</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    ) : targetType === 'ACCOUNT' ? (
                      <input 
                        type="text" value={targetId} onChange={e => setTargetId(e.target.value)}
                        placeholder="Account name"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <input disabled value="Global" className="w-full bg-slate-200 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-400" />
                    )}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('connector')}</label>
                    <input 
                      type="text" value={connector} onChange={e => setConnector(e.target.value)}
                      placeholder="e.g. CCS2"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('rate')} ($COP)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" value={rate} onChange={e => setRate(e.target.value)}
                        placeholder="1800"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button type="submit" className="bg-orange-600 text-white p-2 rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-100 transition"><Plus size={20} /></button>
                    </div>
                  </div>
               </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-3 px-2">{t('account')}</th>
                    <th className="pb-3 px-2">{t('connector')}</th>
                    <th className="pb-3 px-2">{t('rate')}</th>
                    <th className="pb-3 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-800 text-xs">
                          {rule.targetType === 'GROUP' ? groups.find(g => g.id === rule.targetId)?.name || 'Unknown' : rule.targetId}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-600">{rule.connector}</span>
                      </td>
                      <td className="py-3 px-2 font-black text-orange-600 text-xs">${rule.ratePerKWh.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => onDeleteRule(rule.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex gap-4">
        <div className="bg-blue-500 p-2 rounded-xl text-white h-fit"><Info size={24} /></div>
        <div className="space-y-1">
          <h4 className="font-black text-blue-900">{t('howPricingCalculated')}</h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            When a transaction is imported, VoltFlow looks for a match in this order: 
            <br />
            <strong>1. Specific Account Rules</strong> → 
            <strong>2. Account Group Rules</strong> → 
            <strong>3. Global Default.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingSettings;
