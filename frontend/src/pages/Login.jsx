import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Building,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const Login = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const { loginStudent, loginAdmin } = useAuth();
  const { showToast } = useNotification();
  const [activePortal, setActivePortal] = useState('student'); // 'student' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      if (activePortal === 'student') {
        await loginStudent(email, password);
        showToast('Logged in successfully to Student Portal!', 'success');
      } else {
        await loginAdmin(email, password);
        showToast('Admin authorization verified. Welcome Mess Bhaiya!', 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setErrorMsg('');
    setLoading(true);
    try {
      if (role === 'admin') {
        setActivePortal('admin');
        await loginAdmin('bhaiya@smartmess.in', 'password123');
        showToast('Logged in as Mess Bhaiya (Admin)', 'success');
      } else {
        setActivePortal('student');
        await loginStudent('rahul@student.in', 'password123');
        showToast('Logged in as Student (Rahul Sharma)', 'success');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Left Side: Brand Story & Live Portal Info */}
        <div
          className={`p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
            activePortal === 'admin'
              ? 'bg-gradient-to-br from-navy-950 to-slate-900 text-white'
              : 'bg-gradient-to-br from-navy-900 to-navy-800 text-white'
          }`}
        >
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
                  activePortal === 'admin'
                    ? 'bg-amber-400 text-navy-950 shadow-amber-400/20'
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-navy-950 shadow-emerald-500/20'
                }`}
              >
                SM
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                  Smart Mess
                </h1>
                <p
                  className={`text-[10px] font-bold tracking-wider uppercase ${
                    activePortal === 'admin' ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {activePortal === 'admin' ? 'Mess Bhaiya Operations' : 'Student Mess Portal'}
                </p>
              </div>
            </div>

            {activePortal === 'student' ? (
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Dining Experience</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Welcome to Your Hostel Mess Portal
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Log in to view today's fresh meal offerings, pay monthly mess dues with instant Razorpay receipts, and rate dishes.
                </p>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2 mt-4">
                  <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
                    <span>✓</span>
                    <span>Razorpay UPI, Debit Card & NetBanking Payments</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
                    <span>✓</span>
                    <span>7-Day Breakfast, Lunch, Snacks & Dinner Menus</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
                    <span>✓</span>
                    <span>Official University Payment Receipts</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Administrative Control</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Mess Bhaiya Operations Terminal
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Access room-wise student records, generate monthly bills, reconcile offline cash payments, and manage weekly menus.
                </p>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1.5 mt-4">
                  <p className="font-bold text-amber-300">Security Requirement:</p>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    This login is strictly restricted to authorized hostel administrators. Students cannot log in through this gate.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              ⚡ Instant 1-Click Login Evaluation:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all border border-white/10 text-left"
              >
                <div className="font-bold text-emerald-300">Demo Student</div>
                <div className="text-[10px] text-slate-400 truncate">rahul@student.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-white text-xs font-semibold backdrop-blur-sm transition-all border border-amber-400/20 text-left"
              >
                <div className="font-bold text-amber-300">Demo Mess Bhaiya</div>
                <div className="text-[10px] text-slate-400 truncate">bhaiya@smartmess.in</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Form & Portal Tabs */}
        <div className="p-8 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Top Separate Portal Switcher */}
            <div className="flex rounded-2xl bg-slate-100 p-1 mb-6 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setActivePortal('student');
                  setErrorMsg('');
                  setEmail('');
                  setPassword('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  activePortal === 'student'
                    ? 'bg-white text-navy-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Student Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePortal('admin');
                  setErrorMsg('');
                  setEmail('');
                  setPassword('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  activePortal === 'admin'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Mess Bhaiya</span>
              </button>
            </div>

            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                {activePortal === 'student' ? 'Hostel Student Login' : 'Administrator Sign In'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {activePortal === 'student'
                  ? 'Enter your registered student email and password.'
                  : 'Enter your administrative credentials to access mess management.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {activePortal === 'student' ? 'Student Email Address' : 'Admin Email Address'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      activePortal === 'student' ? 'rahul@student.in' : 'bhaiya@smartmess.in'
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={onSwitchToForgotPassword}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5 ${
                  activePortal === 'admin'
                    ? 'bg-navy-950 hover:bg-navy-900 shadow-navy-950/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <span>
                  {loading
                    ? 'Verifying...'
                    : activePortal === 'student'
                    ? 'Sign In as Student'
                    : 'Access Admin Dashboard'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            {activePortal === 'student' ? (
              <p className="text-xs text-slate-500">
                New student joining hostel?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Create Student Account
                </button>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Only authorized administrative personnel can access or create admin accounts.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
