import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  MessageCircle,
  Image as ImageIcon,
  RotateCcw,
  Calendar,
  User,
  Building,
  Check,
  ChevronRight,
  Filter,
  Search,
  X,
  ExternalLink,
  ShieldAlert,
  Flame,
  FileText,
  Upload,
} from 'lucide-react';
import api from '../../services/api';
import { formatDateTime, formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { validateAndReadImageFile } from '../../utils/imageUploadValidator';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const CATEGORIES = [
  'Food Quality',
  'Food Quantity',
  'Hygiene and Cleanliness',
  'Late Food Service',
  'Menu-Related Issues',
  'Staff Behaviour',
  'Water Issues',
  'Other Problems',
];

const PRESET_EVIDENCE = [
  { label: 'Uncooked Food', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600' },
  { label: 'Cleanliness Issue', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600' },
  { label: 'Water Problem', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600' },
  { label: 'Cold Food Serving', url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600' },
];

export const StudentComplaints = () => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, submitted: 0, underReview: 0, inProgress: 0, resolved: 0 });

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Food Quality',
    priority: 'Medium',
    description: '',
    imageUrl: '',
    incidentDate: new Date().toISOString().slice(0, 16),
  });
  const [submitting, setSubmitting] = useState(false);

  // Thread Reply State
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Reopen State
  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  // Photo Lightbox
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);

  const handleEvidenceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await validateAndReadImageFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.dataUrl }));
      showToast('Photo evidence attached successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/complaints', { params });
      if (res.data?.success) {
        setComplaints(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      showToast('Error loading complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast('Please provide a title and detailed description', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/complaints', formData);
      if (res.data?.success) {
        showToast(res.data.message || 'Complaint filed successfully!', 'success');
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          category: 'Food Quality',
          priority: 'Medium',
          description: '',
          imageUrl: '',
          incidentDate: new Date().toISOString().slice(0, 16),
        });
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to file complaint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedComplaint) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/complaints/${selectedComplaint._id}/reply`, {
        message: replyMessage.trim(),
      });
      if (res.data?.success) {
        showToast('Reply posted successfully', 'success');
        setReplyMessage('');
        // Refresh selected complaint
        setSelectedComplaint(res.data.data);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleReopenComplaint = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim() || !selectedComplaint) {
      showToast('Please provide a reason why the issue remains unresolved', 'error');
      return;
    }

    setSubmittingReopen(true);
    try {
      const res = await api.post(`/complaints/${selectedComplaint._id}/reopen`, {
        reason: reopenReason.trim(),
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Complaint reopened for admin review!', 'success');
        setIsReopenModalOpen(false);
        setReopenReason('');
        setSelectedComplaint(res.data.data);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reopen complaint', 'error');
    } finally {
      setSubmittingReopen(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'UNDER REVIEW':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN PROGRESS':
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED':
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-600 text-white';
      case 'High':
        return 'bg-amber-500 text-white';
      case 'Medium':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <MessageSquareWarning className="w-4 h-4" />
            <span>Hostel Mess Helpdesk & Grievances</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Student Complaint Management System
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Report food quality, hygiene, or staff issues, upload photo evidence, and track live resolution by Mess Bhaiya.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Mess Issue</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Total Filed</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-amber-600">Submitted / In Review</p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {(stats.submitted || 0) + (stats.underReview || 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-blue-600">In Progress</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.inProgress || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-emerald-600">Resolved</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.resolved || 0}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ticket #, title, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-rose-500"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 p-2 bg-white font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER REVIEW">Under Review</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 p-2 bg-white font-medium max-w-[180px]"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setStatusFilter('All');
              setCategoryFilter('All');
              setSearchQuery('');
              fetchComplaints();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <MessageSquareWarning className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Complaints Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't reported any mess grievances yet, or no complaints match your filter criteria.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
          >
            Report an Issue Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints.map((c) => (
            <div
              key={c._id}
              onClick={() => setSelectedComplaint(c)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Content */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    #{c.ticketNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                      c.status
                    )}`}
                  >
                    ● {c.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(
                      c.priority
                    )}`}
                  >
                    {c.priority} Priority
                  </span>
                  {c.isReopened && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>Reopened</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900">{c.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{c.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>
                    Category: <strong>{c.category}</strong>
                  </span>
                  <span>•</span>
                  <span>Incident: {formatDateTime(c.incidentDate || c.createdAt)}</span>
                  {c.assignedTo?.name && c.assignedTo.name !== 'Unassigned' && (
                    <>
                      <span>•</span>
                      <span className="text-blue-700 font-semibold">
                        Assigned to: {c.assignedTo.name} ({c.assignedTo.role})
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side Photo & Status */}
              <div className="flex items-center space-x-4 self-end md:self-center">
                {c.imageUrl && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomPhotoUrl(c.imageUrl);
                    }}
                    className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 relative group flex-shrink-0"
                    title="Click to preview photo evidence"
                  >
                    <img
                      src={c.imageUrl}
                      alt="Evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="text-right">
                  <button className="px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all flex items-center space-x-1">
                    <span>Track Ticket</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {c.replies?.length || 1} update(s)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE COMPLAINT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MessageSquareWarning className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Report Mess Grievance / Issue
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Complaint Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rice was undercooked during lunch service"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-rose-500 focus:ring-rose-500"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Complaint Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium"
                  >
                    <option value="Low">Low - General Feedback</option>
                    <option value="Medium">Medium - Normal Attention</option>
                    <option value="High">High - Prompt Action Needed</option>
                    <option value="Urgent">Urgent - Critical Health/Hygiene</option>
                  </select>
                </div>
              </div>

              {/* Date and Time */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Incident Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.incidentDate}
                  onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Detailed Description of the Issue *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain exactly what happened, which counter, time, and how it impacted hostellers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-rose-500 focus:ring-rose-500"
                />
              </div>

              {/* Photo Evidence */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Photo Evidence (Optional Image URL)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Paste image URL or click Browse..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 text-xs rounded-xl border border-slate-300 p-2.5"
                  />
                  <label className="cursor-pointer px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Browse</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEvidenceUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="p-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Preset image suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400">Quick samples:</span>
                  {PRESET_EVIDENCE.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-600/20"
                >
                  {submitting ? 'Submitting Grievance...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLAINT DETAILS & TRACKING MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    #{selectedComplaint.ticketNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                      selectedComplaint.status
                    )}`}
                  >
                    ● {selectedComplaint.status}
                  </span>
                  {selectedComplaint.isReopened && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>Reopened</span>
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedComplaint.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Progress Stepper */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Resolution Progress</p>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                {/* Step 1 */}
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mx-auto text-xs">
                    ✓
                  </div>
                  <span className="font-bold text-slate-800">Submitted</span>
                </div>

                {/* Step 2 */}
                <div className="space-y-1">
                  <div
                    className={`w-6 h-6 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                      ['UNDER REVIEW', 'IN PROGRESS', 'RESOLVED'].includes(selectedComplaint.status)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={
                      ['UNDER REVIEW', 'IN PROGRESS', 'RESOLVED'].includes(selectedComplaint.status)
                        ? 'font-bold text-slate-800'
                        : 'text-slate-400'
                    }
                  >
                    Under Review
                  </span>
                </div>

                {/* Step 3 */}
                <div className="space-y-1">
                  <div
                    className={`w-6 h-6 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                      ['IN PROGRESS', 'RESOLVED'].includes(selectedComplaint.status)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    3
                  </div>
                  <span
                    className={
                      ['IN PROGRESS', 'RESOLVED'].includes(selectedComplaint.status)
                        ? 'font-bold text-slate-800'
                        : 'text-slate-400'
                    }
                  >
                    In Progress
                  </span>
                </div>

                {/* Step 4 */}
                <div className="space-y-1">
                  <div
                    className={`w-6 h-6 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                      selectedComplaint.status === 'RESOLVED'
                        ? 'bg-emerald-600 text-white'
                        : selectedComplaint.status === 'REJECTED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {selectedComplaint.status === 'RESOLVED'
                      ? '✓'
                      : selectedComplaint.status === 'REJECTED'
                      ? '✗'
                      : '4'}
                  </div>
                  <span
                    className={
                      selectedComplaint.status === 'RESOLVED'
                        ? 'font-bold text-emerald-700'
                        : selectedComplaint.status === 'REJECTED'
                        ? 'font-bold text-rose-700'
                        : 'text-slate-400'
                    }
                  >
                    {selectedComplaint.status === 'REJECTED' ? 'Rejected' : 'Resolved'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                <span className="font-semibold text-slate-800">{selectedComplaint.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Priority</span>
                <span className="font-semibold text-slate-800">{selectedComplaint.priority}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Incident Time</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(selectedComplaint.incidentDate || selectedComplaint.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Staff</span>
                <span className="font-semibold text-blue-700">
                  {selectedComplaint.assignedTo?.name || 'Unassigned'}
                  {selectedComplaint.assignedTo?.role ? ` (${selectedComplaint.assignedTo.role})` : ''}
                </span>
              </div>
            </div>

            {/* Photo Evidence Preview */}
            {selectedComplaint.imageUrl && (
              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">Attached Photo Evidence:</p>
                <div
                  onClick={() => setZoomPhotoUrl(selectedComplaint.imageUrl)}
                  className="relative h-44 rounded-xl overflow-hidden border border-slate-200 cursor-zoom-in group"
                >
                  <img
                    src={selectedComplaint.imageUrl}
                    alt="Evidence"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1">
                    <ImageIcon className="w-4 h-4" />
                    <span>Click to Zoom</span>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Timeline & Admin Responses */}
            <div>
              <p className="text-[11px] font-bold text-slate-700 mb-2">
                Grievance History & Staff Replies ({selectedComplaint.replies?.length || 1})
              </p>
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {selectedComplaint.replies?.map((rep, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs ${
                      rep.authorRole === 'student'
                        ? 'bg-slate-100 text-slate-800 ml-4 border border-slate-200'
                        : 'bg-emerald-50 text-emerald-950 mr-4 border border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                      <span>{rep.authorName}</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        {formatDateTime(rep.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{rep.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                placeholder="Post a follow-up reply or query..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-1 text-xs rounded-xl border border-slate-300 p-2.5"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingReply ? 'Sending...' : 'Send'}</span>
              </button>
            </form>

            {/* Reopen Button if Resolved or Rejected */}
            {['RESOLVED', 'Resolved', 'REJECTED', 'Rejected'].includes(selectedComplaint.status) && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Issue still persisting despite ticket status?
                </span>
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reopen Complaint</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REOPEN MODAL */}
      {isReopenModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Reopen Complaint #{selectedComplaint.ticketNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsReopenModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please explain why this issue remains unresolved. Your ticket will be placed under <strong>Under Review</strong> and escalated directly to Mess Bhaiya for inspection.
            </p>

            <form onSubmit={handleReopenComplaint} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Reopening *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Even after the resolved status, the food was still cold during dinner today..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReopen}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all"
                >
                  {submittingReopen ? 'Escalating...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX */}
      {zoomPhotoUrl && (
        <div
          onClick={() => setZoomPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={zoomPhotoUrl}
              alt="Zoom Evidence"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentComplaints;
