import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Megaphone,
  Receipt,
  UtensilsCrossed,
  MessageSquareWarning,
  AlertCircle,
  UserCheck,
  Star,
  ExternalLink,
  Trash2,
  Check,
  Clock,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/formatters';

export const NotificationDropdown = ({ onNavigate }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread' | 'fee' | 'menu' | 'complaint'
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type, priority) => {
    switch (type) {
      case 'fee':
      case 'payment':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'menu':
        return <UtensilsCrossed className="w-4 h-4 text-amber-500" />;
      case 'complaint':
        return <MessageSquareWarning className="w-4 h-4 text-rose-500" />;
      case 'registration':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'feedback':
        return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
      default:
        return <Megaphone className="w-4 h-4 text-indigo-500" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'unread') return !n.isRead;
    if (filterType === 'fee') return n.type === 'fee' || n.type === 'payment';
    if (filterType === 'menu') return n.type === 'menu';
    if (filterType === 'complaint') return n.type === 'complaint';
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        title="Notifications"
        aria-label="Notification bell"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center space-x-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center space-x-1 overflow-x-auto scrollbar-none text-[11px]">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'fee', label: 'Fees & Pay' },
              { id: 'menu', label: 'Food Menu' },
              { id: 'complaint', label: 'Grievances' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-[380px]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-300" />
                <p className="font-semibold text-slate-600">No notifications here</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You're all caught up with your hostel alerts!
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif._id);
                    if (notif.link && onNavigate) {
                      const targetTab = notif.link.replace('/', '');
                      onNavigate(targetTab);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-3 group ${
                    !notif.isRead ? 'bg-emerald-50/25' : ''
                  }`}
                >
                  {/* Category Icon Badge */}
                  <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {getIcon(notif.type, notif.priority)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>{formatDateTime(notif.createdAt)}</span>
                      {notif.link && (
                        <span className="text-emerald-600 font-bold flex items-center space-x-0.5 group-hover:underline">
                          <span>View</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-center">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('notifications');
                  setIsOpen(false);
                }
              }}
              className="text-xs font-bold text-navy-900 hover:text-navy-700 hover:underline"
            >
              Open Full Notification Center & History →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
