import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  UtensilsCrossed,
  Receipt,
  MessageSquareWarning,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
  Megaphone,
  History,
  Send,
  PlusCircle,
  ShieldCheck,
  FileCheck,
  User,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatINR, formatDate, formatDateTime, getStatusBadgeStyle } from '../../utils/formatters';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Modal from '../../components/common/Modal';
import RazorpayCheckoutModal from '../../components/payment/RazorpayCheckoutModal';
import ReceiptModal from '../../components/payment/ReceiptModal';

export const StudentDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);

  // Data states from MongoDB
  const [feeData, setFeeData] = useState({
    totalMessFees: 0,
    totalPaid: 0,
    totalPending: 0,
    nextDueDate: null,
    currentInvoice: null,
    invoices: [],
    payments: [],
  });
  const [todayMenu, setTodayMenu] = useState(null);
  const [selectedMealSlot, setSelectedMealSlot] = useState('lunch');
  const [announcements, setAnnouncements] = useState([]);
  const [complaints, setComplaints] = useState([]);

  // Modal triggers
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Complaint Form
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('Food Quality');
  const [complaintPriority, setComplaintPriority] = useState('Medium');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Feedback Form
  const [feedbackMealType, setFeedbackMealType] = useState('lunch');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackRemarks, setFeedbackRemarks] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const paymentHistoryRef = useRef(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [feeRes, menuRes, notifRes, complaintRes] = await Promise.all([
        api.get('/fees/my-invoices'),
        api.get('/menu/today'),
        api.get('/notifications'),
        api.get('/complaints'),
      ]);

      if (feeRes.data?.success) {
        setFeeData(feeRes.data.data);
      }

      if (menuRes.data?.success) {
        setTodayMenu(menuRes.data);
        const slot = menuRes.data.currentSlot?.slot;
        const initialSlot = ['breakfast', 'lunch', 'snacks', 'dinner'].includes(slot)
          ? slot
          : (menuRes.data.currentSlot?.nextMeal || 'lunch');
        setSelectedMealSlot(initialSlot);
      }

      if (notifRes.data?.success) {
        setAnnouncements(notifRes.data.data?.slice(0, 4) || []);
      }

      if (complaintRes.data?.success) {
        setComplaints(complaintRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Handle Quick Raise Complaint
  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    if (!complaintTitle || !complaintDesc) {
      showToast('Please provide a complaint title and description', 'error');
      return;
    }

    setSubmittingComplaint(true);
    try {
      const res = await api.post('/complaints', {
        title: complaintTitle,
        category: complaintCategory,
        priority: complaintPriority,
        description: complaintDesc,
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Complaint filed successfully!', 'success');
        setIsComplaintModalOpen(false);
        setComplaintTitle('');
        setComplaintDesc('');
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to file complaint', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Handle Quick Submit Feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const currentDay = todayMenu?.currentDay || 'Monday';
      const res = await api.post('/menu/rate', {
        dayOfWeek: currentDay,
        mealType: feedbackMealType,
        rating: feedbackRating,
        feedback: feedbackRemarks,
      });

      if (res.data?.success) {
        showToast(`Thank you! Your ${feedbackRating}-star rating was saved.`, 'success');
        setIsFeedbackModalOpen(false);
        setFeedbackRemarks('');
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit feedback', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const scrollToPaymentHistory = () => {
    if (paymentHistoryRef.current) {
      paymentHistoryRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('fees');
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  const currentInvoice = feeData.currentInvoice;
  const currentSlot = todayMenu?.currentSlot || { slot: 'lunch', label: 'Lunch', timing: '12:30 PM - 02:30 PM' };
  const displayedMealKey = selectedMealSlot || (['breakfast', 'lunch', 'snacks', 'dinner'].includes(currentSlot.slot) ? currentSlot.slot : (currentSlot.nextMeal || 'lunch'));
  const currentMealData = todayMenu?.data ? todayMenu.data[displayedMealKey] : null;

  return (
    <div className="space-y-6">
      {/* 1. Welcome Message with Profile Photo, Name, Student ID, Room & Hostel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white p-6 sm:p-8 shadow-xl border border-navy-800">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-5">
            {/* Student Photo */}
            <div className="relative">
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Student')}&backgroundColor=0f172a&textColor=10b981`
                }
                alt={user?.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-navy-900 rounded-full" />
            </div>

            {/* Student Identification & Room Details */}
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hostel Resident Student</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Welcome back, {user?.name}!
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Student ID / Enrollment: <strong className="text-emerald-300">{user?.studentId || 'N/A'}</strong>
              </p>
              <p className="text-xs text-slate-300">
                {user?.hostelName || 'Hostel Campus'} • {user?.hostelBlock || 'Block A'} • Room <strong className="text-white">{user?.roomNumber || '101'}</strong> ({user?.bedNumber || 'Bed-1'})
              </p>
            </div>
          </div>

          {/* Current Month Mess Fee & Due Date Banner */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs space-y-2 min-w-[240px] text-center sm:text-left self-stretch md:self-auto">
            <div className="flex justify-between items-center text-slate-300">
              <span>Current Mess Bill:</span>
              <strong className="text-white text-sm">
                {formatINR(currentInvoice?.totalAmount || user?.monthlyMessPlan || 3800)}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Fee Status:</span>
              <Badge variant={currentInvoice?.status || (feeData.totalPending === 0 ? 'Paid' : 'Pending')}>
                {currentInvoice?.status || (feeData.totalPending === 0 ? 'Paid' : 'Pending')}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Payment Due:</span>
              <strong className="text-amber-300">
                {feeData.nextDueDate ? formatDate(feeData.nextDueDate) : '10th of Next Month'}
              </strong>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              className="w-full mt-2 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1"
            >
              <User className="w-3.5 h-3.5" />
              <span>View Full Profile</span>
            </button>
          </div>
        </div>

        {/* Subtle Watermark */}
        <div className="absolute right-4 -bottom-8 opacity-5 text-white pointer-events-none hidden sm:block">
          <UtensilsCrossed className="w-72 h-72" />
        </div>
      </div>

      {/* 2. Four Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mess Fees"
          value={formatINR(feeData.totalMessFees || 3800)}
          subtext="Total billed mess subscription"
          icon={Receipt}
          color="blue"
        />

        <StatCard
          title="Paid Amount"
          value={formatINR(feeData.totalPaid || 0)}
          subtext="Cleared payments"
          icon={CheckCircle2}
          color="green"
        />

        <StatCard
          title="Pending Amount"
          value={formatINR(feeData.totalPending || 0)}
          subtext={feeData.totalPending > 0 ? 'Outstanding balance due' : 'All fees cleared!'}
          icon={CreditCard}
          color={feeData.totalPending > 0 ? 'rose' : 'green'}
        />

        <StatCard
          title="Next Due Date"
          value={feeData.nextDueDate ? formatDate(feeData.nextDueDate) : 'Clear'}
          subtext="Deadline for mess charges"
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* 3. Quick-Action Section (5 Working Functional Actions) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
            <p className="text-xs text-slate-500">Perform essential mess operations instantly</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600">5 Quick Tools</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Action 1: Pay Mess Fees */}
          <button
            onClick={() => {
              if (currentInvoice && currentInvoice.status !== 'Paid') {
                setCheckoutInvoice(currentInvoice);
              } else {
                onNavigate('fees');
              }
            }}
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">Pay Mess Fees</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Online Razorpay portal</p>
            </div>
          </button>

          {/* Action 2: View Menu */}
          <button
            onClick={() => onNavigate('menu')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-800">View Menu</p>
              <p className="text-[11px] text-slate-500 mt-0.5">7-Day weekly planner</p>
            </div>
          </button>

          {/* Action 3: Raise Complaint */}
          <button
            onClick={() => setIsComplaintModalOpen(true)}
            className="p-4 rounded-2xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/40 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-rose-800">Raise Complaint</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Report quality / service</p>
            </div>
          </button>

          {/* Action 4: Submit Feedback */}
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="p-4 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-800">Submit Feedback</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Rate today's food</p>
            </div>
          </button>

          {/* Action 5: Payment History */}
          <button
            onClick={scrollToPaymentHistory}
            className="p-4 rounded-2xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 text-left transition-all group flex flex-col justify-between col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-purple-800">Payment History</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Receipts & paid dues</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Two Columns: Today's Menu & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Mess Menu */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Today's Mess Menu ({todayMenu?.currentDay || 'Today'})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Current Service: <strong className="text-emerald-700">{currentSlot.label}</strong> ({currentSlot.timing})
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                currentSlot.slot === displayedMealKey
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {currentSlot.slot === displayedMealKey ? 'Live Serving' : 'Daily Schedule'}
              </span>
            </div>

            {/* Meal Slot Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { id: 'breakfast', label: 'Breakfast', timing: '07:30 - 09:30 AM' },
                { id: 'lunch', label: 'Lunch', timing: '12:30 - 02:30 PM' },
                { id: 'snacks', label: 'Snacks', timing: '05:00 - 06:15 PM' },
                { id: 'dinner', label: 'Dinner', timing: '08:00 - 10:00 PM' },
              ].map((slot) => {
                const isCurrentLive = currentSlot.slot === slot.id;
                const isSelected = displayedMealKey === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedMealSlot(slot.id)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{slot.label}</span>
                      {isCurrentLive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Serving Now" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{slot.timing}</p>
                  </button>
                );
              })}
            </div>

            {currentMealData ? (
              <div className="space-y-3">
                {currentMealData.image && (
                  <div className="relative h-28 rounded-xl overflow-hidden mb-3 border border-slate-200">
                    <img
                      src={currentMealData.image}
                      alt={displayedMealKey}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="font-bold capitalize">{displayedMealKey} Special</span>
                      <span className="text-[11px] bg-emerald-500/90 px-2 py-0.5 rounded-full font-bold">
                        {currentMealData.calories || '~550'} kcal
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Offering Items:</span>
                  <span className="font-semibold text-slate-700">Estimated {currentMealData.calories || '~550 kcal'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentMealData.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center space-x-2 text-xs font-medium text-slate-800"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {currentMealData.isSpecial && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2 font-semibold">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Special: {currentMealData.specialNote || 'Chef Special'}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">No active meal scheduled right now.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Want to see all 7 days of the week?</span>
            <button
              onClick={() => onNavigate('menu')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>Explore 7-Day Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Notices</h3>
                <p className="text-xs text-slate-500">Hostel Mess Announcements</p>
              </div>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No new announcements.</p>
              ) : (
                announcements.map((notif) => (
                  <div
                    key={notif._id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">{notif.title}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Announcements are updated live by the Mess Bhaiya and Hostel Warden.
          </div>
        </div>
      </div>

      {/* Open Complaints & Their Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Open Complaints & Grievance Status</h3>
              <p className="text-xs text-slate-500">Track issues filed with the mess committee</p>
            </div>
          </div>

          <button
            onClick={() => setIsComplaintModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Raise Complaint</span>
          </button>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p>No active complaints reported. Everything is running smoothly!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <div key={c._id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      #{c.ticketNumber}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{c.title}</h4>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{c.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={c.priority}>{c.priority}</Badge>
                    <Badge variant={c.status}>{c.status}</Badge>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                {c.adminResponse && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between font-bold text-emerald-800">
                      <span>Mess Administration Resolution:</span>
                      {c.resolvedByName && (
                        <span className="text-[10px] text-emerald-600">By {c.resolvedByName}</span>
                      )}
                    </div>
                    <p>{c.adminResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Need to track status or reopen a previous ticket?</span>
          <button
            onClick={() => onNavigate('complaints')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
          >
            <span>Open Grievance Helpdesk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Payment History */}
      <div ref={paymentHistoryRef} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Payment History</h3>
              <p className="text-xs text-slate-500">Official fee payment transactions & receipts</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('fees')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Month</th>
                <th className="px-6 py-3.5">Amount (₹)</th>
                <th className="px-6 py-3.5">Payment Method</th>
                <th className="px-6 py-3.5">Transaction ID</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feeData.invoices?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No payment history recorded yet.
                  </td>
                </tr>
              ) : (
                feeData.invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {inv.month}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">
                      {formatINR(inv.paidAmount > 0 ? inv.paidAmount : inv.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {inv.paymentMethod !== 'None' ? inv.paymentMethod : 'Unpaid'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {inv.transactionId || (inv.status === 'Paid' ? 'VERIFIED' : 'PENDING')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={inv.status}>{inv.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === 'Paid' ? (
                        <button
                          onClick={() => setReceiptInvoice(inv)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-colors inline-flex items-center space-x-1"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setCheckoutInvoice(inv)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-colors"
                        >
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Razorpay Online Checkout Modal */}
      {checkoutInvoice && (
        <RazorpayCheckoutModal
          isOpen={!!checkoutInvoice}
          invoice={checkoutInvoice}
          onClose={() => setCheckoutInvoice(null)}
          onPaymentSuccess={() => {
            setCheckoutInvoice(null);
            fetchDashboardData();
          }}
        />
      )}

      {/* Printable Receipt Modal */}
      {receiptInvoice && (
        <ReceiptModal
          isOpen={!!receiptInvoice}
          invoice={receiptInvoice}
          onClose={() => setReceiptInvoice(null)}
        />
      )}

      {/* Modal: Raise Complaint */}
      <Modal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        title="Raise Mess Complaint / Grievance"
      >
        <form onSubmit={handleRaiseComplaint} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Complaint Subject *
            </label>
            <input
              type="text"
              required
              value={complaintTitle}
              onChange={(e) => setComplaintTitle(e.target.value)}
              placeholder="e.g. Rice was undercooked at lunch, cold chapatis..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={complaintCategory}
                onChange={(e) => setComplaintCategory(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              >
                <option value="Food Quality">Food Quality</option>
                <option value="Food Quantity">Food Quantity</option>
                <option value="Hygiene and Cleanliness">Hygiene and Cleanliness</option>
                <option value="Late Food Service">Late Food Service</option>
                <option value="Menu-Related Issues">Menu-Related Issues</option>
                <option value="Staff Behaviour">Staff Behaviour</option>
                <option value="Water Issues">Water Issues</option>
                <option value="Other Problems">Other Problems</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={complaintPriority}
                onChange={(e) => setComplaintPriority(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={complaintDesc}
              onChange={(e) => setComplaintDesc(e.target.value)}
              placeholder="Please provide details about the meal time, dining hall, and exact issue..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsComplaintModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingComplaint}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingComplaint ? 'Submitting...' : 'Submit Grievance'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Submit Feedback / Rate Meal */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Submit Food Feedback & Rating"
      >
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Meal
            </label>
            <select
              value={feedbackMealType}
              onChange={(e) => setFeedbackMealType(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snacks">Evening High-Tea & Snacks</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rating: {feedbackRating} / 5 Stars
            </label>
            <div className="flex items-center space-x-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Comments / Dish Remarks
            </label>
            <textarea
              rows={2}
              value={feedbackRemarks}
              onChange={(e) => setFeedbackRemarks(e.target.value)}
              placeholder="e.g. Paneer Butter Masala was delicious! Dal tadka was seasoned well..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingFeedback}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>{submittingFeedback ? 'Saving...' : 'Submit Rating'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
