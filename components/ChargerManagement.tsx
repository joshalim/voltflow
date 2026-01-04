
import React, { useState } from 'react';
import { EVCharger, Connector, Language, ChargerStatus, ConnectorStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  MapPin, 
  Activity, 
  Settings2, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Layers,
  Power,
  RefreshCw,
  Unlock,
  Radio
} from 'lucide-react';
import ConnectorIcon from './ConnectorIcon';

interface ChargerManagementProps {
  chargers: EVCharger[];
  onAddCharger: (charger: Omit<EVCharger, 'id' | 'createdAt'>) => void;
  onUpdateCharger: (id: string, updates: Partial<EVCharger>) => void;
  onDeleteCharger: (id: string) => void;
  lang: Language;
}

const CONNECTOR_TYPES = ['CCS2', 'CHADEMO', 'TYPE 2', 'J1772', 'GBT'];

const ChargerManagement: React.FC<ChargerManagementProps> = ({ 
  chargers, 
  onAddCharger, 
  onUpdateCharger, 
  onDeleteCharger, 
  lang 
}) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const [isAdding, setIsAdding] = useState(false);
  const [editingCharger, setEditingCharger] = useState<EVCharger | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<ChargerStatus>('ONLINE');
  const [connectors, setConnectors] = useState<Omit<Connector, 'id'>[]>([]);

  const resetForm = () => {
    setName('');
    setLocation('');
    setStatus('ONLINE');
    setConnectors([]);
    setIsAdding(false);
    setEditingCharger(null);
  };

  const startEdit = (charger: EVCharger) => {
    setEditingCharger(charger);
    setName(charger.name);
    setLocation(charger.location);
    setStatus(charger.status);
    setConnectors(charger.connectors);
    setIsAdding(true);
  };

  const handleAddConnector = () => {
    setConnectors([...connectors, { type: 'CCS2', powerKW: 50, status: 'AVAILABLE' }]);
  };

  const handleUpdateConnector = (index: number, updates: Partial<Connector>) => {
    const next = [...connectors];
    next[index] = { ...next[index], ...updates };
    setConnectors(next);
  };

  const handleRemoveConnector = (index: number) => {
    setConnectors(connectors.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const chargerData = {
      name,
      location,
      status,
      connectors: connectors.map((c, i) => ({ ...c, id: (c as Connector).id || `c-${i}-${Date.now()}` }))
    };

    if (editingCharger) {
      onUpdateCharger(editingCharger.id, chargerData);
    } else {
      onAddCharger(chargerData);
    }
    resetForm();
  };

  // Simulated Remote Actions
  const handleRemoteReboot = async (chargerId: string) => {
    setActionLoading(`reboot-${chargerId}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    onUpdateCharger(chargerId, { status: 'ONLINE' });
    setActionLoading(null);
    alert(`${t('reboot')} successful for ${chargerId}`);
  };

  const handleRemoteUnlock = async (chargerId: string, connectorId: string) => {
    setActionLoading(`unlock-${connectorId}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const charger = chargers.find(c => c.id === chargerId);
    if (charger) {
      const updatedConnectors = charger.connectors.map(c => 
        c.id === connectorId ? { ...c, status: 'AVAILABLE' as ConnectorStatus } : c
      );
      onUpdateCharger(chargerId, { connectors: updatedConnectors });
    }
    
    setActionLoading(null);
    alert(`${t('unlock')} successful`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('chargerManagement')}</h2>
          <p className="text-slate-500 font-medium">{t('chargerManagementSubtitle')}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-100"
        >
          <Plus size={20} />
          {t('addCharger')}
        </button>
      </header>

      {/* Grid of Chargers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chargers.map(charger => (
          <div key={charger.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group transition-all hover:border-orange-200">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-all duration-500 ${
                    charger.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 
                    charger.status === 'MAINTENANCE' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {actionLoading === `reboot-${charger.id}` ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <Activity size={20} className={charger.status === 'ONLINE' ? 'animate-pulse' : ''} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 leading-tight">{charger.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={10} className="text-orange-500" />
                      {charger.location || 'No Location'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(charger)} className="p-2 text-slate-300 hover:text-orange-500 transition-colors"><Edit3 size={16} /></button>
                  <button onClick={() => onDeleteCharger(charger.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100">
                <Radio size={14} className={charger.status === 'ONLINE' ? 'text-emerald-500' : 'text-slate-300'} />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('liveStatus')}</span>
                <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  charger.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}>{charger.status}</span>
              </div>

              {/* Connectors Status List */}
              <div className="space-y-2">
                {charger.connectors.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-50/50 border border-slate-100 p-3 rounded-2xl group/conn hover:bg-white transition-all">
                    <div className="flex items-center gap-3">
                      <ConnectorIcon type={c.type} size={18} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-700">{c.type}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{c.powerKW}kW</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'AVAILABLE' ? 'bg-emerald-500' :
                            c.status === 'CHARGING' ? 'bg-blue-500 animate-pulse' :
                            c.status === 'OCCUPIED' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{c.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Unlock Button */}
                    {c.status !== 'AVAILABLE' && (
                      <button 
                        onClick={() => handleRemoteUnlock(charger.id, c.id)}
                        disabled={actionLoading === `unlock-${c.id}`}
                        className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                        title={t('unlock')}
                      >
                        {actionLoading === `unlock-${c.id}` ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Unlock size={14} />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-auto px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={() => handleRemoteReboot(charger.id)}
                disabled={actionLoading === `reboot-${charger.id}`}
                className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-orange-600 transition-all uppercase tracking-widest"
              >
                <RefreshCw size={12} className={actionLoading === `reboot-${charger.id}` ? 'animate-spin' : ''} />
                {t('reboot')}
              </button>
              <span className="text-[10px] text-slate-400 font-bold">Updated: {new Date(charger.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {chargers.length === 0 && !isAdding && (
          <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
             <Settings2 size={48} className="mb-4 opacity-20" />
             <p className="font-bold">No chargers in network. Start by adding one.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl scale-in-center overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800">{editingCharger ? t('editCharger') : t('addCharger')}</h3>
                <p className="text-xs text-slate-400 mt-1">Configure charging station hardware and connectivity.</p>
              </div>
              <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('chargerName')}</label>
                    <input 
                      type="text" required value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Station-X1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('location')}</label>
                    <input 
                      type="text" value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Main Entrance, Level 1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Zap size={16} className="text-orange-500" />
                      {t('connectors')}
                    </h4>
                    <button 
                      type="button" 
                      onClick={handleAddConnector}
                      className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                    >
                      <Plus size={12} /> {t('addConnector')}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {connectors.map((connector, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-2">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('connectorType')}</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                              value={connector.type} 
                              onChange={e => handleUpdateConnector(idx, { type: e.target.value })}
                            >
                              {CONNECTOR_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('powerKW')}</label>
                            <input 
                              type="number" 
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                              value={connector.powerKW} 
                              onChange={e => handleUpdateConnector(idx, { powerKW: parseFloat(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('status')}</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                              value={connector.status} 
                              onChange={e => handleUpdateConnector(idx, { status: e.target.value as ConnectorStatus })}
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="CHARGING">Charging</option>
                              <option value="OCCUPIED">Occupied</option>
                              <option value="FAULTED">Faulted</option>
                            </select>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveConnector(idx)}
                          className="p-2 text-slate-300 hover:text-red-500 self-end md:self-center transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {connectors.length === 0 && (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">No connectors added yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('status')}</label>
                  <div className="flex gap-4">
                    {['ONLINE', 'OFFLINE', 'MAINTENANCE'].map(s => (
                      <button 
                        key={s} type="button" 
                        onClick={() => setStatus(s as ChargerStatus)}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${status === s ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all">
                    {editingCharger ? t('saveChanges') : t('addCharger')}
                  </button>
                  <button type="button" onClick={resetForm} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all">
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargerManagement;
