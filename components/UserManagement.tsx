
import React, { useState } from 'react';
import { Plus, ShieldCheck, User, Trash2, Edit2, X, Key, ShieldAlert, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { UserAccount, Role, UserProfile } from '../types';

interface UserManagementProps {
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  currentUser: UserProfile;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<UserAccount>>({
    name: '',
    username: '',
    password: '',
    role: 'user'
  });

  const openAddModal = () => {
    setEditingId(null);
    setShowPassword(false);
    setFormData({ name: '', username: '', password: '', role: 'user' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingId(user.id);
    setShowPassword(false);
    setFormData({ 
      name: user.name, 
      username: user.username, 
      password: user.password, 
      role: user.role 
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmSaveModal(true);
  };

  const executeSubmit = () => {
    if (formData.name && formData.username && formData.password) {
      if (editingId) {
        setUsers(prev => prev.map(u => 
          u.id === editingId 
            ? { ...u, ...formData as UserAccount } 
            : u
        ));
      } else {
        const newUser: UserAccount = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name as string,
          username: formData.username as string,
          password: formData.password as string,
          role: formData.role as Role,
          avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=random`
        };
        setUsers(prev => [...prev, newUser]);
      }
      setShowConfirmSaveModal(false);
      closeModal();
    }
  };

  const deleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan.");
      return;
    }
    if (window.confirm('Hapus akun pengguna ini secara permanen?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Custom Confirmation Modal */}
      {showConfirmSaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-100">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Simpan Perubahan?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Apakah Anda yakin ingin {editingId ? 'mengubah data akun ini' : 'mendaftarkan akun baru ini'}?
              </p>
              
              <div className="flex gap-3 w-full mt-8">
                <button 
                  onClick={executeSubmit}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-200 active:scale-95"
                >
                  Ya, Simpan
                </button>
                <button 
                  onClick={() => setShowConfirmSaveModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Pengguna</h2>
          <p className="text-slate-500 font-medium">Kelola akses admin dan staf piket sekolah</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl transition-all shadow-lg font-bold text-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'}`}></div>
            
            <div className="flex items-start justify-between relative">
              <div className="flex items-center gap-4">
                <img src={user.avatar} className="w-14 h-14 rounded-2xl border-2 border-slate-50 shadow-sm" alt="" />
                <div>
                  <h4 className="font-bold text-slate-800">{user.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">@{user.username}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                {user.role}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-xs font-mono text-slate-400">••••••••</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEditModal(user)}
                  className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteUser(user.id)}
                  disabled={user.id === currentUser.id}
                  className={`p-2.5 rounded-xl transition-all ${
                    user.id === currentUser.id ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {user.id === currentUser.id && (
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <ShieldAlert className="w-3 h-3" />
                <span>Akun Anda Saat Ini</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {editingId ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </h3>
              <button onClick={closeModal} className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                  <input 
                    type="text" required placeholder="Masukkan nama"
                    className="w-full px-5 py-4 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all bg-slate-50 font-semibold text-slate-900 placeholder:text-slate-400"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                  <input 
                    type="text" required placeholder="Gunakan tanpa spasi"
                    className="w-full px-5 py-4 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all bg-slate-50 font-semibold text-slate-900 placeholder:text-slate-400"
                    value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required 
                      placeholder="••••••••"
                      className="w-full px-5 pr-12 py-4 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all bg-slate-50 font-semibold text-slate-900 placeholder:text-slate-400"
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hak Akses / Role</label>
                  <select 
                    className="w-full px-5 py-4 border border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all bg-slate-50 font-bold text-slate-900"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}
                  >
                    <option value="user" className="text-slate-900">Staf (User)</option>
                    <option value="admin" className="text-slate-900">Administrator (Admin)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl">
                {editingId ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
