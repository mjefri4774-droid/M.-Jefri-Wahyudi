
import React, { useState, useRef } from 'react';
import { Save, School, MapPin, UserCheck, CalendarDays, CheckCircle2, AppWindow, Clock, AlertCircle, X, Hash, Camera, Image as ImageIcon, RotateCcw, Plus, Trash2, ListChecks, Edit3, LogIn, LogOut as LogOutIcon, Database, Download, Upload, ShieldAlert } from 'lucide-react';
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
  const importFileRef = useRef<HTMLInputElement>(null);

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

  const handleExportDatabase = () => {
    const database = {
      students: JSON.parse(localStorage.getItem('smp_students') || '[]'),
      attendance: JSON.parse(localStorage.getItem('smp_attendance') || '[]'),
      school: JSON.parse(localStorage.getItem('smp_school_profile') || '{}'),
      users: JSON.parse(localStorage.getItem('smp_users_list') || '[]'),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(database, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DATABASE_ABSENSI_${profile.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm("PERINGATAN: Mengimpor database akan MENGHAPUS seluruh data yang ada saat ini dan menggantinya dengan data dari file. Lanjutkan?")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.students && data.attendance && data.school) {
            localStorage.setItem('smp_students', JSON.stringify(data.students));
            localStorage.setItem('smp_attendance', JSON.stringify(data.attendance));
            localStorage.setItem('smp_school_profile', JSON.stringify(data.school));
            if (data.users) localStorage.setItem('smp_users_list', JSON.stringify(data.users));
            
            alert("Database berhasil dipulihkan! Aplikasi akan memuat ulang halaman.");
            window.location.reload();
          } else {
            alert("File tidak valid.");
          }
        } catch (err) {
          alert("Gagal membaca file.");
        }
      };
      reader.readAsText(file);
    }
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const addOrUpdateClass = () => {
    const trimmed = newClassName.trim().toUpperCase();
    if (!trimmed) return;

    if (editingClassIndex !== null) {
      const updatedClasses = [...formData.availableClasses];
      updatedClasses[editingClassIndex] = trimmed;
      setFormData(prev => ({ ...prev, availableClasses: updatedClasses.sort() }));
      setEditingClassIndex(null);
    } else {
      if (!formData.availableClasses.includes(trimmed)) {
        setFormData(prev => ({ ...prev, availableClasses: [...prev.availableClasses, trimmed].sort() }));
      }
    }
    setNewClassName('');
  };

  const removeClass = (className: string) => {
    setFormData(prev => ({ ...prev, availableClasses: prev.availableClasses.filter(c => c !== className) }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 border-4 border-amber-100 shadow-inner">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Konfirmasi Perubahan</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">Apakah Anda yakin ingin menyimpan perubahan pada identitas sekolah dan jam operasional?</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-10">
                <button onClick={handleConfirmSave} className="flex-1 bg-emerald-600 text-white font-black uppercase text-[11px] py-4.5 rounded-2xl shadow-xl shadow-emerald-200">Ya, Simpan</button>
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-black uppercase text-[11px] py-4.5 rounded-2xl">Batal</button>
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
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl border border-emerald-100 animate-bounce shadow-sm">
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
                <School className="w-4 h-4 text-emerald-600" /> Informasi Sekolah & Kelas
              </h3>
            </div>
            
            <div className="p-7 space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div onClick={() => logoInputRef.current?.click()} className="relative group w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-emerald-500">
                  {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Logo" /> : <ImageIcon className="w-8 h-8 text-slate-300" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Camera className="w-5 h-5" /></div>
                </div>
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-800">Logo Aplikasi</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Format PNG/JPG, maksimal 2MB.</p>
                  <button type="button" onClick={resetLogo} className="mt-3 text-[10px] font-black uppercase text-rose-500">Reset Logo</button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Aplikasi</label>
                  <input type="text" className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.appTitle} onChange={e => setFormData({...formData, appTitle: e.target.value})} />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Resmi Sekolah</label>
                  <input type="text" className="w-full px-5 py-4 border border-slate-200 rounded-2xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Batas Terlambat</label>
                    <input 
                      type="time" 
                      style={{ colorScheme: 'light' }}
                      className="w-full px-5 py-4 border border-slate-300 rounded-2xl bg-white font-black text-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                      value={formData.lateTime} 
                      onChange={e => setFormData({...formData, lateTime: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Minimal Jam Pulang</label>
                    <input 
                      type="time" 
                      style={{ colorScheme: 'light' }}
                      className="w-full px-5 py-4 border border-slate-300 rounded-2xl bg-white font-black text-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                      value={formData.outTime} 
                      onChange={e => setFormData({...formData, outTime: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Kelola Kelas</label>
                <div className="flex gap-2 mb-6">
                  <input id="class-input" type="text" placeholder="Nama kelas..." className="flex-1 px-5 py-3.5 border border-slate-200 rounded-2xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                  <button type="button" onClick={addOrUpdateClass} className="px-6 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-colors active:scale-95">Tambah</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {formData.availableClasses.map((cls, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl group hover:border-emerald-500 transition-colors">
                      <span className="text-xs font-bold text-slate-700">{cls}</span>
                      <button type="button" onClick={() => removeClass(cls)} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-7 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button type="submit" className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-emerald-200 active:scale-95">
                <Save className="w-5 h-5" /> Simpan Perubahan
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6">Pusat Data & Keamanan</h4>
            <div className="space-y-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="w-5 h-5 text-emerald-400" /> <h5 className="font-bold text-sm">Backup Database</h5>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">Unduh seluruh data (Siswa, Riwayat, Akun) ke file JSON sebagai cadangan fisik.</p>
                <button onClick={handleExportDatabase} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Ekspor Database</button>
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="w-5 h-5 text-amber-400" /> <h5 className="font-bold text-sm">Restore Data</h5>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">Pulihkan data dari file backup yang telah Anda buat sebelumnya.</p>
                <input type="file" ref={importFileRef} onChange={handleImportDatabase} className="hidden" accept=".json" />
                <button onClick={() => importFileRef.current?.click()} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Impor Database</button>
              </div>

              <div className="pt-4 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-[9px] text-slate-500 italic">Lakukan Backup secara rutin agar data Anda aman dari risiko pembersihan browser.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolSettings;
