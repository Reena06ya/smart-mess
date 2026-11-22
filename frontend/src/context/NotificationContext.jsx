import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    fee: 0,
    menu: 0,
    complaint: 0,
    announcement: 0,
  });
  const [toast, setToast] = useState(null);

  // Keep track of known notification IDs to detect real-time new arrivals
  const knownNotificationIds = useRef(new Set());
  const isInitialLoad = useRef(true);

  const showToast = (message, type = 'info', title = '') => {
    setToast({ title, message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        const fetchedNotifs = res.data.data || [];
        const newUnreadCount = res.data.unreadCount || 0;

        // Detect newly arrived notifications for in-app real-time banner
        if (!isInitialLoad.current && fetchedNotifs.length > 0) {
          const freshArrivals = fetchedNotifs.filter(
            (n) => !n.isRead && !knownNotificationIds.current.has(n._id)
          );

          if (freshArrivals.length > 0) {
            const latest = freshArrivals[0];
            showToast(
              latest.message,
              latest.priority === 'urgent' ? 'error' : latest.priority === 'high' ? 'warning' : 'success',
              `🔔 ${latest.title}`
            );
          }
        }

        // Update known IDs set
        fetchedNotifs.forEach((n) => knownNotificationIds.current.add(n._id));
        isInitialLoad.current = false;

        setNotifications(fetchedNotifs);
        setUnreadCount(newUnreadCount);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    }
  }, [user]);

  // Initial fetch and 12-second real-time in-app polling
  useEffect(() => {
    isInitialLoad.current = true;
    knownNotificationIds.current.clear();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        stats,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        showToast,
      }}
    >
      {children}

      {/* Floating In-App Real-time Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start space-x-3 animate-fade-in transition-all">
          <div
            className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 animate-ping ${
              toast.type === 'error'
                ? 'bg-rose-500'
                : toast.type === 'warning'
                ? 'bg-amber-400'
                : toast.type === 'success'
                ? 'bg-emerald-400'
                : 'bg-blue-400'
            }`}
          />
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="text-xs font-bold text-white mb-0.5 tracking-wide truncate">
                {toast.title}
              </p>
            )}
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
