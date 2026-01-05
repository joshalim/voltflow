
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, MapPin, History, User as UserIcon, QrCode, 
  ArrowRight, Search, Battery, Clock, DollarSign, 
  ChevronRight, Navigation, ShieldCheck, Star,
  Bell, Settings, LogOut, Info, Activity, Monitor
} from 'lucide-react';
import { EVCharger, EVTransaction, User, Language, ConnectorStatus } from '../types';
import ConnectorIcon from './ConnectorIcon';

interface MobileAppProps {
  user: User;
  chargers: EVCharger[];
  transactions: EVTransaction[];
  lang: Language;
  onLogout: () => void;
  onExitPortal: () => void;
  onStartSession: (chargerId: string, connectorId: string) => void;
}

const MobileApp: React.FC<MobileAppProps> = ({ 
  user, 
  chargers, 
  transactions, 
  lang, 
  onLogout,
  onExitPortal,
  onStartSession
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'activity' | 'profile'>('home');
  const [isScanning, setIsScanning] = useState(false);
  
  const activeSession = useMemo(() => {
    return transactions.find(tx => tx.account === (user.rfidTag || user.name) && tx.status === 'UNPAID');
  }, [transactions, user.rfidTag, user.name]);

  const userTransactions = useMemo(() => {
    return transactions.filter(tx => tx.account === (user.rfidTag || user.name)).sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [transactions, user.rfidTag, user.name]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Header */}
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 p-1.5 rounded-lg">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tighter">VoltFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-slate-100 rounded-full text-slate-400 relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-xs">
            {user.name.charAt(0)}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 px-6 pt-6">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Greeting */}
            <div>
              <h1 className="text-2xl font-black text-slate-800">Hello, {user.name.split(' ')[0]}!</h1>
              <p className="text-slate-400 text-sm font-medium">Ready for a charge today?</p>
            </div>

            {/* Active Session Card */}
            {activeSession ? (
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Zap size={120} className="text-orange-500" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Session</span>
                    <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-[8px] font-black animate-pulse">LIVE</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <h2 className="text-4xl font-black">{activeSession.meterKWh.toFixed(2)}</h2>
                    <span className="text-slate-400 font-bold mb-1">kWh</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cost</p>
                      <p className="text-sm font-bold">${new Intl.NumberFormat().format(activeSession.costCOP)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration</p>
                      <p className="text-sm font-bold">{activeSession.durationMinutes} min</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsScanning(true)}
                className="w-full bg-orange-600 rounded-[2rem] p-6 text-white shadow-xl shadow-orange-100 flex items-center justify-between group transition-transform active:scale-95"
              >
                <div className="text-left">
                  <h2 className="text-xl font-black">Scan to Charge</h2>
                  <p className="text-orange-100 text-xs font-medium">Point at station QR code</p>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl">
                  <QrCode size={32} />
                </div>
              </button>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="p-2 bg-blue-50 rounded-xl w-fit text-blue-500 mb-3">
                  <Battery size={20} />
                </div>
                <p className="text-2xl font-black text-slate-800">420<span className="text-xs ml-1 text-slate-400">kWh</span></p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Usage</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="p-2 bg-emerald-50 rounded-xl w-fit text-emerald-500 mb-3">
                  <DollarSign size={20} />
                </div>
                <p className="text-2xl font-black text-slate-800">12k<span className="text-xs ml-1 text-slate-400">Pts</span></p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VoltPoints</p>
              </div>
            </div>

            {/* Nearby Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800">Nearby Stations</h3>
                <button className="text-xs font-bold text-orange-600">View All</button>
              </div>
              <div className="space-y-3">
                {chargers.slice(0, 3).map(charger => (
                  <div key={charger.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${charger.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{charger.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">1.2 km away</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <span className={`text-[10px] font-bold ${charger.status === 'ONLINE' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {charger.status === 'ONLINE' ? 'Available' : 'Busy'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-full space-y-6 animate-in fade-in duration-500">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Find a charger..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
              />
            </div>
            {/* Mock Map View */}
            <div className="aspect-[4/5] bg-slate-200 rounded-[2.5rem] relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 opacity-40 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i14!2i4823!3i6155!2m3!1e0!2sm!3i605151528!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!5f2')] bg-cover"></div>
               {chargers.map((c, i) => (
                 <div 
                   key={c.id} 
                   className={`absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center rounded-full border-4 border-white shadow-xl ${c.status === 'ONLINE' ? 'bg-orange-600' : 'bg-slate-400'}`}
                   style={{ top: `${20 + (i * 15)}%`, left: `${30 + (i * 20)}%` }}
                 >
                   <Zap size={16} className="text-white" />
                 </div>
               ))}
               <div className="absolute bottom-6 left-6 right-6">
                 <div className="bg-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Station</p>
                      <h4 className="font-black text-slate-800">{chargers[0]?.name || 'Volt Station #1'}</h4>
                    </div>
                    <button className="bg-orange-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2">
                      <Navigation size={14} /> Go
                    </button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <h2 className="text-2xl font-black text-slate-800">History</h2>
             <div className="space-y-4">
                {userTransactions.map(tx => (
                  <div key={tx.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-50 text-slate-500 rounded-2xl">
                          <ConnectorIcon type={tx.connector} size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{tx.station}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{new Date(tx.startTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${tx.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-50">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Energy</p>
                        <p className="text-xs font-black text-slate-700">{tx.meterKWh.toFixed(1)} kWh</p>
                      </div>
                      <div className="text-center border-x border-slate-50">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Time</p>
                        <p className="text-xs font-black text-slate-700">{tx.durationMinutes}m</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total</p>
                        <p className="text-xs font-black text-orange-600">${new Intl.NumberFormat().format(tx.costCOP)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {userTransactions.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-300 text-center space-y-4">
                    <History size={48} className="opacity-20" />
                    <p className="font-bold text-sm">No charging activity found yet.</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col items-center py-6">
              <div className="w-24 h-24 rounded-[2.5rem] bg-orange-100 border-4 border-white shadow-xl flex items-center justify-center text-orange-600 text-3xl font-black mb-4">
                {user.name.charAt(0)}
              </div>
              <h2 className="text-xl font-black text-slate-800">{user.name}</h2>
              <p className="text-slate-400 font-medium text-sm">{user.email}</p>
            </div>

            <div className="space-y-3">
               <ProfileMenuItem icon={<UserIcon size={20} />} label="Personal Information" />
               <ProfileMenuItem icon={<DollarSign size={20} />} label="Payment Methods" badge="3 Cards" />
               <ProfileMenuItem icon={<Monitor size={20} />} label="Exit Driver Portal" onClick={onExitPortal} />
               <ProfileMenuItem icon={<Settings size={20} />} label="App Settings" />
               <ProfileMenuItem icon={<Info size={20} />} label="Help & Support" />
            </div>

            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-4 text-rose-500 font-black text-sm bg-rose-50 rounded-2xl active:scale-95 transition-all mt-6"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex items-center justify-between z-50">
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Zap size={22} />} label="Home" />
        <NavButton active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<MapPin size={22} />} label="Nearby" />
        <div className="relative -top-8">
           <button 
             onClick={() => setIsScanning(true)}
             className="w-16 h-16 bg-orange-600 rounded-full shadow-2xl shadow-orange-200 border-4 border-white flex items-center justify-center text-white transition-transform active:scale-90"
           >
             <QrCode size={28} />
           </button>
        </div>
        <NavButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={<Activity size={22} />} label="Activity" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon size={22} />} label="Profile" />
      </nav>

      {/* QR Scanner Simulation Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col animate-in fade-in duration-300">
          <div className="p-8 flex items-center justify-between text-white">
            <h3 className="font-black text-lg">Scan Station QR</h3>
            <button onClick={() => setIsScanning(false)} className="p-2 bg-white/10 rounded-xl">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="w-full aspect-square border-2 border-orange-500 rounded-[3rem] relative">
              <div className="absolute inset-0 bg-white/5 animate-pulse rounded-[3rem]"></div>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-2xl"></div>
              
              <div className="absolute inset-4 flex flex-col items-center justify-center gap-4">
                 <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Searching...</p>
                 <div className="space-y-2">
                    {chargers.slice(0, 2).map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => {
                          onStartSession(c.id, c.connectors[0].id);
                          setIsScanning(false);
                          setActiveTab('home');
                        }}
                        className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-bold text-xs hover:bg-white/30 transition-all flex items-center gap-3"
                      >
                        <Zap size={14} className="text-orange-500" />
                        Detect: {c.name}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </div>
          <div className="p-12 text-center text-white/50 text-sm font-medium">
             Center the QR code within the frame to automatically start charging.
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <div className={active ? 'scale-110' : ''}>{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const ProfileMenuItem = ({ icon, label, badge, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50 transition-colors cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="text-slate-400">{icon}</div>
      <span className="font-bold text-slate-700 text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge && <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">{badge}</span>}
      <ChevronRight size={18} className="text-slate-300" />
    </div>
  </div>
);

const X = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default MobileApp;
