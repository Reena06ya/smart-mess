import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const ForgotPassword = ({ onSwitchToLogin }) => {
  const { requestForgotPassword, executeResetPassword } = useAuth();
  const { showToast } = useNotification();

  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await requestForgotPassword(email);
      setResetToken(res.resetToken);
      setStep(2);
      showToast('Reset token generated! Valid for 30 minutes.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to request reset token';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await executeResetPassword(resetToken, newPassword);
      setSuccessMsg('Your password has been reset successfully! You are now logged in.');
      showToast('Password reset complete!', 'success');
      setTimeout(() => {
        // Auth state is updated in context; if needed, reload or switch view
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-navy-900 text-emerald-400 font-bold mb-3 shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {step === 1 ? 'Reset Your Mess Password' : 'Enter New Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 1
              ? 'Enter your registered email address to receive a secure password recovery token.'
              : 'Enter your recovery token and new secure password.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-xs font-semibold text-emerald-800">{successMsg}</p>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold"
            >
              Go to Dashboard / Sign In
            </button>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@student.in or bhaiya@smartmess.in"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Verifying Email...' : 'Generate Reset Token'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="flex items-center space-x-1 text-emerald-800 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Verification Token Active (Valid 30 mins)</span>
              </div>
              <p className="font-mono text-[11px] truncate text-emerald-950 font-bold bg-white p-1 rounded border border-emerald-300">
                {resetToken}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Security Reset Token *
              </label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Password (Min 6 chars) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Updating Password...' : 'Save & Log In'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
