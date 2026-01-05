
import React, { useState } from 'react';
import { Calendar, Download, Filter, ArrowRightLeft, FileSpreadsheet, AlertCircle, X, Trash2, MessageCircle, Share2, Info, FileText } from 'lucide-react';
import { Student, AttendanceRecord, Role } from '../types';
import * as XLSX from 'xlsx';

interface AttendanceHistoryProps {
  students: Student[];
  attendance: AttendanceRecord[];
  setAttendance?: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  userRole?: Role;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ students, attendance, setAttendance, userRole = 'user' }) => {
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showDeleteOneConfirm, setShowDeleteOneConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [exportType, setExportType] = useState<'PDF' | 'EXCEL' | null>(null);
  
  const isAdmin = userRole === 'admin';
  const getStudent = (id: string) => students.find(s => s.id === id);

  const handleInitExport = (type: 'PDF' | 'EXCEL') => {
    setExportType(type);
    setShowExportConfirm(true);
  };

  const handleConfirmExport = () => {
    if (!isAdmin || !exportType) return;

    if (exportType === 'EXCEL') {
      const exportData = attendance.map(record => {
        const student = getStudent(record.studentId);
        const date = new Date(record.timestamp);
        return {
          'Waktu': date.toLocaleTimeString('id-ID'),
          'Tanggal': date.toLocaleDateString('id-ID'),
          'Nama Siswa': student?.name || 'Siswa Dihapus',
          'NISN': student?.nisn || '-',
          'Kelas': student?.class || '-',
          'Tipe': record.type === 'IN' ? 'MASUK' : 'KELUAR',
          'Status': record.status === 'LATE' ? 'HADIR (TERLAMBAT)' : 'HADIR',
          'RFID UID': student?.rfidUid || '-'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Log Presensi");
      
      const fileName = `Log_Presensi_SMP_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else {
      alert('Fitur ekspor PDF akan tersedia segera.');
    }

    setShowExportConfirm(false);
    setExportType(null);
  };

  const sendManualWA = (record: AttendanceRecord) => {
    const student = getStudent(record.studentId);
    if (!student || !student.parentPhone) {
      alert("Nomor WhatsApp wali murid tidak ditemukan.");
      return;
    }

    const date = new Date(record.timestamp);
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    let statusDisplay = "*HADIR*";
    if (record.type === 'OUT') {
      statusDisplay = "*HADIR* (Telah Melakukan Tap Keluar/Pulang)";
    } else if (record.status === 'LATE') {
      statusDisplay = "*HADIR* (Terlambat)";
    }

    const message = `*KONFIRMASI PRESENSI SISWA*\n\n` +
      `Halo Bapak/Ibu Wali Murid dari *${student.name}*,\n` +
      `Berikut adalah informasi kehadiran siswa hari ini:\n\n` +
      `👤 *Nama:* ${student.name}\n` +
      `🕒 *Waktu Tap:* ${timeStr} WIB\n` +
      `📅 *Tanggal:* ${dateStr}\n` +
      `📊 *Status:* ${statusDisplay}\n\n` +
      `Pesan ini dikirimkan sebagai bagian dari layanan monitoring sekolah. Terimakasih.`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${student.parentPhone}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  const openDeleteOneConfirm = (id: string) => {
    if (!isAdmin) return;
    setRecordToDelete(id);
    setShowDeleteOneConfirm(true);
  };

  const handleConfirmDeleteOne = () => {
    if (!isAdmin || !setAttendance || !recordToDelete) return;
    setAttendance(prev => prev.filter(record => record.id !== recordToDelete));
    setShowDeleteOneConfirm(false);
    setRecordToDelete(null);
  };

  const handleClearAllHistory = () => {
    if (!isAdmin || !setAttendance) return;
    setAttendance([]);
    setShowClearAllConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Modal Konfirmasi Hapus Satu */}
      {showDeleteOneConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-6 border-4 border-rose-100">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Hapus Rekaman?</h3>
              <p className="text-slate-500 text-sm font-medium">Rekaman presensi ini akan dihapus permanen dari riwayat sistem.</p>
              <div className="flex gap-3 w-full mt-8">
                <button onClick={handleConfirmDeleteOne} className="flex-1 bg-rose-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-rose-100 active:scale-95 transition-all">Ya, Hapus</button>
                <button onClick={() => setShowDeleteOneConfirm(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-all">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Semua */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-6 border-4 border-rose-100">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Kosongkan Riwayat?</h3>
              <p className="text-slate-500 text-sm font-medium px-4">Tindakan ini akan menghapus **SELURUH** riwayat presensi yang ada. Data yang dihapus tidak dapat dikembalikan.</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-10">
                <button onClick={handleClearAllHistory} className="flex-1 bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] py-4.5 rounded-2xl shadow-xl shadow-rose-200 active:scale-95 transition-all">Ya, Kosongkan Semua</button>
                <button onClick={() => setShowClearAllConfirm(false)} className="flex-1 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[11px] py-4.5 rounded-2xl active:scale-95 transition-all">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Ekspor */}
      {showExportConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-100">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Unduh Laporan?</h3>
              <p className="text-slate-500 text-sm font-medium">Sistem akan menyiapkan file {exportType} berisi seluruh riwayat presensi saat ini.</p>
              <div className="flex gap-3 w-full mt-8">
                <button onClick={handleConfirmExport} className="flex-1 bg-emerald-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all">Unduh Sekarang</button>
                <button onClick={() => setShowExportConfirm(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-all">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Riwayat Presensi</h2>
          <p className="text-slate-500 font-medium">Monitoring aktivitas tap kartu siswa</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleInitExport('PDF')} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-2xl transition-all shadow-sm text-[11px] font-black uppercase tracking-widest">
              <FileText className="w-4 h-4 text-rose-500" /> PDF
            </button>
            <button onClick={() => handleInitExport('EXCEL')} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-2xl transition-all shadow-sm text-[11px] font-black uppercase tracking-widest">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel
            </button>
            <button onClick={() => setShowClearAllConfirm(true)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-rose-100 text-[11px] font-black uppercase tracking-widest">
              <Trash2 className="w-4 h-4" /> Hapus Semua
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-6 py-5">Waktu</th>
                <th className="px-6 py-5">Siswa</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Aktivitas</th>
                <th className="px-6 py-5 text-center">WA Notif</th>
                {isAdmin && <th className="px-6 py-5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.length > 0 ? (
                attendance.map((record) => {
                  const student = getStudent(record.studentId);
                  const date = new Date(record.timestamp);
                  const hasPhone = !!student?.parentPhone;
                  const isLate = record.status === 'LATE';

                  return (
                    <tr key={record.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-800 leading-none">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <img src={student?.avatar || `https://ui-avatars.com/api/?name=?`} className="w-9 h-9 rounded-xl border border-white shadow-sm object-cover" alt="" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{student?.name || 'Siswa Dihapus'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{student?.class || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex flex-col gap-1">
                            <span className="inline-flex self-start px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[9px] font-black uppercase tracking-widest">
                              HADIR
                            </span>
                            {isLate && record.type === 'IN' && (
                              <span className="text-[8px] text-rose-500 font-black uppercase tracking-tighter bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 inline-block self-start">Terlambat</span>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          record.type === 'IN' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {record.type === 'IN' ? 'Masuk' : 'Keluar'}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => sendManualWA(record)}
                          disabled={!hasPhone}
                          className={`p-2.5 rounded-xl transition-all ${
                            hasPhone ? 'text-emerald-500 hover:bg-emerald-50 border border-emerald-50 shadow-sm' : 'text-slate-200 cursor-not-allowed'
                          }`}
                          title={hasPhone ? "Kirim Laporan WA" : "Nomor tidak tersedia"}
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-5 text-right">
                          <button onClick={() => openDeleteOneConfirm(record.id)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                         <Info className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat presensi</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
