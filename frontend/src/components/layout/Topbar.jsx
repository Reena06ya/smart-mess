import React, { useState, useEffect } from 'react';
import { Menu, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';

export const Topbar = ({ onMenuClick, currentTabTitle, onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const [istTime, setIstTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dateStr = now.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      setIstTime(`${dateStr} • ${timeStr} IST`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {currentTabTitle || 'Hostel Mess Portal'}
          </h2>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {isAdmin
              ? 'Mess Bhaiya Operations & Student Records'
              : `Welcome back, ${user?.name || 'Student'}`}
          </p>
        </div>
      </div>

      {/* Right: Live IST Clock & Notifications & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Live IST Clock */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-600 text-xs font-medium border border-slate-200/60">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>{istTime}</span>
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown onNavigate={onNavigate} />

        {/* Student Room / Diet Tag */}
        {!isAdmin && (
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{user?.dietPreference || 'Veg'}</span>
            <span className="text-slate-300">•</span>
            <span>{user?.roomNumber ? `Rm ${user.roomNumber}` : 'Hostel'}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
