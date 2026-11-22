import React, { useState, useEffect } from 'react';
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
  Filter,
  Search,
  RefreshCw,
  Send,
  Calendar,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatDateTime } from '../utils/formatters';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export const NotificationsPage = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const {
    notifications,
    unreadCount,
    stats,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showToast,
  } = useNotification();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'fee' | 'menu' | 'complaint' | 'announcement' | 'adminAlerts'
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Tools
  const [runningScanner, setRunningScanner] = useState(false);
  const [scanningComplaints, setScanningComplaints] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    priority: 'normal',
    targetRole: 'student',
  });
  const [broadcasting, setBroadcasting] = useState(false);

  const getIcon = (type, priority) => {
    switch (type) {
      case 'fee':
      case 'payment':
        return <Receipt className="w-5 h-5 text-emerald-600" />;
      case 'menu':
        return <UtensilsCrossed className="w-5 h-5 text-amber-500" />;
      case 'complaint':
        return <MessageSquareWarning className="w-5 h-5 text-rose-500" />;
      case 'registration':
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      case 'feedback':
        return <Star className="w-5 h-5 text-amber-400 fill-amber-400" />;
      default:
        return <Megaphone className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      showToast('Please provide both notice title and message', 'error');
      return;
    }

    setBroadcasting(true);
    try {
      const res = await api.post('/notifications/broadcast', broadcastForm);
      if (res.data?.success) {
        showToast('Official announcement broadcasted to students!', 'success');
        setIsBroadcastModalOpen(false);
        setBroadcastForm({ title: '', message: '', priority: 'normal', targetRole: 'student' });
        fetchNotifications();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to broadcast announcement', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleRunDueScanner = async () => {
    setRunningScanner(true);
    try {
      const res = await api.post('/notifications/check-due-reminders');
      if (res.data?.success) {
        showToast(res.data.message || 'Fee due date & overdue check completed!', 'success');
        fetchNotifications();
      }
    } catch (err) {
      showToast('Error running fee due date scan', 'error');
    } finally {
      setRunningScanner(false);
    }
  };

  const handleRunComplaintsScanner = async () => {
    setScanningComplaints(true);
    try {
      const res = await api.post('/notifications/unresolved-complaints-alert');
      if (res.data?.success) {
        showToast(
          res.data.unresolvedCount > 0
            ? `Found ${res.data.unresolvedCount} unresolved complaint tickets (${res.data.urgentCount} high priority).`
            : 'No unresolved complaints pending right now!',
          'info'
        );
        fetchNotifications();
      }
    } catch (err) {
      showToast('Error checking unresolved complaints', 'error');
    } finally {
      setScanningComplaints(false);
    }
  };

  const filteredList = notifications.filter((notif) => {
    // Tab filter
    if (activeTab === 'unread' && notif.isRead) return false;
    if (activeTab === 'fee' && !['fee', 'payment'].includes(notif.type)) return false;
    if (activeTab === 'menu' && notif.type !== 'menu') return false;
    if (activeTab === 'complaint' && notif.type !== 'complaint') return false;
    if (activeTab === 'announcement' && notif.type !== 'announcement') return false;
    if (activeTab === 'adminAlerts' && !['registration', 'feedback'].includes(notif.type)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = notif.title?.toLowerCase().includes(q);
      const matchMsg = notif.message?.toLowerCase().includes(q);
      return matchTitle || matchMsg;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Central Alert Desk & Audit Feed</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Notification Center & Alert History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time notifications for mess fees, receipts, payment reminders, food menu changes, grievances, and official notices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Broadcast Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Operations Control Deck */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 rounded-2xl p-4 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Automated Alert Scanners</span>
            </div>
            <p className="text-xs text-slate-300">
              Trigger instant scans to alert students about upcoming due dates, overdue bills, and review pending grievances.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunDueScanner}
              disabled={runningScanner}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{runningScanner ? 'Scanning...' : 'Scan Due Dates & Overdue'}</span>
            </button>

            <button
              onClick={handleRunComplaintsScanner}
              disabled={scanningComplaints}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{scanningComplaints ? 'Checking...' : 'Check Unresolved Complaints'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications by title, subject, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'fee', label: 'Fees & Pay' },
            { id: 'menu', label: 'Food Menu' },
            { id: 'complaint', label: 'Grievances' },
            { id: 'announcement', label: 'Notices' },
            ...(isAdmin ? [{ id: 'adminAlerts', label: 'Registrations & Feedback' }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Notifications Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No notifications matched your search term "${searchQuery}".`
              : "You're all caught up! No notifications in this view."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((notif) => (
            <div
              key={notif._id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !notif.isRead
                  ? 'border-emerald-500/80 bg-emerald-50/15 ring-1 ring-emerald-500/20'
                  : 'border-slate-200/80'
              }`}
            >
              {/* Left Side: Icon + Message */}
              <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                <div className="p-3 rounded-xl bg-slate-100 flex-shrink-0 mt-0.5">
                  {getIcon(notif.type, notif.priority)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {notif.title}
                    </h3>
                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${getPriorityStyle(
                        notif.priority
                      )}`}
                    >
                      {notif.priority}
                    </span>
                    {!notif.isRead && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ● New
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(notif.createdAt)}</span>
                    </span>
                    <span>•</span>
                    <span className="capitalize">Type: {notif.type}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Actions */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                {notif.link && onNavigate && (
                  <button
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif._id);
                      const targetTab = notif.link.replace('/', '');
                      onNavigate(targetTab);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all flex items-center space-x-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {!notif.isRead ? (
                  <button
                    onClick={() => markAsRead(notif._id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center space-x-1"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Read</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 px-2 py-1 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Seen</span>
                  </span>
                )}

                <button
                  onClick={() => deleteNotification(notif._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Broadcast In-App Announcement
                </h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Festival Feast Tonight / Timing Revision"
                  value={broadcastForm.title}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, title: e.target.value })
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={broadcastForm.targetRole}
                    onChange={(e) =>
                      setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium"
                  >
                    <option value="student">Hostel Students Only</option>
                    <option value="all">Everyone (Students & Staff)</option>
                    <option value="admin">Admin & Staff Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e) =>
                      setBroadcastForm({ ...broadcastForm, priority: e.target.value })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Message Body *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the message that will be broadcasted to hostellers in real-time..."
                  value={broadcastForm.message}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, message: e.target.value })
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold transition-all shadow-md"
                >
                  {broadcasting ? 'Broadcasting...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
