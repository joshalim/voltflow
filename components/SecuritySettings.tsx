
import React, { useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon, CheckCircle2, AlertTriangle, Key, Save } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language, AuthConfig, UserRole } from '../types';

interface SecuritySettingsProps {
  authConfig: AuthConfig;
  onUpdateAuthConfig: (config: Partial<AuthConfig>) => void;
  lang: Language;
  role: UserRole;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ authConfig, onUpdateAuthConfig, lang, role }) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const actualCurrentPass = role === 'ADMIN' ? authConfig.adminPass : authConfig.genericPass;

    if (currentPass !== actualCurrentPass) {
      setStatus({ type: 'error', message: t('incorrectCurrentPass') });
      return;
    }

    if (newPass !== confirmPass) {
      setStatus({ type: 'error', message: t('passwordsMismatch') });
      return;
    }

    if (role === 'ADMIN') {
      onUpdateAuthConfig({ adminPass: newPass });
    } else {
      onUpdateAuthConfig({ genericPass: newPass });
    }

    setStatus({ type: 'success', message: t('updateSuccess') });
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
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Lock size={20} className="text-orange-500" />
              {t('updateCredentials')}
            </h3>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
              {role === 'ADMIN' ? t('adminAccount') : t('userAccount')}
            </span>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <UserIcon size={18} />
                </div>
                <input 
                  type="text"
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 outline-none"
                  value={role === 'ADMIN' ? authConfig.adminUser : authConfig.genericUser}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('currentPassword')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors">
                  <Key size={18} />
                </div>
                <input 
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('newPassword')}</label>
                <input 
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('confirmPassword')}</label>
                <input 
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
              </div>
            </div>

            {status && (
              <div className={`flex items-center gap-2 p-4 rounded-xl border text-xs font-bold animate-in slide-in-from-top-2 ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {status.message}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg shadow-slate-100 hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Save size={18} />
              {t('saveChanges')}
            </button>
          </form>
        </div>

        <div className="space-y-6">
           <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100">
              <h4 className="font-black text-orange-900 mb-2 flex items-center gap-2">
                <ShieldCheck size={18} />
                Access Control Policy
              </h4>
              <p className="text-xs text-orange-800 leading-relaxed font-medium">
                Changing your password will take effect immediately. Ensure you communicate generic user password changes to authorized staff members. Admin credentials provide full infrastructure orchestration rights.
              </p>
           </div>
           
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl text-slate-300">
                 <Lock size={32} />
              </div>
              <div>
                 <h4 className="font-black text-slate-800">Session Security</h4>
                 <p className="text-xs text-slate-500 font-medium">Your account session is active. Always remember to log out when using public or shared computers.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
