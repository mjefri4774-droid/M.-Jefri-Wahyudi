
import React, { useState, useEffect, useMemo } from 'react';
import { Radio, Scan, CheckCircle2, XCircle, Clock, AlertTriangle, MessageCircle, Share2 } from 'lucide-react';
import { Student, SchoolProfile, AttendanceRecord } from '../types';

interface RFIDSimulatorProps {
  students: Student[];
  school: SchoolProfile;
  attendance: AttendanceRecord[];
  onScan: (studentId: string, type: 'IN' | 'OUT') => void;
}

// Helper to get consistent local date string YYYY-MM-DD
const getLocalDateString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

const RFIDSimulator: React.FC<RFIDSimulatorProps> = ({ students, school, attendance, onScan }) => {
  const [selectedId, setSelectedId] = useState('');
  const [lastScan, setLastScan] = useState<{ studentId: string; name: string; type: string; time: string; status?: string; phone?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toTimeString().slice(0, 5);
  const isOutAllowed = timeStr >= school.outTime;

  // Logic to determine which buttons should be enabled
  const studentStatus = useMemo(() => {
    if (!selectedId) return { canTapIn: true, canTapOut: true, lastType: null };
    const today = getLocalDateString();
    const records = attendance
      .filter(a => a.studentId === selectedId && a.timestamp.startsWith(today))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const lastRecord = records[0];
    
    return {
      canTapIn: !lastRecord || lastRecord.type === 'OUT',
      canTapOut: lastRecord?.type === 'IN',
      lastType: lastRecord?.type
    };
  }, [selectedId, attendance]);

  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendWhatsAppNotification = () => {
    if (!lastScan || !lastScan.phone) return;

    const message = `*KONFIRMASI PRESENSI - ${school.appTitle}*\n\n` +
      `Halo Bapak/Ibu Wali Murid,\n` +
      `Informasi monitoring presensi harian siswa:\n\n` +
      `👤 *Nama:* ${lastScan.name}\n` +
      `🕒 *Waktu:* ${lastScan.time} WIB\n` +
      `📌 *Tipe:* ${lastScan.type.toUpperCase()}\n` +
      `📊 *Status:* HADIR (${lastScan.status || 'Diterima'})\n\n` +
      `Pesan ini dikirimkan secara otomatis oleh sistem presensi RFID sekolah. Terima kasih.`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${lastScan.phone}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  const handleSimulate = (type: 'IN' | 'OUT') => {
    if (!selectedId) {
      setError("Silakan pilih siswa terlebih dahulu");
      speakFeedback("Pilih siswa dahulu");
      return;
    }

    if (type === 'OUT' && !isOutAllowed) {
      setError(`Tap pulang hanya diperbolehkan setelah pukul ${school.outTime}`);
      speakFeedback("Belum jam pulang");
      return;
    }

    if (type === 'IN' && !studentStatus.canTapIn) {
      setError("Siswa ini sudah melakukan tap masuk hari ini.");
      speakFeedback("Sudah tap masuk");
      return;
    }

    if (type === 'OUT' && !studentStatus.canTapOut) {
      setError("Siswa ini belum masuk atau sudah tap keluar.");
      speakFeedback("Belum tap masuk");
      return;
    }

    const student = students.find(s => s.id === selectedId);
    if (!student) return;

    setIsProcessing(true);
    setError(null);

    setTimeout(() => {
      onScan(selectedId, type);
      
      let statusFeedback = '';
      if (type === 'IN') {
        statusFeedback = timeStr > school.lateTime ? 'TERLAMBAT' : 'TEPAT WAKTU';
        if (statusFeedback === 'TERLAMBAT') {
          speakFeedback("Anda terlambat");
        } else {
          speakFeedback("Akses diterima");
        }
      } else {
        speakFeedback("Hati-hati di jalan");
      }

      setLastScan({
        studentId: student.id,
        name: student.name,
        type: type === 'IN' ? 'Masuk' : 'Keluar',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: statusFeedback,
        phone: student.parentPhone
      });
      setIsProcessing(false);
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center px-4">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Virtual RFID Reader</h2>
        <p className="text-slate-500 font-medium mt-1">Simulasi tap kartu dan monitoring wali murid</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        <div className="bg-slate-900 rounded-[3rem] p-9 shadow-2xl relative overflow-hidden flex flex-col items-center border-4 border-slate-800">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
          
          <div className="w-full bg-slate-800/50 rounded-3xl p-6 mb-8 text-center backdrop-blur-sm border border-slate-700/50">
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] mb-1">Live Server Time</p>
            <h1 className="text-4xl font-mono font-black text-white tracking-tighter">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>

          <div className={`w-36 h-36 rounded-full border-[6px] ${isProcessing ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-slate-800'} flex items-center justify-center mb-10 relative transition-all duration-500 bg-slate-800/20`}>
            {isProcessing ? (
              <Scan className="w-16 h-16 text-emerald-400 animate-pulse" />
            ) : (
              <Radio className="w-16 h-16 text-slate-700" />
            )}
            <div className={`absolute inset-0 rounded-full border-2 border-emerald-500/20 ${isProcessing ? 'animate-ping' : ''}`}></div>
          </div>

          <div className="flex gap-4 w-full">
            <button 
              disabled={isProcessing || !studentStatus.canTapIn}
              onClick={() => handleSimulate('IN')}
              className={`flex-1 font-black py-4 rounded-2xl transition-all active:scale-95 shadow-xl tracking-wider text-[11px] ${
                studentStatus.canTapIn 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/40' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none'
              }`}
            >
              TAP MASUK
            </button>
            <div className="flex-1 relative">
              <button 
                disabled={isProcessing || !studentStatus.canTapOut}
                onClick={() => handleSimulate('OUT')}
                className={`w-full font-black py-4 rounded-2xl transition-all active:scale-95 shadow-xl tracking-wider text-[11px] ${
                  isOutAllowed && studentStatus.canTapOut
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-950/40' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none'
                }`}
              >
                TAP KELUAR
              </button>
              {!isOutAllowed && studentStatus.canTapOut && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-[9px] text-slate-300 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none">
                  Aktif Pukul: {school.outTime}
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-6 flex items-center gap-2 text-rose-400 text-[10px] font-bold animate-in fade-in zoom-in bg-rose-500/10 px-4 py-2.5 rounded-xl border border-rose-500/20 w-full justify-center">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Identitas Kartu
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Pilih Kartu Siswa</label>
                <select 
                  className="w-full px-5 py-4 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-bold text-slate-900 transition-all shadow-sm"
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setError(null);
                  }}
                >
                  <option value="" className="text-slate-900">-- Pilih Siswa --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      {s.name} ({s.rfidUid})
                    </option>
                  ))}
                </select>
                {selectedId && (
                   <div className="mt-3 flex items-center gap-2 ml-1">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">STATUS FISIK:</span>
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                       studentStatus.canTapOut ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                     }`}>
                       {studentStatus.canTapOut ? 'DALAM SEKOLAH' : 'DILUAR SEKOLAH'}
                     </span>
                   </div>
                )}
              </div>
              
              {lastScan && (
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-emerald-100 shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Berhasil Tap {lastScan.type}</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{lastScan.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-emerald-700 bg-white/50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">HADIR</span>
                        {lastScan.status && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${
                            lastScan.status === 'TERLAMBAT' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {lastScan.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {lastScan.phone ? (
                    <button 
                      onClick={sendWhatsAppNotification}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Kirim Konfirmasi WA
                    </button>
                  ) : (
                    <div className="text-center p-3.5 bg-white/50 rounded-2xl border border-emerald-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Kontak wali murid tidak tersedia</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-6 text-white border border-slate-800 shadow-xl">
            <h4 className="text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
              <Share2 className="w-3 h-3" />
              Monitoring Layanan Orang Tua
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Notifikasi dikirimkan ke wali murid dengan status <span className="text-emerald-400 font-bold">HADIR</span> setelah kartu di-tap. Untuk tap keluar, pesan akan menyertakan keterangan (Telah Pulang).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFIDSimulator;
