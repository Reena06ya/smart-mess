import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Users,
  MessageSquareWarning,
  BarChart3,
  LogOut,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  X,
  UserCircle,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const Sidebar = ({ currentTab, onSelectTab, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const { unreadCount } = useNotification();

  const studentLinks = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'menu', label: "Today & Weekly Menu", icon: UtensilsCrossed },
    { id: 'fees', label: 'Mess Fees & Pay', icon: Receipt },
    { id: 'complaints', label: 'Complaints & Help', icon: MessageSquareWarning },
    { id: 'notifications', label: 'Alerts & Notices', icon: Bell },
    { id: 'profile', label: 'Student Profile', icon: UserCircle },
  ];

  const adminLinks = [
    { id: 'admin-dashboard', label: 'Mess Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Room & Student Records', icon: Users },
    { id: 'admin-fees', label: 'Fee Management & Bills', icon: Receipt },
    { id: 'admin-analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'menu-manager', label: 'Weekly Menu Planner', icon: UtensilsCrossed },
    { id: 'admin-complaints', label: 'Grievances & Helpdesk', icon: MessageSquareWarning },
    { id: 'notifications', label: 'Alerts & Center', icon: Bell },
  ];

  const navLinks = isAdmin ? adminLinks : studentLinks;

  const handleNavClick = (id) => {
    onSelectTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-navy-800 shadow-xl`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-navy-800/80 bg-navy-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-navy-950 font-black text-lg">
              SM
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none text-white">
                Smart Mess
              </h1>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase mt-0.5">
                Hostel Portal
              </p>
            </div>
          </div>
          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Role Pill */}
        <div className="px-5 py-3.5 bg-navy-800/40 border-b border-navy-800/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isAdmin ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {isAdmin ? 'Mess Bhaiya Portal' : 'Student Portal'}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-navy-700/60 text-slate-300">
            {user?.hostelBlock || 'Hostel'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Current User Card & Logout */}
        <div className="p-3 bg-navy-950/60 border-t border-navy-800/80">
          <div
            onClick={() => isStudent && handleNavClick('profile')}
            className={`bg-navy-800/70 rounded-xl p-2.5 flex items-center justify-between mb-2 transition-all ${
              isStudent ? 'cursor-pointer hover:bg-navy-700/80' : ''
            }`}
            title={isStudent ? 'Click to view/edit profile' : ''}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User'}
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500/50 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {isAdmin ? 'Administrator' : `Room ${user?.roomNumber || 'N/A'}`}
                </p>
              </div>
            </div>
            {isStudent && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
