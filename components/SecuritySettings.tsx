
import React, { useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon, CheckCircle2, AlertTriangle, Key, Save, Plus, Trash2, Eye, Database, Globe, Network, Activity, RefreshCw, Server, Shield } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language, AuthConfig, UserRole, ViewOnlyAccount, PostgresConfig } from '../types';
import { databaseService } from '../services/databaseService';

interface SecuritySettingsProps {
  authConfig: AuthConfig;
  postgresConfig: PostgresConfig;
  onUpdateAuthConfig: (config: Partial<AuthConfig>) => void;
  onUpdatePostgresConfig: (config: Partial<PostgresConfig>) => void;
  lang: Language;
  role: UserRole;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ 
  authConfig, 
  postgresConfig,
  onUpdateAuthConfig, 
  onUpdatePostgresConfig,
  lang, 
  role 
}) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const [isPgTesting, setIsPgTesting] = useState(false);
  const [pgStatus, setPgStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [authStatus, setAuthStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleTestPostgres = async () => {
    setIsPgTesting(true);
    setPgStatus(null);
    try {
      const result = await databaseService.testPostgres(postgresConfig);
      if (result.success) {
        setPgStatus({ type: 'success', message: 'Database Connected Successfully' });
      } else {
        setPgStatus({ type: 'error', message: result.message || 'Connection Failed' });
      }
    } catch (e) {
      setPgStatus({ type: 'error', message: 'Network error contacting backend API' });
    } finally {
      setIsPgTesting(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStatus(null);

    if (role !== 'ADMIN') return;

    if (currentPass !== authConfig.adminPass) {
      setAuthStatus({ type: 'error', message: t('incorrectCurrentPass') });
      return;
    }
    if (newPass !== confirmPass) {
      setAuthStatus({ type: 'error', message: t('passwordsMismatch') });
      return;
    }
    onUpdateAuthConfig({ adminPass: newPass });
    setAuthStatus({ type: 'success', message: t('updateSuccess') });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-orange-500" />
          {t('security')}
        </h2>
        <p className="text-slate-500 font-medium">{t('securitySubtitle')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* PostgreSQL Core Configuration */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Database size={20} className="text-blue-600" />
                Infrastructure Storage
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Enable Postgres</span>
                <button 
                  onClick={() => onUpdatePostgresConfig({ isEnabled: !postgresConfig.isEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${postgresConfig.isEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${postgresConfig.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <ConfigField label="Host" value={postgresConfig.host} onChange={(v: string) => onUpdatePostgresConfig({ host: v })} placeholder="localhost" icon={<Globe size={12}/>} />
              
              <div className="grid grid-cols-2 gap-4">
                <ConfigField label="Port" value={postgresConfig.port.toString()} onChange={(v: string) => onUpdatePostgresConfig({ port: parseInt(v) || 5432 })} placeholder="5432" icon={<Network size={12}/>} />
                <ConfigField label="Database" value={postgresConfig.database} onChange={(v: string) => onUpdatePostgresConfig({ database: v })} placeholder="voltflow" icon={<Database size={12}/>} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ConfigField label="Username" value={postgresConfig.user} onChange={(v: string) => onUpdatePostgresConfig({ user: v })} placeholder="postgres" icon={<UserIcon size={12}/>} />
                <ConfigField label="Password" value={postgresConfig.pass} onChange={(v: string) => onUpdatePostgresConfig({ pass: v })} placeholder="••••••••" icon={<Key size={12}/>} type="password" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">SSL Connection</span>
                </div>
                <button 
                  onClick={() => onUpdatePostgresConfig({ ssl: !postgresConfig.ssl })}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${postgresConfig.ssl ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${postgresConfig.ssl ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={handleTestPostgres} 
              disabled={isPgTesting}
              className="w-full bg-blue-50 text-blue-700 py-4 rounded-2xl text-xs font-black hover:bg-blue-100 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {isPgTesting ? <RefreshCw className="animate-spin" size={16} /> : <Activity size={16} />}
              Verify Connection
            </button>

            {pgStatus && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                pgStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {pgStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {pgStatus.message}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Admin Credentials */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
              <Lock size={20} className="text-orange-500" />
              {t('updateCredentials')}
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('currentPassword')}</label>
                <input 
                  type="password" required value={currentPass} onChange={e => setCurrentPass(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('newPassword')}</label>
                  <input 
                    type="password" required value={newPass} onChange={e => setNewPass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('confirmPassword')}</label>
                  <input 
                    type="password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              {authStatus && (
                <div className={`p-4 rounded-xl text-xs font-bold ${
                  authStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {authStatus.message}
                </div>
              )}

              <button type="submit" className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition flex items-center justify-center gap-2">
                <Save size={18} />
                {t('saveChanges')}
              </button>
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
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default SecuritySettings;
