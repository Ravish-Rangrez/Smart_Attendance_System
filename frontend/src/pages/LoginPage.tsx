import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFace, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      login(res.access_token, res.user);
      success(`Welcome back, ${res.user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-100/10">
        {/* Left Pane: Branding & Hero */}
        <div className="lg:col-span-6 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 text-xs font-semibold mb-8">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span>Smart Face Recognition v1.0</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white text-blue-700 rounded-2xl shadow-xl shadow-blue-900/40">
                <ScanFace className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Smart Attendance</h1>
            </div>

            <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-sm mt-3">
              Automated facial recognition platform designed for accurate, real-time college attendance management.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="relative z-10 my-8 space-y-3">
            {[
              'Instant webcam facial detection & deep recognition',
              'Multi-sample enrollment for high precision',
              'Automatic duplicate prevention & live statistics',
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-blue-50">
                <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
            <span>Admin Portal</span>
            <span>Local & Fast MongoDB Atlas</span>
          </div>
        </div>

        {/* Right Pane: Login Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your administrative credentials to manage attendance.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@smartattendance.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 subtle-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 subtle-ring"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 disabled:opacity-60 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
