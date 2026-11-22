import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Search,
  Filter,
  User,
  Building,
  Image as ImageIcon,
  Send,
  UserCheck,
  ChevronRight,
  RefreshCw,
  X,
  ExternalLink,
  ShieldAlert,
  Flame,
  Phone,
  Mail,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import api from '../../services/api';
import { formatDateTime, formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
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

const STAFF_ROSTER = [
  { name: 'Ramesh Sharma (Mess Bhaiya)', role: 'Mess Administrator' },
  { name: 'Chef Suresh Kumar', role: 'Head Chef (Kitchen & Food Quality)' },
  { name: 'Mahesh Verma', role: 'Hygiene & Cleanliness Supervisor' },
  { name: 'Prof. K. N. Verma', role: 'Mess Warden (Escalations & Discipline)' },
  { name: 'Rajesh Plumber / Tech', role: 'Water Cooler & Utilities Maintenance' },
  { name: 'Sanjay Caterer', role: 'Pantry & Service Line Incharge' },
];

export const AdminComplaints = () => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    reopened: 0,
  });

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Complaint for detailed inspection
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Status & Reply Form
  const [statusChoice, setStatusChoice] = useState('UNDER REVIEW');
  const [adminResponseText, setAdminResponseText] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assign Form
  const [selectedStaffIndex, setSelectedStaffIndex] = useState(0);
  const [assigningStaff, setAssigningStaff] = useState(false);

  // Thread Reply
  const [threadReply, setThreadReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Photo Zoom Lightbox
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);

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

  const handleOpenInspector = (complaint) => {
    setSelectedComplaint(complaint);
    setStatusChoice(complaint.status);
    setAdminResponseText(complaint.adminResponse || '');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdatingStatus(true);
    try {
      const res = await api.put(`/complaints/${selectedComplaint._id}/status`, {
        status: statusChoice,
        adminResponse: adminResponseText.trim(),
      });

      if (res.data?.success) {
        showToast(
          `Ticket #${selectedComplaint.ticketNumber} marked as ${statusChoice} and student notified!`,
          'success'
        );
        setSelectedComplaint(res.data.data);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedComplaint) return;
    const staff = STAFF_ROSTER[selectedStaffIndex];

    setAssigningStaff(true);
    try {
      const res = await api.put(`/complaints/${selectedComplaint._id}/assign`, {
        assignedName: staff.name,
        assignedRole: staff.role,
      });

      if (res.data?.success) {
        showToast(
          `Assigned to ${staff.name} (${staff.role}) and student notified!`,
          'success'
        );
        setSelectedComplaint(res.data.data);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign staff', 'error');
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleSendThreadReply = async (e) => {
    e.preventDefault();
    if (!threadReply.trim() || !selectedComplaint) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/complaints/${selectedComplaint._id}/reply`, {
        message: threadReply.trim(),
      });
      if (res.data?.success) {
        showToast('Reply dispatched to student!', 'success');
        setThreadReply('');
        setSelectedComplaint(res.data.data);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
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
            <span>Hostel Grievance Redressal Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Mess Complaints & Helpdesk Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review student grievances, inspect photo evidence, assign personnel, reply to issues, and resolve complaints.
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-500">All Grievances</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-amber-600">Submitted (New)</p>
          <p className="text-2xl font-black text-amber-700 mt-0.5">{stats.submitted || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-purple-600">Under Review</p>
          <p className="text-2xl font-black text-purple-700 mt-0.5">{stats.underReview || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-blue-600">In Progress</p>
          <p className="text-2xl font-black text-blue-700 mt-0.5">{stats.inProgress || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-emerald-600">Resolved</p>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">{stats.resolved || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-rose-600">Reopened</p>
          <p className="text-2xl font-black text-rose-700 mt-0.5">{stats.reopened || 0}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, student name, room 101, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-rose-500"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
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

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 p-2 bg-white font-medium max-w-[190px]"
          >
            <option value="All">All 8 Categories</option>
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

      {/* Complaints Table */}
      {loading ? (
        <LoadingSkeleton count={4} type="table" />
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Complaints Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All student complaints in this view are resolved or none match your filter settings.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Student & Room</th>
                  <th className="py-3 px-4">Category & Title</th>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Personnel</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => handleOpenInspector(c)}
                  >
                    {/* Ticket */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      #{c.ticketNumber}
                      {c.isReopened && (
                        <span className="block mt-0.5 text-[10px] text-rose-600 font-bold uppercase">
                          ● Reopened
                        </span>
                      )}
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.studentName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{c.studentRoom}</span>
                      </div>
                    </td>

                    {/* Category & Title */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {c.category}
                      </span>
                      <p className="font-semibold text-slate-800 line-clamp-1 mt-1">{c.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatDateTime(c.incidentDate || c.createdAt)}
                      </p>
                    </td>

                    {/* Photo Evidence Thumbnail */}
                    <td className="py-3.5 px-4">
                      {c.imageUrl ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomPhotoUrl(c.imageUrl);
                          }}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 relative group cursor-zoom-in"
                        >
                          <img src={c.imageUrl} alt="Proof" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(
                          c.status
                        )}`}
                      >
                        ● {c.status}
                      </span>
                    </td>

                    {/* Assigned */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.assignedTo?.name && c.assignedTo.name !== 'Unassigned' ? (
                        <div>
                          <p className="font-bold text-blue-900">{c.assignedTo.name}</p>
                          <p className="text-[10px] text-slate-500">{c.assignedTo.role}</p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInspector(c);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold transition-all text-xs"
                      >
                        Inspect & Act
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLAINT INSPECTOR & RESOLUTION MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
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
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(
                      selectedComplaint.priority
                    )}`}
                  >
                    {selectedComplaint.priority} Priority
                  </span>
                  {selectedComplaint.isReopened && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                      REOPENED TICKET
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedComplaint.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Profile & Room Banner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Complainant</span>
                <span className="font-bold text-slate-900">{selectedComplaint.studentName}</span>
                <span className="text-[11px] text-slate-500 block">
                  ID: {selectedComplaint.studentId || selectedComplaint.student?.studentId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Room & Block</span>
                <span className="font-bold text-slate-900">{selectedComplaint.studentRoom}</span>
                <span className="text-[11px] text-slate-500 block">
                  Contact: {selectedComplaint.studentPhone || selectedComplaint.student?.phone || 'On Record'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Incident Timestamp</span>
                <span className="font-bold text-slate-900">
                  {formatDateTime(selectedComplaint.incidentDate || selectedComplaint.createdAt)}
                </span>
              </div>
            </div>

            {/* Description & Photo Evidence */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Student's Detailed Description:
                </span>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap">
                  {selectedComplaint.description}
                </div>
              </div>

              {selectedComplaint.isReopened && selectedComplaint.reopenReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                  <strong className="block text-[10px] uppercase font-bold text-rose-700 mb-0.5">
                    Reason for Reopening by Student:
                  </strong>
                  <span>"{selectedComplaint.reopenReason}"</span>
                </div>
              )}

              {/* Photo Evidence */}
              {selectedComplaint.imageUrl && (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    Uploaded Photo Evidence:
                  </span>
                  <div
                    onClick={() => setZoomPhotoUrl(selectedComplaint.imageUrl)}
                    className="relative h-44 rounded-xl overflow-hidden border border-slate-200 cursor-zoom-in group"
                  >
                    <img
                      src={selectedComplaint.imageUrl}
                      alt="Photo evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1">
                      <ImageIcon className="w-4 h-4" />
                      <span>Click to Enlarge Full Photo</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION SECTION 1: ASSIGN PERSONNEL */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Assign Complaint to Mess Staff / Specialist</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={selectedStaffIndex}
                  onChange={(e) => setSelectedStaffIndex(Number(e.target.value))}
                  className="flex-1 text-xs rounded-xl border border-blue-300 p-2.5 bg-white font-medium"
                >
                  {STAFF_ROSTER.map((staff, idx) => (
                    <option key={idx} value={idx}>
                      {staff.name} — {staff.role}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssignStaff}
                  disabled={assigningStaff}
                  className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {assigningStaff ? 'Assigning...' : 'Assign Staff'}
                </button>
              </div>

              {selectedComplaint.assignedTo?.name && selectedComplaint.assignedTo.name !== 'Unassigned' && (
                <p className="text-[11px] text-blue-800 font-medium pt-1">
                  Currently assigned to:{' '}
                  <strong>
                    {selectedComplaint.assignedTo.name} ({selectedComplaint.assignedTo.role})
                  </strong>{' '}
                  on {formatDate(selectedComplaint.assignedTo.assignedAt || selectedComplaint.updatedAt)}
                </p>
              )}
            </div>

            {/* ACTION SECTION 2: STATUS UPDATE & ADMIN RESPONSE */}
            <form onSubmit={handleUpdateStatus} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Update Complaint Status & Send Resolution Message
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Select New Status
                  </label>
                  <select
                    value={statusChoice}
                    onChange={(e) => setStatusChoice(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-bold"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER REVIEW">UNDER REVIEW</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{updatingStatus ? 'Updating Status...' : `Save & Notify as ${statusChoice}`}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Resolution Remarks / Reply to Student
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Counter was inspected. Additional warmers installed; staff notified about serving temperature..."
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </form>

            {/* THREADED CONVERSATION TIMELINE */}
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-2">
                Ticket Conversation Thread ({selectedComplaint.replies?.length || 1})
              </span>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {selectedComplaint.replies?.map((rep, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs ${
                      rep.authorRole === 'admin'
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                        : 'bg-slate-100 text-slate-900 border border-slate-200'
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

              {/* Reply field */}
              <form onSubmit={handleSendThreadReply} className="flex items-center space-x-2 mt-3">
                <input
                  type="text"
                  placeholder="Type an official admin message to student..."
                  value={threadReply}
                  onChange={(e) => setThreadReply(e.target.value)}
                  className="flex-1 text-xs rounded-xl border border-slate-300 p-2.5"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !threadReply.trim()}
                  className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </form>
            </div>
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

export default AdminComplaints;
