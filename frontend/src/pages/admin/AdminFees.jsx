import React, { useState, useEffect } from 'react';
import {
  Receipt,
  PlusCircle,
  FileCheck,
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Coins,
  Send,
  Calendar,
  UserPlus,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Download,
  Eye,
  History,
  X,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ReceiptModal from '../../components/payment/ReceiptModal';
import { downloadReceiptPdf } from '../../utils/receiptPdfGenerator';

export const AdminFees = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    totalCollected: 0,
    totalPending: 0,
    paidCount: 0,
    partialCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  });

  // Filter States
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'PAID' | 'PENDING' | 'PARTIALLY PAID' | 'OVERDUE'
  const [monthFilter, setMonthFilter] = useState('All');
  const [roomFilter, setRoomFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null);

  // 1. Generate Bulk Monthly Bills Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState('November');
  const [generateYear, setGenerateYear] = useState('2026');
  const [baseFee, setBaseFee] = useState(3800);
  const [generateDueDate, setGenerateDueDate] = useState('2026-11-25');
  const [generating, setGenerating] = useState(false);

  // 2. Assign Custom / Individual Student Fee Modal
  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [indivStudentId, setIndivStudentId] = useState('');
  const [indivMonth, setIndivMonth] = useState('November');
  const [indivYear, setIndivYear] = useState('2026');
  const [indivAmount, setIndivAmount] = useState('3800');
  const [indivDueDate, setIndivDueDate] = useState('2026-11-25');
  const [indivReason, setIndivReason] = useState('Special concession / Custom mess plan');
  const [indivNotes, setIndivNotes] = useState('');
  const [savingIndividual, setSavingIndividual] = useState(false);

  // 3. Edit Invoice Amount Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editReason, setEditReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // 4. Record Offline Cash / UPI Payment Modal
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashMethod, setCashMethod] = useState('Cash'); // 'Cash' | 'UPI' | 'Bank Transfer'
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recording, setRecording] = useState(false);

  // 5. Individual Student Payment History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyPayments, setHistoryPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 6. Monthly Collection Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState('All');
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch Invoices with all active filters
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (monthFilter !== 'All') params.month = monthFilter;
      if (roomFilter !== 'All') params.roomNumber = roomFilter;
      if (search) params.search = search;

      const res = await api.get('/fees/all', { params });
      if (res.data?.success) {
        setInvoices(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      showToast('Error loading fee invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch list of students for individual assignment dropdown
  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      if (res.data?.success) {
        setStudentsList(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load students list for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchStudents();
  }, [statusFilter, monthFilter, roomFilter]);

  // Extract distinct room numbers for room filter dropdown
  const uniqueRooms = Array.from(
    new Set(invoices.map((inv) => inv.student?.roomNumber).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // Extract distinct billing months from invoices
  const uniqueMonths = Array.from(
    new Set(invoices.map((inv) => inv.month).filter(Boolean))
  );

  // 1. Bulk Generate Handler
  const handleGenerateBills = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/fees/generate-monthly', {
        month: generateMonth,
        year: generateYear,
        baseAmount: Number(baseFee),
        dueDate: generateDueDate,
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Monthly bills generated successfully!', 'success');
        setIsGenerateModalOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate bills', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // 2. Individual Custom Invoice Handler
  const handleCreateIndividualInvoice = async (e) => {
    e.preventDefault();
    if (!indivStudentId) {
      showToast('Please select a student', 'error');
      return;
    }

    setSavingIndividual(true);
    try {
      const res = await api.post('/fees/individual-invoice', {
        studentId: indivStudentId,
        month: indivMonth,
        year: indivYear,
        amount: Number(indivAmount),
        dueDate: indivDueDate,
        reason: indivReason,
        notes: indivNotes,
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Custom invoice created successfully!', 'success');
        setIsIndividualModalOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create custom invoice', 'error');
    } finally {
      setSavingIndividual(false);
    }
  };

  // 3. Edit Invoice Amount Handler
  const handleOpenEditModal = (inv) => {
    setEditingInvoice(inv);
    setEditTotalAmount(inv.totalAmount);
    setEditDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '');
    setEditReason(inv.customAmountReason || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditInvoice = async (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setSavingEdit(true);
    try {
      const res = await api.put(`/fees/update-invoice/${editingInvoice._id}`, {
        totalAmount: Number(editTotalAmount),
        dueDate: editDueDate,
        customAmountReason: editReason,
      });

      if (res.data?.success) {
        showToast('Invoice updated successfully!', 'success');
        setIsEditModalOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update invoice', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // 4. Open Offline Cash Modal
  const handleOpenCashModal = (invoice) => {
    setSelectedInvoice(invoice);
    const remaining = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));
    setCashAmount(remaining);
    setCashMethod('Cash');
    setTransactionRef('');
    setPaymentNotes('');
    setIsCashModalOpen(true);
  };

  // Submit Offline Payment
  const handleRecordOfflinePayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (Number(cashAmount) <= 0) {
      showToast('Please enter an amount greater than 0', 'error');
      return;
    }

    if (cashMethod !== 'Cash' && !transactionRef.trim()) {
      showToast('Please enter UPI / Bank Transfer transaction reference ID', 'error');
      return;
    }

    setRecording(true);
    try {
      const res = await api.post('/fees/record-cash', {
        invoiceId: selectedInvoice._id,
        amountPaid: Number(cashAmount),
        paymentMethod: cashMethod,
        transactionReference: transactionRef,
        notes: paymentNotes,
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Payment recorded successfully', 'success');
        setIsCashModalOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record payment', 'error');
    } finally {
      setRecording(false);
    }
  };

  // 5. Open Individual Payment History Modal
  const handleOpenHistoryModal = async (student) => {
    if (!student?._id) return;
    setHistoryStudent(student);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/fees/history/${student._id}`);
      if (res.data?.success) {
        setHistoryPayments(res.data.data || []);
      }
    } catch (err) {
      showToast('Failed to load student transaction history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // 6. Open Collection Report Modal
  const handleOpenReportModal = async () => {
    setIsReportModalOpen(true);
    loadReportData(monthFilter !== 'All' ? monthFilter : 'All');
  };

  const loadReportData = async (monthVal) => {
    setLoadingReport(true);
    try {
      const params = {};
      if (monthVal && monthVal !== 'All') params.month = monthVal;
      const res = await api.get('/fees/reports/monthly', { params });
      if (res.data?.success) {
        setReportData(res.data);
      }
    } catch (err) {
      showToast('Failed to generate collection report', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>Hostel Mess Treasury Operations</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Fee Billing & Collection Reconciliation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Set monthly fees, generate bills, verify offline cash/UPI payments, assign custom student plans, and audit collection reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 self-start sm:self-auto">
          {/* Action 1: Assign Custom Fee */}
          <button
            onClick={() => setIsIndividualModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            title="Assign custom fee amount to a single student"
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>Assign Custom Fee</span>
          </button>

          {/* Action 2: Generate Monthly Bills */}
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Set & Generate Monthly Bills</span>
          </button>

          {/* Action 3: View Collection Report */}
          <button
            onClick={handleOpenReportModal}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-md transition-all"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Collection Reports</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatINR(stats.totalInvoiced)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">{invoices.length} active fee records</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Collected</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatINR(stats.totalCollected)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.paidCount} fully paid • {stats.partialCount} partially paid
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
          <h3 className="text-2xl font-black text-rose-600 mt-1">{formatINR(stats.totalPending)}</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.pendingCount} unpaid • {stats.overdueCount} overdue
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collection Rate</p>
          <h3 className="text-2xl font-black text-blue-600 mt-1">
            {stats.totalInvoiced > 0
              ? Math.round((stats.totalCollected / stats.totalInvoiced) * 100)
              : 0}%
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Cash, UPI & Razorpay reconciled</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR WITH STATUS TABS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {[
            { id: 'All', label: 'All Students', count: invoices.length },
            { id: 'PAID', label: 'Paid', count: stats.paidCount },
            { id: 'PENDING', label: 'Unpaid / Pending', count: stats.pendingCount },
            { id: 'PARTIALLY PAID', label: 'Partially Paid', count: stats.partialCount },
            { id: 'OVERDUE', label: 'Overdue Dues', count: stats.overdueCount },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-emerald-500 text-navy-950 font-black' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Dropdown Filters Row */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search by Name or ID */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
              placeholder="Search by student name, enrollment ID (SM-2024-...) or room..."
              className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Month Filter */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white font-medium text-slate-700"
            >
              <option value="All">All Billing Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Room Filter */}
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white font-medium text-slate-700"
            >
              <option value="All">All Rooms</option>
              {uniqueRooms.map((r) => (
                <option key={r} value={r}>
                  Room {r}
                </option>
              ))}
            </select>

            <button
              onClick={fetchInvoices}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh table"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Hostel Student Mess Invoices</h3>
          <span className="text-xs text-slate-500">{invoices.length} records matching</span>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} type="table-row" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={Receipt}
              title="No Invoices Found"
              description="No fee records match your selected month, room, or payment status filters."
              actionLabel="Generate Bills"
              onAction={() => setIsGenerateModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Enrollment ID</th>
                  <th className="px-5 py-3.5">Room</th>
                  <th className="px-5 py-3.5">Month</th>
                  <th className="px-5 py-3.5">Total Bill</th>
                  <th className="px-5 py-3.5">Amount Paid</th>
                  <th className="px-5 py-3.5">Remaining</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const remaining = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
                  const isPaid = inv.status === 'PAID';
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleOpenHistoryModal(inv.student)}
                          className="font-bold text-slate-900 hover:text-emerald-600 text-left"
                          title="Click to view student payment ledger"
                        >
                          {inv.student?.name || 'Unknown Student'}
                        </button>
                        <p className="text-[11px] text-slate-400">{inv.student?.phone}</p>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-slate-700">
                        {inv.student?.studentId || 'N/A'}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        <span className="font-semibold">{inv.student?.hostelBlock || 'Block A'}</span>
                        <p className="text-[11px] text-slate-500">Rm {inv.student?.roomNumber || 'N/A'}</p>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-800">
                        {inv.month}
                        {inv.customAmountReason && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            Custom: {inv.customAmountReason}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-extrabold text-slate-900">
                        {formatINR(inv.totalAmount)}
                      </td>

                      <td className="px-5 py-4 font-bold text-emerald-600">
                        {formatINR(inv.paidAmount || 0)}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {remaining > 0 ? (
                          <span className="text-rose-600">{formatINR(remaining)}</span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">₹0 (Paid)</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(inv.dueDate)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : inv.status === 'PARTIALLY PAID'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : inv.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Record Offline Payment Button */}
                        {!isPaid && (
                          <button
                            onClick={() => handleOpenCashModal(inv)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                            title="Record Cash or UPI offline payment"
                          >
                            Record Offline
                          </button>
                        )}

                        {/* Edit Amount Button */}
                        <button
                          onClick={() => handleOpenEditModal(inv)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                          title="Edit fee amount / due date"
                        >
                          Edit
                        </button>

                        {/* Payment History Button */}
                        <button
                          onClick={() => handleOpenHistoryModal(inv.student)}
                          className="p-1.5 rounded-lg border border-slate-200 text-purple-600 hover:bg-purple-50 transition-colors inline-flex items-center"
                          title="View Payment Ledger"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {/* Receipt Button */}
                        {inv.paidAmount > 0 && (
                          <button
                            onClick={() => setActiveReceipt(inv)}
                            className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors inline-flex items-center"
                            title="View / Print Receipt"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Generate Monthly Bills */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Set Monthly Mess Fees & Generate Bills"
      >
        <form onSubmit={handleGenerateBills} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Month *</label>
              <select
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Year *</label>
              <input
                type="number"
                required
                value={generateYear}
                onChange={(e) => setGenerateYear(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standard Monthly Mess Fee (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date *</label>
              <input
                type="date"
                required
                value={generateDueDate}
                onChange={(e) => setGenerateDueDate(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            This will auto-generate invoices for all <strong>Active</strong> students in the hostel mess. If a student has an individual customized mess plan, their custom rate will automatically be honored.
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
            >
              {generating ? 'Generating Bills...' : 'Confirm & Publish Invoices'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Assign Custom / Individual Student Fee */}
      <Modal
        isOpen={isIndividualModalOpen}
        onClose={() => setIsIndividualModalOpen(false)}
        title="Assign Individual Fee Amount to Student"
      >
        <form onSubmit={handleCreateIndividualInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Student *</label>
            <select
              required
              value={indivStudentId}
              onChange={(e) => setIndivStudentId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
            >
              <option value="">-- Choose Hosteller Student --</option>
              {studentsList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.studentId || 'No ID'}) - Room {st.roomNumber || 'N/A'} [{st.hostelBlock}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Month *</label>
              <select
                value={indivMonth}
                onChange={(e) => setIndivMonth(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Year *</label>
              <input
                type="number"
                required
                value={indivYear}
                onChange={(e) => setIndivYear(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Mess Fee Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={indivAmount}
                onChange={(e) => setIndivAmount(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date *</label>
              <input
                type="date"
                required
                value={indivDueDate}
                onChange={(e) => setIndivDueDate(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Custom Amount *</label>
            <input
              type="text"
              required
              value={indivReason}
              onChange={(e) => setIndivReason(e.target.value)}
              placeholder="e.g. Leave concession, scholarship subsidy, special diet addon..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Notes (Optional)</label>
            <textarea
              rows="2"
              value={indivNotes}
              onChange={(e) => setIndivNotes(e.target.value)}
              placeholder="Internal record notes..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsIndividualModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingIndividual}
              className="flex-1 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold shadow-md transition-all"
            >
              {savingIndividual ? 'Assigning...' : 'Assign Custom Fee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Edit Existing Invoice Amount */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Invoice for ${editingInvoice?.student?.name || 'Student'}`}
      >
        <form onSubmit={handleSaveEditInvoice} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p>
              <strong>Month:</strong> {editingInvoice?.month}
            </p>
            <p>
              <strong>Already Paid:</strong> {formatINR(editingInvoice?.paidAmount || 0)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Adjusted Total Mess Fee (₹) *
            </label>
            <input
              type="number"
              required
              min={editingInvoice?.paidAmount || 0}
              value={editTotalAmount}
              onChange={(e) => setEditTotalAmount(e.target.value)}
              className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date *</label>
            <input
              type="date"
              required
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Adjustment</label>
            <input
              type="text"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="e.g. Approved rebate, fee correction..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
            >
              {savingEdit ? 'Updating...' : 'Save Adjustments'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Record Offline Cash or UPI Payment with Audit */}
      <Modal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        title={`Record Verified Offline Payment`}
      >
        <form onSubmit={handleRecordOfflinePayment} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <p>
              <strong>Student:</strong> {selectedInvoice?.student?.name} (ID: {selectedInvoice?.student?.studentId})
            </p>
            <p>
              <strong>Billing Period:</strong> {selectedInvoice?.month}
            </p>
            <p>
              <strong>Total Monthly Fee:</strong> {formatINR(selectedInvoice?.totalAmount)}
            </p>
            <p>
              <strong>Already Paid:</strong> {formatINR(selectedInvoice?.paidAmount || 0)}
            </p>
            <p className="font-bold text-rose-600 pt-1">
              Outstanding Remaining Balance: {formatINR(Math.max(0, (selectedInvoice?.totalAmount || 0) - (selectedInvoice?.paidAmount || 0)))}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={Math.max(0, (selectedInvoice?.totalAmount || 0) - (selectedInvoice?.paidAmount || 0))}
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 p-2.5"
              />
              <span className="text-[10px] text-slate-400">Supports partial remittance</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={cashMethod}
                onChange={(e) => setCashMethod(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-semibold"
              >
                <option value="Cash">Cash (Mess Counter)</option>
                <option value="UPI">UPI Direct / QR Transfer</option>
                <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Transaction Reference / UTR Number {cashMethod !== 'Cash' && '*'}
            </label>
            <input
              type="text"
              required={cashMethod !== 'Cash'}
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder={cashMethod === 'Cash' ? 'Optional Cash voucher / receipt ref...' : 'e.g. UPI/432109876543 / UTR-987123'}
              className="w-full text-xs font-mono rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Audit Remarks (Optional)</label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. Verified in person at Mess Hall Desk..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              This verification will be logged under administrator <strong>{user?.name || 'Mess Bhaiya'}</strong> with a precise audit timestamp.
            </span>
          </div>

          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsCashModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recording}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
            >
              {recording ? 'Recording & Issuing...' : 'Verify & Issue Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Student Payment History Ledger */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Payment Ledger for ${historyStudent?.name || 'Student'}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">{historyStudent?.name}</p>
              <p className="text-slate-500 font-mono text-[11px]">
                ID: {historyStudent?.studentId} • Room {historyStudent?.roomNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Dues</span>
              <p className="font-black text-rose-600 text-sm">{formatINR(historyStudent?.balanceDue || 0)}</p>
            </div>
          </div>

          {loadingHistory ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading transaction history...</div>
          ) : historyPayments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No transactions recorded for this student yet.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {historyPayments.map((p) => (
                <div
                  key={p._id}
                  className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{p.receiptNumber}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.paymentMethod}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{formatDateTime(p.paidAt)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Ref: {p.paymentReference || p.razorpayPaymentId}</p>
                    {p.verifiedByName && (
                      <p className="text-[10px] text-blue-600 font-medium">
                        Verified by: {p.verifiedByName} on {formatDate(p.verifiedAt)}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-black text-emerald-700 text-sm">{formatINR(p.amount)}</p>
                    <button
                      type="button"
                      onClick={() => downloadReceiptPdf(p, historyStudent)}
                      className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] inline-flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 6: Monthly Collection Report & Audit */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Hostel Mess Monthly Collection Report"
      >
        <div className="space-y-5">
          {/* Month Selector for Report */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Audit Billing Period:</span>
            <select
              value={reportMonth}
              onChange={(e) => {
                setReportMonth(e.target.value);
                loadReportData(e.target.value);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-xs font-semibold"
            >
              <option value="All">All Invoiced Periods</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {loadingReport ? (
            <div className="p-8 text-center text-xs text-slate-500">Compiling financial metrics...</div>
          ) : reportData ? (
            <div className="space-y-4">
              {/* Report Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Students</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{reportData.summary.totalStudents}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Invoiced</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{formatINR(reportData.summary.totalBilled)}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Total Collected</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">{formatINR(reportData.summary.totalCollected)}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <p className="text-[10px] font-bold text-rose-700 uppercase">Total Outstanding</p>
                  <p className="text-lg font-black text-rose-700 mt-0.5">{formatINR(reportData.summary.totalOutstanding)}</p>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-slate-900">Collections by Payment Channel</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500">Razorpay Online</span>
                    <p className="font-bold text-emerald-700 text-xs mt-0.5">
                      {formatINR(reportData.summary.methodBreakdown.Razorpay || 0)}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500">Cash (Desk)</span>
                    <p className="font-bold text-emerald-700 text-xs mt-0.5">
                      {formatINR(reportData.summary.methodBreakdown.Cash || 0)}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500">UPI Direct</span>
                    <p className="font-bold text-emerald-700 text-xs mt-0.5">
                      {formatINR(reportData.summary.methodBreakdown.UPI || 0)}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500">Bank Transfer</span>
                    <p className="font-bold text-emerald-700 text-xs mt-0.5">
                      {formatINR(reportData.summary.methodBreakdown['Bank Transfer'] || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-900">Student Account Standing</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                    PAID: {reportData.summary.statusCounts.PAID} students
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 font-bold">
                    PARTIALLY PAID: {reportData.summary.statusCounts['PARTIALLY PAID']} students
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-200 text-slate-800 font-bold">
                    PENDING: {reportData.summary.statusCounts.PENDING} students
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold">
                    OVERDUE: {reportData.summary.statusCounts.OVERDUE} students
                  </span>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-navy-800 transition-colors inline-flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Collection Report</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* MODAL 7: Official Printable / Downloadable Receipt */}
      {activeReceipt && (
        <ReceiptModal
          isOpen={!!activeReceipt}
          invoice={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};

export default AdminFees;
