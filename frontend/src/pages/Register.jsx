import React, { useState } from 'react';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Phone,
  Building,
  ArrowRight,
  AlertCircle,
  Camera,
  Layers,
  DoorClosed,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { validateAndReadImageFile } from '../utils/imageUploadValidator';

export const Register = ({ onSwitchToLogin }) => {
  const { registerStudent } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    hostelName: 'Tagore Central Boys Hostel',
    blockFloor: 'Block A / 2nd Floor',
    roomNumber: '204',
    bedNumber: 'Bed-1',
    password: '',
    confirmPassword: '',
    dietPreference: 'Veg',
  });

  const avatarPresets = [
    { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' },
    { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
    { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200' },
    { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200' },
  ];

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await validateAndReadImageFile(file);
      setFormData((prev) => ({ ...prev, avatar: res.dataUrl }));
      showToast('Photo selected and validated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      showToast('Passwords do not match', 'error');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      showToast('Password too short', 'error');
      return;
    }

    setLoading(true);
    try {
      await registerStudent(formData);
      showToast('Student registered successfully! Welcome to Smart Mess.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500 text-white font-black text-xl mb-3 shadow-md shadow-emerald-500/20">
            SM
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Hostel Student Registration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Fill in your enrollment details to create your official hostel mess dining account.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector Preview */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <img
                src={formData.avatar}
                alt="Profile Preview"
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">Profile Photo</p>
                <p className="text-[10px] text-slate-400">Choose an avatar preset or paste photo URL</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {avatarPresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setFormData({ ...formData, avatar: preset.url })}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${formData.avatar === preset.url
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                      : 'border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              ))}
              <label className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-bold flex items-center space-x-1 transition-colors">
                <Upload className="w-3 h-3 text-slate-600" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 1: Personal & Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                  placeholder="e.g. Aryan Malhotra"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student ID / Enrollment No. *
              </label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g. SM-2024-055"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Section 2: Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@hostel.in"
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

          {/* Section 3: Room & Hostel Specific Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hostel Name *
              </label>
              <select
                value={formData.hostelName}
                onChange={(e) => setFormData({ ...formData, hostelName: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              >
                <option value="Tagore Central Boys Hostel">Tagore Central Boys Hostel</option>
                <option value="Sarojini Naidu Girls Hostel">Sarojini Naidu Girls Hostel</option>
                <option value="CV Raman Science Hostel">CV Raman Science Hostel</option>
                <option value="APJ Abdul Kalam PG Hostel">APJ Abdul Kalam PG Hostel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Block / Floor *
              </label>
              <input
                type="text"
                required
                value={formData.blockFloor}
                onChange={(e) => setFormData({ ...formData, blockFloor: e.target.value })}
                placeholder="e.g. Block A / 2nd Floor"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Number *
              </label>
              <div className="relative">
                <DoorClosed className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g. 204"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Diet Preference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dietary Preference *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Veg'].map((diet) => (
                <button
                  type="button"
                  key={diet}
                  onClick={() => setFormData({ ...formData, dietPreference: diet })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${formData.dietPreference === diet
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Password & Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Create Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>{loading ? 'Creating Student Account...' : 'Complete Student Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already registered as a hosteller?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-emerald-600 hover:text-emerald-700"
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
