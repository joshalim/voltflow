
import React, { useState } from 'react';
import { Zap, User as UserIcon, Lock, ArrowRight, AlertCircle, Globe } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language, AuthConfig, UserRole } from '../types';

interface LoginProps {
  authConfig: AuthConfig;
  lang: Language;
  onLangChange: (lang: Language) => void;
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ authConfig, lang, onLangChange, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Artificial delay for UX
    setTimeout(() => {
      // Check Admin
      if (username === authConfig.adminUser && password === authConfig.adminPass) {
        onLogin('ADMIN');
      } 
      // Check all view-only accounts
      else if (authConfig.viewOnlyAccounts.some(acc => acc.user === username && acc.pass === password)) {
        onLogin('USER');
      } 
      else {
        setError(t('invalidCredentials'));
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-orange-500 p-4 rounded-3xl shadow-xl shadow-orange-200 mb-6 group transition-transform hover:scale-110">
              <Zap className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-800">
              <span className="text-orange-600">SMART</span>
              <span className="ml-1">Charge</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">CMS Management Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input 
                  type="text"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="e.g. smartcharge"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 text-xs font-bold animate-in slide-in-from-top-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg shadow-slate-100 hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('login')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
              <button 
                onClick={() => onLangChange('en')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${lang === 'en' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
              >
                ENG
              </button>
              <button 
                onClick={() => onLangChange('es')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${lang === 'es' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
              >
                ESP
              </button>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
               <Globe size={14} />
               <span className="text-[10px] font-bold uppercase tracking-tighter">Global CMS v1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
