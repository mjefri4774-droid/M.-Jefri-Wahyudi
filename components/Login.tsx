
import React, { useState } from 'react';
import { Layout, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { UserProfile, UserAccount } from '../types';

interface LoginProps {
  users: UserAccount[];
  onLogin: (user: UserProfile) => void;
  schoolName?: string;
  logoUrl?: string;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, schoolName = 'SMP Digital Indonesia', logoUrl }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulasi delay autentikasi
    setTimeout(() => {
      const foundUser = users.find(u => u.username === username && u.password === password);
      
      if (foundUser) {
        // Jangan kirim password ke state profil
        const { password: _, ...profile } = foundUser;
        onLogin(profile);
      } else {
        setError('Username atau password tidak terdaftar di sistem.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-800/20 rounded-full -mr-64 -mt-64 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-white shadow-2xl mx-auto mb-6 border border-white/20 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} className="w-full h-full object-cover" alt="School Logo" />
            ) : (
              <Layout className="w-12 h-12 text-emerald-400" />
            )}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">{schoolName}</h1>
          <p className="text-emerald-300/80 font-medium text-sm mt-2">Sistem Absensi RFID Terpadu</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10">
          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Otorisasi Akses</h2>
          <p className="text-slate-400 text-sm mb-10 font-medium">Silakan masuk untuk mengelola sistem absensi</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Username</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-12 pr-4 py-4.5 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-slate-50 font-bold text-slate-900 placeholder:text-slate-300"
                  placeholder="Nama Pengguna"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-12 pr-14 py-4.5 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all bg-slate-50 font-bold text-slate-900 placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-emerald-100 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-center text-[10px] text-emerald-700 font-black uppercase tracking-widest leading-relaxed">
                Default Access:<br/>
                <span className="text-emerald-900">User: admin / Pass: admin123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
