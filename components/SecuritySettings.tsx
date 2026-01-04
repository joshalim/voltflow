
import React, { useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon, CheckCircle2, AlertTriangle, Key, Save, Plus, Trash2, Eye } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language, AuthConfig, UserRole, ViewOnlyAccount } from '../types';

interface SecuritySettingsProps {
  authConfig: AuthConfig;
  onUpdateAuthConfig: (config: Partial<AuthConfig>) => void;
  lang: Language;
  role: UserRole;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ authConfig, onUpdateAuthConfig, lang, role }) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  // Own Password Update State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // View-Only Account Management State
  const [newViewUser, setNewViewUser] = useState('');
  const [newViewPass, setNewViewPass] = useState('');

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // If changing ADMIN password, we need the current ADMIN password.
    // If a VIEW-ONLY user somehow gets here, they can only change THEIR specific password.
    // However, for simplicity in this shared-local-DB app, we check against the Admin or just the first match if view-only.
    const actualCurrentPass = role === 'ADMIN' ? authConfig.adminPass : '---'; // USER password changes are managed by ADMIN now

    if (role === 'ADMIN') {
      if (currentPass !== actualCurrentPass) {
        setStatus({ type: 'error', message: t('incorrectCurrentPass') });
        return;
      }
      if (newPass !== confirmPass) {
        setStatus({ type: 'error', message: t('passwordsMismatch') });
        return;
      }
      onUpdateAuthConfig({ adminPass: newPass });
      setStatus({ type: 'success', message: t('updateSuccess') });
    } else {
      setStatus({ type: 'error', message: 'Standard users must contact Admin to change passwords.' });
    }

    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const handleAddViewOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewUser || !newViewPass) return;
    
    const nextAccounts = [
      ...authConfig.viewOnlyAccounts,
      { id: Date.now().toString(), user: newViewUser, pass: newViewPass }
    ];
    onUpdateAuthConfig({ viewOnlyAccounts: nextAccounts });
    setNewViewUser('');
    setNewViewPass('');
  };

  const handleDeleteViewOnly = (id: string) => {
    if (confirm('Are you sure you want to remove this account?')) {
      const nextAccounts = authConfig.viewOnlyAccounts.filter(acc => acc.id !== id);
      onUpdateAuthConfig({ viewOnlyAccounts: nextAccounts });
    }
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
          {/* Admin Password Update */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Lock size={20} className="text-orange-500" />
                {t('updateCredentials')}
              </h3>
              <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-orange-100 text-orange-700">
                {t('adminAccount')}
              </span>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username')}</label>
                <input 
                  type="text"
                  disabled
                  className="w-full pl-4 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 outline-none"
                  value={authConfig.adminUser}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('currentPassword')}</label>
                <input 
                  type="password"
                  required
                  disabled={role !== 'ADMIN'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:opacity-50"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('newPassword')}</label>
                  <input 
                    type="password"
                    required
                    disabled={role !== 'ADMIN'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:opacity-50"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('confirmPassword')}</label>
                  <input 
                    type="password"
                    required
                    disabled={role !== 'ADMIN'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:opacity-50"
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

              {role === 'ADMIN' && (
                <button 
                  type="submit"
                  className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg shadow-slate-100 hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Save size={18} />
                  {t('saveChanges')}
                </button>
              )}
            </form>
          </div>

          <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100">
              <h4 className="font-black text-orange-900 mb-2 flex items-center gap-2">
                <ShieldCheck size={18} />
                Access Control Policy
              </h4>
              <p className="text-xs text-orange-800 leading-relaxed font-medium">
                Admin credentials provide full infrastructure orchestration rights. View-only accounts have strictly restricted access. Use strong, unique passwords for each account type.
              </p>
           </div>
        </div>

        {/* View-Only Accounts Management (Admin Only) */}
        {role === 'ADMIN' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <header>
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Eye size={20} className="text-blue-500" />
                {t('viewOnlyAccounts')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{t('viewOnlyAccountsSubtitle')}</p>
            </header>

            <form onSubmit={handleAddViewOnly} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username')}</label>
                  <input 
                    type="text" required value={newViewUser} onChange={e => setNewViewUser(e.target.value)}
                    placeholder="e.g. auditor"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" required value={newViewPass} onChange={e => setNewViewPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="space-y-3">
              {authConfig.viewOnlyAccounts.map(acc => (
                <div key={acc.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                      <UserIcon size={18} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm leading-none">{acc.user}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Standard Viewer</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteViewOnly(acc.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {authConfig.viewOnlyAccounts.length === 0 && (
                <div className="py-12 text-center text-slate-300 italic text-sm">No view-only accounts defined.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
