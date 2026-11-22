import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  DoorClosed,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Utensils,
  Camera,
  RefreshCw,
  Upload,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatINR } from '../../utils/formatters';
import { validateAndReadImageFile } from '../../utils/imageUploadValidator';
import Badge from '../../components/common/Badge';

export const StudentProfile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    dietPreference: user?.dietPreference || 'Veg',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const avatarPresets = [
    { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' },
    { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
    { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200' },
    { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200' },
  ];

  // Refresh latest profile from DB
  const loadLatestProfile = async () => {
    try {
      setFetching(true);
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        const u = res.data.data;
        updateUser(u);
        setFormData((prev) => ({
          ...prev,
          name: u.name || '',
          phone: u.phone || '',
          avatar: u.avatar || '',
          dietPreference: u.dietPreference || 'Veg',
        }));
      }
    } catch (err) {
      console.warn('Error fetching latest profile:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadLatestProfile();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await validateAndReadImageFile(file);
      setFormData((prev) => ({ ...prev, avatar: res.dataUrl }));
      showToast('Profile photo uploaded and preview updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg('New passwords do not match');
        showToast('Passwords do not match', 'error');
        return;
      }
      if (formData.newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters');
        showToast('Password too short', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        avatar: formData.avatar,
        dietPreference: formData.dietPreference,
      };

      if (formData.newPassword) {
        payload.password = formData.newPassword;
      }

      const res = await api.put('/auth/profile', payload);
      if (res.data?.success) {
        updateUser(res.data.data);
        setSuccessMsg('Profile information updated successfully in database!');
        showToast('Profile updated successfully!', 'success');
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>Hosteller Record & Account</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Student Profile & Dining Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View your official hostel room allotment, account standing, and manage personal contact details.
          </p>
        </div>

        <button
          onClick={loadLatestProfile}
          disabled={fetching}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Hero Overview Card */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-navy-800 flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <img
            src={
              formData.avatar ||
              user?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Student')}`
            }
            alt={user?.name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl"
          />
          <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-navy-950 uppercase tracking-wider shadow">
            Student
          </span>
        </div>

        <div className="flex-1 text-center md:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h3 className="text-2xl font-black text-white">{user?.name}</h3>
            <Badge variant={user?.messStatus || 'Active'}>
              {user?.messStatus || 'Active'} Account
            </Badge>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Enrollment ID: <strong className="text-emerald-300">{user?.studentId || 'N/A'}</strong>
          </p>
          <p className="text-xs text-slate-300">
            {user?.hostelName || 'Hostel Campus'} • {user?.hostelBlock || 'Block A'} • Room <strong className="text-white">{user?.roomNumber || '101'}</strong> ({user?.bedNumber || 'Bed-1'})
          </p>
          <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10">
              Diet: <strong className="text-emerald-300">{user?.dietPreference || 'Veg'}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10">
              Fee Status:{' '}
              {user?.balanceDue > 0 ? (
                <strong className="text-rose-300">{formatINR(user?.balanceDue)} Due</strong>
              ) : (
                <strong className="text-emerald-300">Clear (₹0)</strong>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form Grid */}
      <form onSubmit={handleUpdate} className="space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: Editable Personal Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Personal Information (Editable)</h4>
              <p className="text-xs text-slate-500">You can update your display name, contact phone, avatar, and meal diet.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Editable by You
            </span>
          </div>

          {/* Profile Photo Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Profile Photo / Avatar
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {avatarPresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setFormData({ ...formData, avatar: preset.url })}
                  className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all ${
                    formData.avatar === preset.url
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              ))}
              <div className="flex-1 min-w-[200px] flex items-center space-x-2">
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="Or paste photo URL..."
                  className="flex-1 text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500"
                />
                <label className="cursor-pointer px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Browse</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Diet Preference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Dietary Preference *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Veg', 'Non-Veg', 'Jain', 'Eggetarian'].map((diet) => (
                <button
                  type="button"
                  key={diet}
                  onClick={() => setFormData({ ...formData, dietPreference: diet })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    formData.dietPreference === diet
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Administrative Locked Details (READ-ONLY) */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Official Hostel Allocation (Locked)
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Admin Controlled Only</span>
            </span>
          </div>

          <p className="text-xs text-slate-500">
            For security and auditing compliance, room allotments, enrollment IDs, and fee balances can only be modified by the authorized Mess Bhaiya or Hostel Warden.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Student ID / Enrollment No.
              </label>
              <input
                type="text"
                disabled
                value={user?.studentId || 'N/A'}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-mono font-bold p-2.5 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Registered Email (Primary Login)
              </label>
              <input
                type="text"
                disabled
                value={user?.email || 'N/A'}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 p-2.5 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Hostel Name
              </label>
              <input
                type="text"
                disabled
                value={user?.hostelName || 'CV Raman Hostel'}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-semibold p-2.5 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Hostel Block & Floor
              </label>
              <input
                type="text"
                disabled
                value={user?.blockFloor || user?.hostelBlock || 'Block A / 2nd Floor'}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-semibold p-2.5 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Allocated Room & Bed
              </label>
              <input
                type="text"
                disabled
                value={`Room ${user?.roomNumber || '101'} (${user?.bedNumber || 'Bed-1'})`}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold p-2.5 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Current Fee Balance Due
              </label>
              <input
                type="text"
                disabled
                value={formatINR(user?.balanceDue || 0)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-100 text-rose-700 font-extrabold p-2.5 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Optional Password Change */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-sm font-bold text-slate-900">Security & Password</h4>
            <p className="text-xs text-slate-500">Leave blank if you don't wish to change your password.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Password (Min 6 chars)
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentProfile;
