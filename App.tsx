
import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Users, Clock, Radio, BarChart3, Bell, LogOut, 
  Search, FileText, Settings as SettingsIcon, ShieldCheck,
  ChevronLeft, ChevronRight, Menu, AlertTriangle, X, Cpu
} from 'lucide-react';
import { Student, AttendanceRecord, View, SchoolProfile, UserProfile, UserAccount } from './types';
import { INITIAL_STUDENTS } from './constants';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import AttendanceHistory from './components/AttendanceHistory';
import RFIDSimulator from './components/RFIDSimulator';
import Reports from './components/Reports';
import SchoolSettings from './components/SchoolSettings';
import UserManagement from './components/UserManagement';
import Login from './components/Login';

const DEFAULT_SCHOOL: SchoolProfile = {
  name: 'SMP Digital Indonesia',
  appTitle: 'Absensi RFID SMP',
  address: 'Jl. Pendidikan No. 123, Jakarta Selatan',
  principal: 'Dr. Ahmad Subarjo, M.Pd',
  academicYear: '2023/2024',
  semester: 'Ganjil',
  lateTime: '07:00',
  outTime: '14:00',
  logoUrl: '',
  availableClasses: ['7-A', '7-B', '8-A', '8-B', '9-A', '9-B', '9-C']
};

const INITIAL_USERS: UserAccount[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=059669&color=fff'
  },
  {
    id: '2',
    username: 'staff',
    password: 'staff123',
    name: 'Staf Piket',
    role: 'user',
    avatar: 'https://ui-avatars.com/api/?name=Staff&background=10b981&color=fff'
  }
];

