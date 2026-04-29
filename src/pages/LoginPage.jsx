import { useState } from 'react';
import { loginWithEmail } from '../firebase/auth';
import { Zap, Lock, Mail, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      // AuthContext will pick up the change and redirect automatically
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes and try again.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-brand-600/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-900/10 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-surface-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">

          {/* Logo + Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 mb-4 shadow-lg shadow-brand-500/30">
              <Zap size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">EduSchedule AI</h1>
            <p className="text-slate-400 text-sm">Sign in to your school portal</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 mb-5 text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.edu"
                  className="w-full bg-surface-800 border border-white/[0.08] rounded-xl pl-10 pr-4 py-3
                             text-white placeholder-slate-600 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-800 border border-white/[0.08] rounded-xl pl-10 pr-12 py-3
                             text-white placeholder-slate-600 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
                             transition-all duration-200"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2
                         bg-gradient-to-r from-brand-600 to-purple-600
                         hover:from-brand-500 hover:to-purple-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-semibold text-sm rounded-xl
                         shadow-lg shadow-brand-500/20
                         transition-all duration-200 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-600 mt-6">
            Don't have an account? Contact your school administrator.
          </p>
        </div>

        {/* Version tag */}
        <p className="text-center text-slate-700 text-xs mt-4">EduSchedule AI · School Timetable System</p>
      </div>
    </div>
  );
}
