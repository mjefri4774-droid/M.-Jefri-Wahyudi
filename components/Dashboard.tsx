
import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, UserMinus, Clock, TrendingUp, BrainCircuit, School, AlertCircle, PieChart as PieChartIcon, MapPin, UserSquare2, MessageCircle, Share2 } from 'lucide-react';
import { Student, AttendanceRecord, SchoolProfile } from '../types';
import { getAttendanceAnalysis } from '../geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface DashboardProps {
  students: Student[];
  attendance: AttendanceRecord[];
  school: SchoolProfile;
}

const getLocalDateString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

const Dashboard: React.FC<DashboardProps> = ({ students, attendance, school }) => {
  const [analysis, setAnalysis] = useState<string>('Menganalisis data...');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const todayStr = useMemo(() => getLocalDateString(), []);
  const todayAttendance = useMemo(() => 
    attendance.filter(a => a.timestamp.startsWith(todayStr)), 
  [attendance, todayStr]);
  
  const stats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    const presentList: string[] = [];
    const absentList: string[] = [];

    students.forEach(student => {
      const studentRecords = todayAttendance.filter(a => a.studentId === student.id);
      const hasActivity = studentRecords.length > 0;

      if (hasActivity) {
        presentCount++;
        presentList.push(student.name);
      } else {
        absentCount++;
        absentList.push(student.name);
      }
    });
    
    return {
      total: students.length,
      present: presentCount,
      absent: absentCount,
      presentList,
      absentList,
      ratio: students.length > 0 ? (presentCount / students.length) * 100 : 0
    };
  }, [students, todayAttendance]);

  const chartData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
    const now = new Date();
    const currentDayIdx = now.getDay(); // 0 is Sunday, 1 is Monday...

    return days.map((dayName, idx) => {
      // Find the date for this day in the current week
      const targetDate = new Date(now);
      const diff = (idx + 1) - currentDayIdx;
      targetDate.setDate(now.getDate() + diff);
      const dateStr = getLocalDateString(targetDate);

      const dayAttendance = attendance.filter(a => a.timestamp.startsWith(dateStr));
      const uniqueStudents = new Set(dayAttendance.map(a => a.studentId));
      
      return {
        name: dayName,
        count: uniqueStudents.size,
        date: dateStr
      };
    });
  }, [attendance]);

  const sendGroupWARecap = () => {
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    let message = `*📊 REKAPITULASI PRESENSI HARIAN*\n`;
    message += `*${school.appTitle}*\n`;
    message += `------------------------------------------\n`;
    message += `📅 *Tanggal:* ${dateStr}\n`;
    message += `🏫 *Sekolah:* ${school.name}\n\n`;
    
    message += `✅ *TOTAL SISWA:* ${stats.total}\n`;
    message += `🟢 *HADIR:* ${stats.present}\n`;
    message += `🔴 *TIDAK HADIR:* ${stats.absent}\n`;
    message += `📈 *PERSENTASE KEHADIRAN:* ${stats.ratio.toFixed(1)}%\n\n`;

    if (stats.absentList.length > 0) {
      message += `*DAFTAR SISWA TIDAK HADIR (ALPA):*\n`;
      stats.absentList.forEach((name, idx) => {
        message += `${idx + 1}. ${name}\n`;
      });
      message += `\n`;
    } else {
      message += `✅ *Alhamdulillah, Seluruh siswa hadir hari ini.*\n\n`;
    }

    message += `_Laporan ini dikirimkan secara manual oleh Admin untuk pemantauan bersama. Terimakasih._\n\n`;
    message += `*Admin ${school.appTitle}*`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  const pieData = useMemo(() => [
    { name: 'HADIR', value: stats.present, color: '#10b981' },
    { name: 'TIDAK HADIR', value: stats.absent, color: '#f43f5e' },
  ], [stats]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      const res = await getAttendanceAnalysis(students, attendance, school);
      setAnalysis(res || "Tidak ada data untuk dianalisis.");
      setLoadingAnalysis(false);
    };
    fetchAnalysis();
  }, [students, attendance, school]);

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'rose': return 'bg-rose-50 text-rose-600';
      case 'amber': return 'bg-amber-50 text-amber-600';
      default: return 'bg-emerald-50 text-emerald-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 shrink-0 overflow-hidden">
            {school.logoUrl ? (
              <img src={school.logoUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <School className="w-8 h-8" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight truncate">{school.appTitle}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
               <p className="text-slate-500 font-medium text-sm truncate">{school.name}</p>
               <span className="hidden sm:inline text-slate-300">•</span>
               <span className="text-emerald-600 font-bold text-sm uppercase">TA {school.academicYear}</span>
            </div>
          </div>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hari Ini</p>
            <span className="text-sm font-bold text-slate-700">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sekolah</p>
              <h4 className="font-bold text-slate-800 leading-tight truncate">{school.name}</h4>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat</p>
              <h4 className="font-bold text-slate-800 leading-tight text-sm truncate">{school.address}</h4>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
               <UserSquare2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kepala Sekolah</p>
              <h4 className="font-bold text-slate-800 leading-tight truncate">{school.principal}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Siswa', value: stats.total, icon: Users, color: 'emerald' },
          { label: 'HADIR', value: stats.present, icon: UserCheck, color: 'emerald' },
          { label: 'TIDAK HADIR', value: stats.absent, icon: UserMinus, color: 'rose' },
          { label: 'Persentase', value: `${stats.ratio.toFixed(1)}%`, icon: TrendingUp, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${getColorClasses(stat.color)} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-600" />
                Komposisi Absensi
              </h3>
            </div>
            <button 
              onClick={sendGroupWARecap}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-100 font-black uppercase tracking-widest text-[10px] active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              Kirim Rekap WA Grup
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-7 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-800">Tren Kehadiran Siswa (Minggu Ini)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} domain={[0, students.length + 2]} />
                <Tooltip 
                  cursor={{ fill: '#f0fdf4', radius: 12 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${value} Siswa`, 'Hadir']}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.date === todayStr ? '#059669' : '#d1fae5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <BrainCircuit className="w-6 h-6 text-emerald-100" />
              </div>
              <h3 className="font-bold text-xl tracking-tight">AI Smart School Analysis</h3>
            </div>
            <div className="text-emerald-50 text-sm leading-relaxed max-w-3xl">
              {loadingAnalysis ? (
                <div className="flex items-center gap-2 py-4">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.5s]"></div>
                </div>
              ) : (
                <p className="whitespace-pre-line font-medium leading-relaxed opacity-95">{analysis}</p>
              )}
            </div>
          </div>
          <div className="shrink-0 text-center md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
            <p className="text-[10px] text-emerald-300 font-black uppercase tracking-[0.2em] mb-1">Kepala Sekolah</p>
            <p className="text-lg font-bold text-white">{school.principal}</p>
            <div className="inline-flex mt-4 px-3 py-1 bg-emerald-500/30 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest">Powered by Gemini AI</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
