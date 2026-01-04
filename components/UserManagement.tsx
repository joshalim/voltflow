
import React, { useState, useRef } from 'react';
import { User, Language, UserType } from '../types';
import { TRANSLATIONS } from '../constants';
import { UserPlus, Trash2, Edit3, X, Fingerprint, ShieldCheck, Mail, User as UserIcon, Building2, Hash, Car, Layers, Phone, Briefcase, UserCircle, Download, Upload } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onImportUsers: (newUsers: Omit<User, 'id' | 'createdAt'>[]) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  lang: Language;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  onAddUser, 
  onImportUsers,
  onUpdateUser, 
  onDeleteUser, 
  lang 
}) => {
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Registration state
  const [userType, setUserType] = useState<UserType>('PERSONAL');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cedula: '',
    nit: '',
    company: '',
    rfidTag: '',
    placa: ''
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    const { name, email, phone, cedula, nit, company, rfidTag } = formData;
    
    // Global obligatory fields
    if (!name || !email || !phone || !rfidTag) return false;

    // Type specific obligatory fields
    if (userType === 'PERSONAL' && !cedula) return false;
    if (userType === 'BUSINESS' && (!nit || !company)) return false;

    return true;
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert("Please fill all obligatory fields.");
      return;
    }
    
    onAddUser({ 
      ...formData, 
      userType, 
      status: 'ACTIVE' 
    });

    // Reset
    setFormData({
      name: '',
      email: '',
      phone: '',
      cedula: '',
      nit: '',
      company: '',
      rfidTag: '',
      placa: ''
    });
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'UserType', 'Cedula', 'NIT', 'Company', 'RFID', 'Placa', 'Status'];
    const rows = users.map(u => [
      u.name,
      u.email,
      u.phone,
      u.userType,
      u.cedula || '',
      u.nit || '',
      u.company || '',
      u.rfidTag,
      u.placa || '',
      u.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.replace(/^"(.*)"$/, '$1').trim().toLowerCase());
      const newUsers: Omit<User, 'id' | 'createdAt'>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
        
        const userObj: any = { status: 'ACTIVE' };
        headers.forEach((h, idx) => {
          if (h === 'name') userObj.name = row[idx];
          if (h === 'email') userObj.email = row[idx];
          if (h === 'phone') userObj.phone = row[idx];
          if (h === 'usertype') userObj.userType = (row[idx].toUpperCase() === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL');
          if (h === 'cedula') userObj.cedula = row[idx];
          if (h === 'nit') userObj.nit = row[idx];
          if (h === 'company') userObj.company = row[idx];
          if (h === 'rfid') userObj.rfidTag = row[idx];
          if (h === 'placa') userObj.placa = row[idx];
          if (h === 'status') userObj.status = (row[idx].toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
        });

        if (userObj.name && userObj.rfidTag) {
          newUsers.push(userObj);
        }
      }

      if (newUsers.length > 0) {
        onImportUsers(newUsers);
        alert(`Successfully imported ${newUsers.length} users.`);
      } else {
        alert("No valid users found in CSV.");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('userManagement')}</h2>
        <p className="text-slate-500 font-medium">{t('userManagementSubtitle')}</p>
      </header>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <UserPlus size={20} className="text-orange-500" />
            {t('addUser')}
          </h3>
          
          <div className="flex flex-wrap gap-2 md:items-center">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mr-4">
              <button 
                onClick={() => setUserType('PERSONAL')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${userType === 'PERSONAL' ? 'bg-white shadow-sm text-orange-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <UserCircle size={16} />
                {t('personalUser')}
              </button>
              <button 
                onClick={() => setUserType('BUSINESS')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${userType === 'BUSINESS' ? 'bg-white shadow-sm text-orange-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Briefcase size={16} />
                {t('businessUser')}
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
              >
                <Upload size={14} className="text-blue-500" />
                {t('importUsers')}
              </button>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept=".csv" 
                onChange={handleImportCSV} 
              />
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
              >
                <Download size={14} className="text-emerald-500" />
                {t('exportUsers')}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormGroup label={t('userName')} name="name" value={formData.name} onChange={handleInputChange} icon={<UserIcon size={14} />} placeholder="Juan Perez" required />
            <FormGroup label={t('userEmail')} name="email" type="email" value={formData.email} onChange={handleInputChange} icon={<Mail size={14} />} placeholder="juan@mail.com" required />
            <FormGroup label={t('contactNumber')} name="phone" value={formData.phone} onChange={handleInputChange} icon={<Phone size={14} />} placeholder="+57 300..." required />
            
            {userType === 'PERSONAL' ? (
              <FormGroup label={t('cedula')} name="cedula" value={formData.cedula} onChange={handleInputChange} icon={<Hash size={14} />} placeholder="1090..." required />
            ) : (
              <>
                <FormGroup label={t('nit')} name="nit" value={formData.nit} onChange={handleInputChange} icon={<Building2 size={14} />} placeholder="900..." required />
                <FormGroup label={t('companyName')} name="company" value={formData.company} onChange={handleInputChange} icon={<Building2 size={14} />} placeholder="Acme Corp" required />
              </>
            )}

            <FormGroup label={t('rfidTagUid')} name="rfidTag" value={formData.rfidTag} onChange={handleInputChange} icon={<Fingerprint size={14} />} placeholder="A1B2C3D4" isTag required />
            <FormGroup label={t('placa')} name="placa" value={formData.placa} onChange={handleInputChange} icon={<Car size={14} />} placeholder="XYZ-123" />

            <div className="flex items-end lg:col-span-1">
              <button 
                type="submit" 
                className={`w-full py-3.5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg ${isFormValid() ? 'bg-orange-600 text-white shadow-orange-100 hover:bg-orange-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
              >
                <UserPlus size={18} />
                {t('addUser')}
              </button>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 italic">
            <ShieldCheck size={12} className="text-orange-400" />
            * Fields marked with "obligatory" in documentation are required for profile activation.
          </p>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Layers size={20} className="text-orange-500" />
            {t('userList')}
          </h3>
          <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
            {users.length} Total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">{t('userType')} / {t('userName')}</th>
                <th className="px-6 py-4">{t('contactNumber')} / {t('userEmail')}</th>
                <th className="px-6 py-4">{t('cedula')} / {t('nit')}</th>
                <th className="px-6 py-4">{t('companyName')}</th>
                <th className="px-6 py-4">{t('rfidTagUid')}</th>
                <th className="px-6 py-4">{t('placa')}</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${user.userType === 'BUSINESS' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                        {user.userType === 'BUSINESS' ? <Briefcase size={14} /> : <UserCircle size={14} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{user.name}</span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{user.userType}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{user.phone}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-600 font-medium">{user.cedula || '---'}</span>
                      <span className="text-[9px] text-slate-400">{user.nit || '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-600">{user.company || '---'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded text-orange-600 font-bold">{user.rfidTag}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 text-white px-2 py-1 rounded font-bold tracking-tight uppercase">{user.placa || '---'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onUpdateUser(user.id, { status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-tight transition-all ${
                        user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <ShieldCheck size={10} />
                      {user.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingUser(user)} className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                      <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-300 italic">No users in directory.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl scale-in-center overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Edit {editingUser.userType} Profile</h3>
                <p className="text-xs text-slate-400 mt-1">Profile: <span className="font-bold text-slate-600">{editingUser.id}</span></p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); onUpdateUser(editingUser.id, editingUser); setEditingUser(null); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormGroup label={t('userName')} value={editingUser.name} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditingUser({...editingUser, name: ev.target.value})} icon={<UserIcon size={14} />} required />
                <FormGroup label={t('userEmail')} value={editingUser.email} type="email" onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditingUser({...editingUser, email: ev.target.value})} icon={<Mail size={14} />} required />
                <FormGroup label={t('contactNumber')} value={editingUser.phone} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditingUser({...editingUser, phone: ev.target.value})} icon={<Phone size={14} />} required />
                
                {editingUser.userType === 'PERSONAL' ? (
                  <FormGroup label={t('cedula')} value={editingUser.cedula} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditingUser({...editingUser, cedula: ev.target.value})} icon={<Hash size={14} />} required />
                ) : (
                  <>
                    <FormGroup label={t('nit')} value={editingUser.nit} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditingUser({...editingUser, nit: ev.target.value})} icon={<Building2 size={14} />} required />
                    <FormGroup label={t('companyName')} value={editingUser.company} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditingUser({...editingUser, company: ev.target.value})} icon={<Building2 size={14} />} required />
                  </>
                )}
                
                <FormGroup label={t('rfidTagUid')} value={editingUser.rfidTag} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditingUser({...editingUser, rfidTag: ev.target.value})} icon={<Fingerprint size={14} />} isTag required />
                <FormGroup label={t('placa')} value={editingUser.placa} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEditingUser({...editingUser, placa: ev.target.value})} icon={<Car size={14} />} />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all">
                  {t('saveChanges')}
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all">
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const FormGroup = ({ label, name, value, onChange, icon, placeholder, type = "text", isTag = false, required = false }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
      {label}
      {required && <span className="text-orange-500 lowercase text-[9px] font-bold">({TRANSLATIONS['obligatoryField']?.['en']})</span>}
    </label>
    <div className="relative group/field">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-orange-400 transition-colors">
        {icon}
      </div>
      <input 
        type={type} 
        name={name}
        value={value} 
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all ${isTag ? 'uppercase font-mono text-orange-600' : 'text-slate-700'}`}
      />
    </div>
  </div>
);

export default UserManagement;