// Helper to get consistent local date string YYYY-MM-DD
const getLocalDateString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('smp_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('smp_users_list');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('smp_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('smp_attendance');
    return saved ? JSON.parse(saved) : [];
  });
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem('smp_school_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SCHOOL, ...parsed };
    }
    return DEFAULT_SCHOOL;
  });

  const [lastPhysicalScan, setLastPhysicalScan] = useState<{name: string, type: string} | null>(null);

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

  useEffect(() => {
    if (lastPhysicalScan) {
      const timer = setTimeout(() => setLastPhysicalScan(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastPhysicalScan]);

  useEffect(() => {
    let rfidBuffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      // Increased buffer time to 100ms for more stable scanner reading
      if (currentTime - lastKeyTime > 100) {
        rfidBuffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (rfidBuffer.length > 2) {
          processPhysicalRFID(rfidBuffer.trim());
        }
        rfidBuffer = "";
      } else if (e.key.length === 1) {
        rfidBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [students, schoolProfile, attendance]);

  const processPhysicalRFID = (uid: string) => {
    const student = students.find(s => s.rfidUid === uid);
    if (student) {
      const today = getLocalDateString();
      const studentTodayRecords = attendance
        .filter(a => a.studentId === student.id && a.timestamp.startsWith(today))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const lastRecord = studentTodayRecords[0];
      const type = lastRecord?.type === 'IN' ? 'OUT' : 'IN';
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      
      if (type === 'OUT' && timeStr < schoolProfile.outTime) {
        setLastPhysicalScan({ name: `${student.name} (Belum Jam Pulang)`, type: 'ERROR' });
        speakFeedback("Belum jam pulang!");
        return;
      }

      if (lastRecord && lastRecord.type === type) {
        setLastPhysicalScan({ name: `${student.name} (Sudah Tap)`, type: 'ERROR' });
        return;
      }

      if (type === 'IN') {
        if (timeStr > schoolProfile.lateTime) {
          speakFeedback("Anda terlambat");
        } else {
          speakFeedback("Terima kasih, selamat belajar");
        }
      } else {
        speakFeedback("Hati-hati di jalan");
      }

      addRecord(student.id, type);
      setLastPhysicalScan({ name: student.name, type: type === 'IN' ? 'MASUK' : 'KELUAR' });
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } else {
      setLastPhysicalScan({ name: `Kartu Tak Dikenal`, type: 'UNKNOWN' });
      speakFeedback("Kartu tidak terdaftar");
    }
  };

  useEffect(() => {
    localStorage.setItem('smp_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('smp_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('smp_school_profile', JSON.stringify(schoolProfile));
    document.title = schoolProfile.appTitle;
  }, [schoolProfile]);

  useEffect(() => {
    localStorage.setItem('smp_users_list', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smp_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smp_user');
    }
  }, [currentUser]);

  const confirmLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smp_user');
    setActiveView('dashboard');
    setShowLogoutConfirm(false);
    setIsMobileMenuOpen(false);
  };

  const addRecord = (studentId: string, type: 'IN' | 'OUT') => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    
    let status: 'ON_TIME' | 'LATE' | undefined;
    if (type === 'IN') {
      status = timeStr > schoolProfile.lateTime ? 'LATE' : 'ON_TIME';
    }

    const newRecord: AttendanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      studentId,
      timestamp: now.toISOString(),
      type,
      status
    };
    setAttendance(prev => [newRecord, ...prev]);
  };

  if (!currentUser) {
    return <Login users={users} onLogin={setCurrentUser} schoolName={schoolProfile.appTitle} logoUrl={schoolProfile.logoUrl} />;
  }

  const isAdmin = currentUser.role === 'admin';
  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'students', icon: Users, label: 'Data Siswa' },
    { id: 'history', icon: Clock, label: 'Riwayat Presensi' },
    { id: 'reports', icon: FileText, label: 'Rekap Laporan' },
    { id: 'rfid-sim', icon: Radio, label: 'RFID Simulator' },
    ...(isAdmin ? [
      { id: 'users', icon: ShieldCheck, label: 'Manajemen Akun' },
      { id: 'settings', icon: SettingsIcon, label: 'Pengaturan' }
    ] : []),
  ];

  const handleNavClick = (viewId: View) => {
    setActiveView(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden h-screen">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar (Drawer) */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-emerald-950 text-white z-[160] md:hidden transition-transform duration-300 ease-in-out transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl flex flex-col`}>
        <div className="p-6 flex items-center justify-between border-b border-emerald-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center overflow-hidden">
              {schoolProfile.logoUrl ? (
                <img src={schoolProfile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <Layout className="w-6 h-6" />
              )}
            </div>
            <h1 className="font-bold text-lg truncate">{schoolProfile.appTitle}</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-lg text-emerald-300">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as View)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                activeView === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-300/70 hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-emerald-900/30">
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-4 px-5 py-4 text-emerald-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Physical Scan Toast Notification */}
      {lastPhysicalScan && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 duration-300 w-[90%] max-w-sm">
          <div className={`px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border-2 ${
            lastPhysicalScan.type === 'ERROR' || lastPhysicalScan.type === 'UNKNOWN' 
            ? 'bg-rose-600 border-rose-400 text-white' 
            : 'bg-emerald-600 border-emerald-400 text-white'
          }`}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">RFID Scanner</p>
              <h4 className="font-bold text-md leading-none truncate">{lastPhysicalScan.name}</h4>
              <p className="text-[10px] font-medium mt-1 uppercase tracking-widest">{lastPhysicalScan.type}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Keluar</h3>
              <p className="text-slate-500 text-sm font-medium">Apakah Anda yakin ingin mengakhiri sesi ini?</p>
              <div className="flex gap-3 w-full mt-8">
                <button onClick={confirmLogout} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 active:scale-95 transition-transform">Ya, Keluar</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-transform">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-emerald-950 text-white flex-shrink-0 hidden md:flex flex-col transition-all duration-300 border-r border-emerald-900`}>
        <div className="p-6 flex items-center justify-between border-b border-emerald-900/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 overflow-hidden shadow-lg shadow-emerald-900/20">
              {schoolProfile.logoUrl ? (
                <img src={schoolProfile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <Layout className="w-6 h-6" />
              )}
            </div>
            {!isSidebarCollapsed && <h1 className="font-bold text-lg truncate animate-in fade-in duration-300">{schoolProfile.appTitle}</h1>}
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-1.5 hover:bg-white/10 rounded-lg text-emerald-300 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3.5 rounded-2xl transition-all ${
                activeView === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-300/60 hover:bg-white/5'
              }`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-wide animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-900/50">
          <div className={`px-4 py-3 mb-4 bg-emerald-900/30 rounded-2xl flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            {!isSidebarCollapsed && <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-in fade-in duration-300">RFID Scanner Aktif</span>}
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3.5 text-emerald-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all`}>
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && <span className="font-bold text-sm">Keluar</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-[100] shrink-0">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden sm:block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            {schoolProfile.name} • {schoolProfile.academicYear}
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
               <Cpu className="w-4 h-4 text-emerald-600" />
               <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Sistem Online</span>
            </div>
            <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-black text-xs shadow-sm overflow-hidden">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && <Dashboard students={students} attendance={attendance} school={schoolProfile} />}
            {activeView === 'students' && <StudentManagement students={students} setStudents={setStudents} userRole={currentUser.role} schoolClasses={schoolProfile.availableClasses} />}
            {activeView === 'history' && <AttendanceHistory students={students} attendance={attendance} setAttendance={setAttendance} userRole={currentUser.role} />}
            {activeView === 'reports' && <Reports students={students} attendance={attendance} userRole={currentUser.role} />}
            {activeView === 'rfid-sim' && <RFIDSimulator students={students} school={schoolProfile} attendance={attendance} onScan={addRecord} />}
            {activeView === 'users' && isAdmin && <UserManagement users={users} setUsers={setUsers} currentUser={currentUser} />}
            {activeView === 'settings' && isAdmin && <SchoolSettings profile={schoolProfile} setProfile={setSchoolProfile} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
