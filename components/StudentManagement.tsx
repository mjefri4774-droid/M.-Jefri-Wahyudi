
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Trash2, Edit2, User, X, Radio, LayoutGrid, List, ChevronRight, Cpu, Scan, Camera, Upload, Image as ImageIcon, UserCircle, MessageCircle, Phone } from 'lucide-react';
import { Student, Role } from '../types';

interface StudentManagementProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  userRole?: Role;
  schoolClasses?: string[];
}

type DisplayMode = 'list' | 'group';

const StudentManagement: React.FC<StudentManagementProps> = ({ students, setStudents, userRole = 'user', schoolClasses = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState('Semua Kelas');
  const [isListeningForRFID, setIsListeningForRFID] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = userRole === 'admin';

  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    nisn: '',
    class: '',
    gender: 'Laki-laki',
    rfidUid: '',
    avatar: '',
    parentPhone: ''
  });

  useEffect(() => {
    if (selectedClassFilter !== 'Semua Kelas' && !schoolClasses.includes(selectedClassFilter)) {
      setSelectedClassFilter('Semua Kelas');
    }
  }, [schoolClasses, selectedClassFilter]);

  useEffect(() => {
    if (!isListeningForRFID) return;

    let rfidBuffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) rfidBuffer = "";
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (rfidBuffer.length > 2) {
          setFormData(prev => ({ ...prev, rfidUid: rfidBuffer.trim() }));
          setIsListeningForRFID(false);
        }
        rfidBuffer = "";
      } else if (e.key.length === 1) {
        rfidBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListeningForRFID]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nisn.includes(searchTerm);
      const matchesClass = selectedClassFilter === 'Semua Kelas' || s.class === selectedClassFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClassFilter]);

  const groupedStudents = useMemo<Record<string, Student[]>>(() => {
    const groups: Record<string, Student[]> = {};
    filteredStudents.forEach(student => {
      if (!groups[student.class]) {
        groups[student.class] = [];
      }
      groups[student.class].push(student);
    });
    return Object.keys(groups).sort().reduce<Record<string, Student[]>>((obj, key) => {
      obj[key] = groups[key];
      return obj;
    }, {});
  }, [filteredStudents]);

  const openAddModal = () => {
    if (!isAdmin) return;
    setEditingId(null);
    setFormData({ 
      name: '', 
      nisn: '', 
      class: schoolClasses.length > 0 ? schoolClasses[0] : '', 
      gender: 'Laki-laki', 
      rfidUid: '', 
      avatar: '',
      parentPhone: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    if (!isAdmin) return;
    setEditingId(student.id);
    setFormData({ 
      name: student.name, 
      nisn: student.nisn, 
      class: student.class, 
      gender: student.gender,
      rfidUid: student.rfidUid,
      avatar: student.avatar,
      parentPhone: student.parentPhone || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsListeningForRFID(false);
    setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setFormData(prev => ({ ...prev, avatar: compressedBase64 }));
          }
          setIsCompressing(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isCompressing) return;

    if (formData.name && formData.nisn && formData.rfidUid && formData.class && formData.gender) {
      const finalAvatar = formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`;
      
      const studentData = {
        ...formData,
        avatar: finalAvatar,
        parentPhone: formData.parentPhone?.replace(/\D/g, '') || ''
      } as Student;

      if (editingId) {
        setStudents(prev => prev.map(s => 
          s.id === editingId 
            ? { ...s, ...studentData } 
            : s
        ));
      } else {
        const studentToAdd: Student = {
          ...studentData,
          id: Math.random().toString(36).substr(2, 9),
        };
        setStudents(prev => [...prev, studentToAdd]);
      }
      closeModal();
    }
  };

  const deleteStudent = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Hapus data siswa? Data absensi terkait mungkin akan terpengaruh.')) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Siswa</h2>
          <p className="text-slate-500 font-medium">Informasi siswa dan kontak wali santri</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-1 flex shadow-sm">
            <button 
              onClick={() => setDisplayMode('list')}
              className={`p-2 rounded-xl transition-all ${displayMode === 'list' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-slate-400 hover:text-emerald-600'}`}
              title="Tampilan Tabel"
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setDisplayMode('group')}
              className={`p-2 rounded-xl transition-all ${displayMode === 'group' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-slate-400 hover:text-emerald-600'}`}
              title="Tampilan Per Kelas"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          {isAdmin && (
            <button 
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-100 font-bold text-sm active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau NISN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>
          <select 
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-5 py-3 border border-slate-100 rounded-2xl text-sm font-bold outline-none bg-white text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
          >
            <option className="text-slate-900">Semua Kelas</option>
            {schoolClasses.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
          </select>
        </div>

        {displayMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-6 py-5">Siswa</th>
                  <th className="px-6 py-5">Kelas & Gender</th>
                  <th className="px-6 py-5">Kontak Wali (WA)</th>
                  <th className="px-6 py-5">RFID UID</th>
                  {isAdmin && <th className="px-6 py-5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <img src={student.avatar} className="w-11 h-11 rounded-2xl border-2 border-white shadow-md object-cover" alt={student.name} />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{student.nisn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex self-start px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black tracking-widest border border-emerald-100">
                          {student.class}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-tight ${student.gender === 'Perempuan' ? 'text-rose-500' : 'text-blue-500'}`}>
                          {student.gender}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       {student.parentPhone ? (
                         <div className="flex items-center gap-2 text-slate-600">
                           <MessageCircle className="w-4 h-4 text-emerald-500" />
                           <span className="text-xs font-bold">+{student.parentPhone}</span>
                         </div>
                       ) : (
                         <span className="text-[10px] text-slate-300 italic">Belum diatur</span>
                       )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-mono font-bold text-slate-600 tracking-wider uppercase bg-slate-100 px-2 py-1 rounded-md">{student.rfidUid}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button 
                            onClick={() => openEditModal(student)}
                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all shadow-sm bg-white"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteStudent(student.id)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all shadow-sm bg-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/20">
            {Object.keys(groupedStudents).length > 0 ? (
              (Object.entries(groupedStudents) as [string, Student[]][]).map(([className, classStudents]) => (
                <div key={className} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-4 bg-emerald-600 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-emerald-200" />
                      <h3 className="font-bold text-sm uppercase tracking-widest">Kelas {className}</h3>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">{classStudents.length} Siswa</span>
                  </div>
                  <div className="p-4 flex-1 space-y-3">
                    {classStudents.map(student => (
                      <div key={student.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:bg-emerald-50/50 hover:border-emerald-100 transition-all group/item">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={student.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-white" alt="" />
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${student.gender === 'Perempuan' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{student.name}</p>
                            <div className="flex items-center gap-2">
                               <p className="text-[9px] text-slate-400 font-bold">{student.nisn}</p>
                               {student.parentPhone && <MessageCircle className="w-2.5 h-2.5 text-emerald-400" />}
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(student)} className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-white transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteStudent(student.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                Data tidak ditemukan.
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
             <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {editingId ? 'Edit Siswa' : 'Tambah Siswa'}
              </h3>
              <button onClick={closeModal} className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-28 h-28 rounded-full border-4 border-emerald-50 bg-slate-100 shadow-inner flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-emerald-200"
              >
                {formData.avatar ? (
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <ImageIcon className="w-10 h-10 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Pilih Foto</span>
                  </div>
                )}
                {isCompressing && (
                  <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center text-white">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {isCompressing ? "Mengompres..." : "Sentuh untuk Foto"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                  <input 
                    type="text" required 
                    className="w-full px-5 py-4 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all bg-slate-50 font-semibold text-slate-900 placeholder:text-slate-400" 
                    placeholder="Contoh: Andi Pratama"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Jenis Kelamin</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, gender: 'Laki-laki'})}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border transition-all font-bold text-sm ${
                        formData.gender === 'Laki-laki' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-4 ring-blue-500/10' 
                        : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Laki-laki
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, gender: 'Perempuan'})}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border transition-all font-bold text-sm ${
                        formData.gender === 'Perempuan' 
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-4 ring-rose-500/10' 
                        : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <UserCircle className="w-4 h-4" />
                      Perempuan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">NISN</label>
                    <input 
                      type="text" required 
                      className="w-full px-5 py-4 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all bg-slate-50 font-semibold text-slate-900 placeholder:text-slate-400" 
                      placeholder="009..."
                      value={formData.nisn} 
                      onChange={e => setFormData({...formData, nisn: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kelas</label>
                    <select 
                      className="w-full px-5 py-4 border border-slate-100 rounded-2xl focus:border-emerald-500 outline-none transition-all bg-slate-50 font-bold text-slate-900" 
                      value={formData.class} 
                      onChange={e => setFormData({...formData, class: e.target.value})}
                      required
                    >
                      {schoolClasses.length > 0 ? (
                        schoolClasses.map(c => <option key={c} value={c}>{c}</option>)
                      ) : (
                        <option value="">-- Kelas --</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">No. WhatsApp Wali (Monitoring)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                    <input 
                      type="text" 
                      placeholder="628xxxxxxxxxx"
                      className="w-full pl-11 pr-4 py-4 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all bg-slate-50 font-bold text-slate-900" 
                      value={formData.parentPhone} 
                      onChange={e => setFormData({...formData, parentPhone: e.target.value})} 
                    />
                  </div>
                  <p className="mt-1 text-[9px] text-slate-400 font-medium ml-1">Awali dengan kode negara (62). Digunakan untuk notifikasi presensi.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">RFID UID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" required 
                      placeholder="Scan atau input manual..."
                      className="flex-1 px-5 py-4 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all bg-slate-50 font-mono font-bold uppercase text-slate-900" 
                      value={formData.rfidUid} 
                      onChange={e => setFormData({...formData, rfidUid: e.target.value})} 
                    />
                    <button 
                      type="button"
                      onClick={() => setIsListeningForRFID(!isListeningForRFID)}
                      className={`px-4 rounded-2xl flex items-center justify-center transition-all shadow-sm border ${
                        isListeningForRFID 
                        ? 'bg-amber-100 border-amber-300 text-amber-700 animate-pulse' 
                        : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      {isListeningForRFID ? <Scan className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isCompressing}
                className={`w-full py-4 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl ${
                  isCompressing ? "bg-slate-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                }`}
              >
                {editingId ? 'Simpan Perubahan' : 'Tambah Siswa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
