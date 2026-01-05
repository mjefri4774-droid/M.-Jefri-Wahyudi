
import React, { useState, useRef } from 'react';
import { Save, School, MapPin, UserCheck, CalendarDays, CheckCircle2, AppWindow, Clock, AlertCircle, X, Hash, Camera, Image as ImageIcon, RotateCcw, Plus, Trash2, ListChecks, Edit3, LogIn, LogOut as LogOutIcon } from 'lucide-react';
import { SchoolProfile } from '../types';

interface SchoolSettingsProps {
  profile: SchoolProfile;
  setProfile: (profile: SchoolProfile) => void;
}

const SchoolSettings: React.FC<SchoolSettingsProps> = ({ profile, setProfile }) => {
  const [formData, setFormData] = useState<SchoolProfile>(profile);
  const [newClassName, setNewClassName] = useState('');
  const [editingClassIndex, setEditingClassIndex] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    setProfile(formData);
    setShowConfirmModal(false);
    setShowSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar. Maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const addOrUpdateClass = () => {
    const trimmed = newClassName.trim().toUpperCase();
    if (!trimmed) return;

    if (editingClassIndex !== null) {
      const updatedClasses = [...formData.availableClasses];
      updatedClasses[editingClassIndex] = trimmed;
      setFormData(prev => ({
        ...prev,
        availableClasses: updatedClasses.sort()
      }));
      setEditingClassIndex(null);
    } else {
      if (!formData.availableClasses.includes(trimmed)) {
        setFormData(prev => ({
          ...prev,
          availableClasses: [...prev.availableClasses, trimmed].sort()
        }));
      }
    }
    setNewClassName('');
  };

  const startEditClass = (index: number) => {
    setEditingClassIndex(index);
    setNewClassName(formData.availableClasses[index]);
    const inputElement = document.getElementById('class-input');
    inputElement?.focus();
  };

  const cancelEditClass = () => {
    setEditingClassIndex(null);
    setNewClassName('');
  };

  const removeClass = (className: string) => {
    if (editingClassIndex !== null && formData.availableClasses[editingClassIndex] === className) {
      cancelEditClass();
    }
    setFormData(prev => ({
      ...prev,
      availableClasses: prev.availableClasses.filter(c => c !== className)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Modal Konfirmasi Simpan (Ya/Tidak) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 border-4 border-amber-100 shadow-inner">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Konfirmasi Perubahan</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                Apakah Anda yakin ingin menyimpan perubahan pada identitas sekolah, kategori kelas, serta **jam operasional absensi**?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-10">
                <button 
                  onClick={handleConfirmSave}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[11px] py-4.5 rounded-2xl transition-all shadow-xl shadow-emerald-200 active:scale-95"
                >
                  Ya, Simpan
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-widest text-[11px] py-4.5 rounded-2xl transition-all active:scale-95"
                >
                  Tidak, Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pengaturan Sistem</h2>
          <p className="text-slate-500 font-medium">Kelola identitas sekolah dan kategori kelas</p>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-widest">Data Disimpan!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleOpenConfirm} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-7 border-b border-slate-100 bg-slate-50/30">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">
                <School className="w-4 h-4 text-emerald-600" />
                Informasi Sekolah & Kelas
              </h3>
            </div>
            
            <div className="p-7 space-y-6">
              {/* Logo Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="relative group w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-emerald-500"
                >
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-800">Logo Aplikasi</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Format PNG/JPG, maksimal 2MB.</p>
                  <button type="button" onClick={resetLogo} className="mt-3 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors">Reset Logo</button>
                </div>
              </div>

              {/* Form Fields Identitas Sekolah */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Aplikasi</label>
                  <div className="relative">
                    <AppWindow className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                    <input 
                      type="text" 
                      className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.appTitle}
                      onChange={e => setFormData({...formData, appTitle: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Resmi Sekolah / Institusi</label>
                  <div className="relative">
                    <School className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alamat Lengkap</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Kepala Sekolah</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      className="w-full pl-11 pr-4 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.principal}
                      onChange={e => setFormData({...formData, principal: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tahun Ajaran</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none"
                      value={formData.academicYear}
                      onChange={e => setFormData({...formData, academicYear: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Semester</label>
                    <select 
                      className="w-full px-5 py-3.5 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none"
                      value={formData.semester}
                      onChange={e => setFormData({...formData, semester: e.target.value as 'Ganjil' | 'Genap'})}
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pengaturan Waktu Absensi Section */}
              <div className="pt-6 border-t border-slate-50">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                  Pengaturan Waktu Absensi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-2 ml-1">
                      <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Batas Terlambat</label>
                    </div>
                    <input 
                      type="time" 
                      className="w-full px-5 py-3 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white"
                      value={formData.lateTime}
                      onChange={e => setFormData({...formData, lateTime: e.target.value})}
                    />
                    <p className="mt-1.5 text-[9px] text-slate-400 font-medium italic">Siswa melakukan 'Tap Masuk' setelah jam ini akan dicatat terlambat.</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2 ml-1">
                      <LogOutIcon className="w-3.5 h-3.5 text-amber-600" />
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Minimal Jam Pulang</label>
                    </div>
                    <input 
                      type="time" 
                      className="w-full px-5 py-3 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-white"
                      value={formData.outTime}
                      onChange={e => setFormData({...formData, outTime: e.target.value})}
                    />
                    <p className="mt-1.5 text-[9px] text-slate-400 font-medium italic">Siswa hanya dapat melakukan 'Tap Keluar' setelah melewati jam ini.</p>
                  </div>
                </div>
              </div>

              {/* Class Management Section */}
              <div className="pt-6 border-t border-slate-50">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                  Pengaturan Kategori Kelas
                </label>
                <div className="flex gap-2 mb-6">
                  <div className="relative flex-1">
                    <Hash className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      id="class-input"
                      type="text" 
                      placeholder="Masukkan nama kelas (contoh: 7-A)"
                      className={`w-full pl-11 pr-4 py-3.5 border rounded-2xl outline-none font-bold text-slate-700 transition-all ${
                        editingClassIndex !== null ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'
                      }`}
                      value={newClassName}
                      onChange={e => setNewClassName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOrUpdateClass())}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={addOrUpdateClass}
                    className={`px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                      editingClassIndex !== null 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-100' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {editingClassIndex !== null ? <RotateCcw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingClassIndex !== null ? 'Perbarui' : 'Tambah'}
                  </button>
                  {editingClassIndex !== null && (
                    <button 
                      type="button" 
                      onClick={cancelEditClass}
                      className="p-3.5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {formData.availableClasses.length > 0 ? (
                    formData.availableClasses.map((cls, idx) => (
                      <div 
                        key={`${cls}-${idx}`} 
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all group ${
                          editingClassIndex === idx ? 'bg-amber-100 border-amber-300' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <span className="text-xs font-black text-slate-700 truncate">{cls}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            onClick={() => startEditClass(idx)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => removeClass(cls)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                      Belum ada kategori kelas
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-7 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-emerald-200 active:scale-95"
              >
                <Save className="w-5 h-5" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-8">Summary Data</h4>
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Kategori Kelas</p>
                  <p className="text-xl font-black tracking-tight">{formData.availableClasses.length} Kelas Terdaftar</p>
                </div>
              </div>
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Jam Operasional</p>
                  <p className="text-sm font-bold text-white tracking-tight">Masuk: {formData.lateTime} • Pulang: {formData.outTime}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] text-slate-400 italic leading-relaxed">
                  *Setiap perubahan kategori kelas, identitas institusi, atau jam operasional akan merefleksikan seluruh halaman aplikasi secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSettings;
