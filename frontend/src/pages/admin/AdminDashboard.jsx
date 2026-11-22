import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  UtensilsCrossed,
  TrendingUp,
  Receipt,
  Sparkles,
  ArrowRight,
  Megaphone,
  CheckCircle2,
  Building,
  Calendar,
  MessageSquareWarning,
  BarChart3,
} from 'lucide-react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Modal from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';

export const AdminDashboard = ({ onNavigate }) => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    vegCount: 0,
    nonVegCount: 0,
    totalBalanceDue: 0,
  });
  const [feeStats, setFeeStats] = useState({ totalCollected: 0, totalPending: 0, paidCount: 0, pendingCount: 0 });

  // Broadcast Announcement State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    const fetchAdminOverview = async () => {
      try {
        setLoading(true);
        const [studentRes, feeRes] = await Promise.all([
          api.get('/students/stats/summary'),
          api.get('/fees/all'),
        ]);

        if (studentRes.data?.success) {
          setStats(studentRes.data.data);
        }

        if (feeRes.data?.success) {
          setFeeStats(feeRes.data.stats || { totalCollected: 0, totalPending: 0, paidCount: 0, pendingCount: 0 });
        }
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminOverview();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      showToast('Please provide both title and message', 'error');
      return;
    }

    setBroadcasting(true);
    try {
      const res = await api.post('/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage,
        targetRole: 'student',
      });

      if (res.data?.success) {
        showToast('Announcement sent to all hostel students!', 'success');
        setIsBroadcastOpen(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send announcement', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white p-6 sm:p-8 shadow-xl border border-navy-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Central Mess Operations Command</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mess Bhaiya Executive Portal
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
            Monitor room-wise student records, monthly fee collections, offline cash receipts, food menus, and announcements.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={() => setIsBroadcastOpen(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all flex items-center space-x-1.5"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcast Notice</span>
          </button>
          <button
            onClick={() => onNavigate('admin-analytics')}
            className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center space-x-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Analytics & Intelligence</span>
          </button>
          <button
            onClick={() => onNavigate('admin-fees')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Fee Billing & Invoices</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Fees Collected"
          value={formatINR(feeStats.totalCollected)}
          subtext={`${feeStats.paidCount || 0} invoices settled`}
          icon={TrendingUp}
          color="green"
        />

        <StatCard
          title="Pending Mess Dues"
          value={formatINR(feeStats.totalPending || stats.totalBalanceDue)}
          subtext={`${feeStats.pendingCount || 0} pending payment`}
          icon={CreditCard}
          color="rose"
        />

        <StatCard
          title="Total Hostellers"
          value={stats.totalStudents}
          subtext={`${stats.activeStudents} Active subscribers`}
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Diet Breakdown"
          value={`${stats.vegCount} Veg`}
          subtext={`${stats.nonVegCount} Non-Veg hostellers`}
          icon={UtensilsCrossed}
          color="amber"
        />
      </div>

      {/* Operations Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div
          onClick={() => onNavigate('students')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Room & Student Records
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Filter hostellers room-wise across blocks, update bed allocations, diet preferences, and contact info.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
            <span>Manage Records</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-fees')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Fee Billing & Treasury
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Generate monthly invoices for hostellers with 1 click, record offline cash payments, and download receipts.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>Billing Treasury</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('menu-manager')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Weekly Menu Planner
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Manage breakfast, lunch, snacks, and dinner offerings for all 7 days, attach food photos, and publish weekly menus.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
            <span>Edit Food Menus</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-complaints')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
              Grievance Helpdesk
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Inspect student complaints, review photo evidence, assign personnel to issues, reply to hostellers, and resolve tickets.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>Grievance Desk</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-analytics')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              Analytics & Intelligence
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Real-time financial charts, collection rates, room ranking, complaint trends, and downloadable PDF/CSV audit reports.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
            <span>View Reports</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        title="Broadcast In-App Announcement to Hostellers"
      >
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. Special Festival Feast Tonight / Timing Revision"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Message *
            </label>
            <textarea
              required
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Detailed announcement that will instantly notify all students..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={broadcasting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span>{broadcasting ? 'Broadcasting...' : 'Broadcast to All'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
