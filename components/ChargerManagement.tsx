
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
  Radio,
  Cpu,
  Clock,
  LayoutGrid,
  Monitor,
  Database
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
  const [vendor, setVendor] = useState('');
  const [model, setModel] = useState('');
  const [firmware, setFirmware] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [connectors, setConnectors] = useState<Omit<Connector, 'id'>[]>([]);

  const resetForm = () => {
    setName('');
    setLocation('');
    setStatus('ONLINE');
    setVendor('');
    setModel('');
    setFirmware('');
    setIpAddress('');
    setConnectors([]);
    setIsAdding(false);
    setEditingCharger(null);
  };

  const startEdit = (charger: EVCharger) => {
    setEditingCharger(charger);
    setName(charger.name);
    setLocation(charger.location);
    setStatus(charger.status);
    setVendor(charger.vendor || '');
    setModel(charger.model || '');
    setFirmware(charger.firmwareVersion || '');
    setIpAddress(charger.ipAddress || '');
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
      vendor,
      model,
      firmwareVersion: firmware,
      ipAddress,
      connectors: connectors.map((c, i) => ({ ...c, id: (c as Connector).id || `c-${i}-${Date.now()}` }))
    };

    if (editingCharger) {
      onUpdateCharger(editingCharger.id, chargerData);
    } else {
      onAddCharger(chargerData);
    }
    resetForm();
  };

  const getConnectorColor = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('CCS')) return 'bg-orange-50 text-orange-600 border-orange-100';
    if (t.includes('CHADEMO')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (t.includes('GBT')) return 'bg-purple-50 text-purple-600 border-purple-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('chargerList')}</h2>
          <p className="text-slate-500 font-medium">Manage and configure physical charging hardware assets.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-100"
        >
          <Plus size={20} />
          {t('addCharger')}
        </button>
      </header>

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
                    <Activity size={20} className={charger.status === 'ONLINE' ? 'animate-pulse' : ''} />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{t('vendor')}</span>
                  <p className="text-[11px] font-bold text-slate-800 truncate">{charger.vendor || '---'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Model</span>
                  <p className="text-[11px] font-bold text-slate-800 truncate">{charger.model || '---'}</p>
                </div>
              </div>

              <div className="space-y-2">
                {charger.connectors.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${getConnectorColor(c.type)}`}>
                        <ConnectorIcon type={c.type} size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-700">{c.type}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{c.status}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-700">{c.powerKW}kW</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                 <Monitor size={10} /> {charger.ipAddress || 'DHCP'}
               </span>
               <span className="text-[9px] font-bold text-slate-400">{charger.firmwareVersion || 'v1.0.0'}</span>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{editingCharger ? t('editCharger') : t('addCharger')}</h3>
                <p className="text-sm text-slate-400 mt-1 font-medium">Complete hardware specification and network provisioning.</p>
              </div>
              <button onClick={resetForm} className="p-3 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormGroup label={t('chargerName')} value={name} onChange={setName} placeholder="ST-CORE-01" required />
                  <FormGroup label={t('location')} value={location} onChange={setLocation} placeholder="North Parking, B2" />
                  <FormGroup label={t('vendor')} value={vendor} onChange={setVendor} placeholder="ABB / Delta / Schneider" />
                  <FormGroup label="Model" value={model} onChange={setModel} placeholder="Terra 54 / CityCharge" />
                  <FormGroup label="Firmware Version" value={firmware} onChange={setFirmware} placeholder="v3.4.12-release" />
                  <FormGroup label="Local IP Address" value={ipAddress} onChange={setIpAddress} placeholder="192.168.1.100" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Layers size={16} className="text-orange-500" />
                      {t('connectors')} Configuration
                    </h4>
                    <button type="button" onClick={handleAddConnector} className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                      <Plus size={12} /> {t('addConnector')}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connectors.map((connector, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-5 space-y-4 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                           <span className="text-[10px] font-black text-slate-400 uppercase">Connector #{idx + 1}</span>
                           <button type="button" onClick={() => handleRemoveConnector(idx)} className="text-rose-400 hover:text-rose-600 transition-colors">
                             <Trash2 size={16} />
                           </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Type</label>
                            <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" value={connector.type} onChange={e => handleUpdateConnector(idx, { type: e.target.value })}>
                              {CONNECTOR_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Power (kW)</label>
                              <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" value={connector.powerKW} onChange={e => handleUpdateConnector(idx, { powerKW: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Initial Status</label>
                              <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" value={connector.status} onChange={e => handleUpdateConnector(idx, { status: e.target.value as ConnectorStatus })}>
                                <option value="AVAILABLE">Available</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="UNAVAILABLE">Unavailable</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all">
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

const FormGroup = ({ label, value, onChange, placeholder, required = false }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label} {required && '*'}</label>
    <input 
      type="text" required={required} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
    />
  </div>
);

export default ChargerManagement;
