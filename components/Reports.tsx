
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Download, TrendingUp, Users, Award, AlertTriangle, BrainCircuit, ChevronLeft, ChevronRight, FileSpreadsheet, X, AlertCircle, PieChart as PieChartIcon, FileText, CheckCircle2 } from 'lucide-react';
import { Student, AttendanceRecord, Role } from '../types';
import { getPeriodicReportAnalysis } from '../geminiService';
import * as XLSX from 'xlsx';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

interface ReportsProps {
  students: Student[];
  attendance: AttendanceRecord[];
  userRole?: Role;
}

type PeriodType = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

const getLocalDateString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

const Reports: React.FC<ReportsProps> = ({ students, attendance, userRole = 'user' }) => {
  const [period, setPeriod] = useState<PeriodType>('mingguan');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  
  const isAdmin = userRole === 'admin';

  const getPeriodDisplay = () => {
    switch(period) {
      case 'harian': return currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'mingguan': {
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
      case 'bulanan': return currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      case 'tahunan': return currentDate.getFullYear().toString();
      default: return '';
    }
  };

  const navigatePeriod = (direction: number) => {
    const next = new Date(currentDate);
    if (period === 'harian') next.setDate(next.getDate() + direction);
    if (period === 'mingguan') next.setDate(next.getDate() + (direction * 7));
    if (period === 'bulanan') next.setMonth(next.getMonth() + direction);
    if (period === 'tahunan') next.setFullYear(next.getFullYear() + direction);
    setCurrentDate(next);
  };

  const filteredAttendance = useMemo(() => {
    let start = new Date(currentDate);
    let end = new Date(currentDate);

    if (period === 'harian') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'mingguan') {
      start.setDate(currentDate.getDate() - currentDate.getDay());
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
    } else if (period === 'bulanan') {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'tahunan') {
      start = new Date(currentDate.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59);
    }

    return attendance.filter(a => {
      const d = new Date(a.timestamp);
      return d >= start && d <= end;
    });
  }, [period, currentDate, attendance]);

  const datesInRange = useMemo(() => {
    const dates: string[] = [];
    if (period === 'harian') {
      dates.push(getLocalDateString(currentDate));
    } else if (period === 'mingguan') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(getLocalDateString(d));
      }
    } else if (period === 'bulanan') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        dates.push(getLocalDateString(new Date(year, month, i)));
      }
    }
    return dates;
  }, [period, currentDate]);

  const stats = useMemo(() => {
    let hadirTotal = 0;
    let alpaTotal = 0;

    datesInRange.forEach(dateStr => {
      const dayAttendance = filteredAttendance.filter(a => a.timestamp.startsWith(dateStr));
      const presentIds = new Set(dayAttendance.map(a => a.studentId));
      hadirTotal += presentIds.size;
      alpaTotal += (students.length - presentIds.size);
    });

    return { hadir: hadirTotal, alpa: alpaTotal, totalChecks: datesInRange.length * students.length };
  }, [datesInRange, filteredAttendance, students]);

  const pieData = useMemo(() => [
    { name: 'HADIR', value: stats.hadir, color: '#10b981' },
    { name: 'TIDAK HADIR', value: stats.alpa, color: '#f43f5e' },
  ], [stats]);

  const reportData = useMemo(() => {
    if (period === 'mingguan') {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      return days.map((day, idx) => {
        const dateStr = datesInRange[idx];
        const dayAtt = filteredAttendance.filter(a => a.timestamp.startsWith(dateStr));
        const hadirCount = new Set(dayAtt.map(a => a.studentId)).size;
        return { name: day, Kehadiran: hadirCount, Kapasitas: students.length };
      });
    }
    return [
      { name: 'Terpilih', Kehadiran: stats.hadir, Kapasitas: stats.totalChecks }
    ];
  }, [period, datesInRange, filteredAttendance, students, stats]);

  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const dataForExcel: any[] = [];
        students.forEach((student, index) => {
          const row: any = {
            "No": index + 1,
            "Nama Siswa": student.name,
            "NISN": student.nisn,
            "Kelas": student.class
          };

          let studentHadirCount = 0;
          datesInRange.forEach(dateStr => {
            const isPresent = filteredAttendance.some(a => a.studentId === student.id && a.timestamp.startsWith(dateStr));
            const colName = dateStr.split('-').reverse().join('/');
            row[colName] = isPresent ? "HADIR" : "ALPA";
            if (isPresent) studentHadirCount++;
          });

          row["Total Hadir"] = studentHadirCount;
          row["% Kehadiran"] = ((studentHadirCount / datesInRange.length) * 100).toFixed(1) + "%";
          dataForExcel.push(row);
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Presensi");
        const fileName = `Rekap_Absensi_${period.toUpperCase()}_${getPeriodDisplay().replace(/ /g, '_')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
      } catch (err) {
        console.error("Export error:", err);
        alert("Gagal mengekspor data ke Excel.");
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (filteredAttendance.length === 0) {
        setAiInsight("Belum ada data untuk dianalisis pada periode ini.");
        return;
      }
      setLoadingAnalysis(true);
      const res = await getPeriodicReportAnalysis(period, students, filteredAttendance);
      setAiInsight(res || "Analisis tidak tersedia.");
      setLoadingAnalysis(false);
    };
    fetchAnalysis();
  }, [period, filteredAttendance, students]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan & Rekapitulasi</h2>
          <p className="text-slate-500 font-medium">Data kehadiran kolektif dan individu</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
            {['harian', 'mingguan', 'bulanan'].map(opt => (
              <button key={opt} onClick={() => {setPeriod(opt as PeriodType); setCurrentDate(new Date())}} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${period === opt ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-400 hover:text-emerald-600'}`}>
                {opt}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button 
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl transition-all shadow-lg font-black uppercase tracking-widest text-[10px] active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>{isExporting ? 'Proses...' : 'Ekspor Excel'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <button onClick={() => navigatePeriod(-1)} className="p-3 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all"><ChevronLeft className="w-6 h-6" /></button>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs">{getPeriodDisplay()}</h3>
        </div>
        <button onClick={() => navigatePeriod(1)} className="p-3 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all"><ChevronRight className="w-6 h-6" /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-emerald-600" />
               Grafik Partisipasi Siswa
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData}>
                  <defs>
                    <linearGradient id="colorKehadiran" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value} Siswa`, 'Hadir']}
                  />
                  <Area type="monotone" dataKey="Kehadiran" stroke="#059669" strokeWidth={4} fillOpacity={1} fill="url(#colorKehadiran)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BrainCircuit className="w-6 h-6 text-emerald-100" />
                </div>
                <h3 className="font-bold text-xl tracking-tight">AI Periodic Insights</h3>
              </div>
              <div className="text-emerald-50 text-sm leading-relaxed">
                {loadingAnalysis ? (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.5s]"></div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line font-medium opacity-95">{aiInsight}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-600" /> Perbandingan Status
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={6}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Hadir</p>
                <p className="text-2xl font-black text-emerald-900">{stats.hadir}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Alpa</p>
                <p className="text-2xl font-black text-rose-900">{stats.alpa}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm uppercase tracking-widest">Informasi Rekap</h4>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                   <span className="text-xs text-slate-400 font-medium">Rentang Hari</span>
                   <span className="text-xs font-bold">{datesInRange.length} Hari Efektif</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                   <span className="text-xs text-slate-400 font-medium">Siswa Terdaftar</span>
                   <span className="text-xs font-bold">{students.length} Siswa</span>
                </div>
                <div className="flex justify-between items-center py-3">
                   <span className="text-xs text-slate-400 font-medium">Persentase Kehadiran</span>
                   <span className="text-xs font-bold text-emerald-400">{stats.totalChecks > 0 ? ((stats.hadir / stats.totalChecks) * 100).toFixed(1) : 0}%</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
