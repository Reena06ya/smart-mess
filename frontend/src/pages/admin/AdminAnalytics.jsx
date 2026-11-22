import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Users,
  Building,
  Receipt,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquareWarning,
  HelpCircle,
  Star,
  FileSpreadsheet,
  FileDown,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ChevronDown,
  Calendar,
  Layers,
  Percent,
} from 'lucide-react';
import api from '../../services/api';
import { formatINR, formatDate } from '../../utils/formatters';
import { exportAnalyticsCsv } from '../../utils/analyticsCsvGenerator';
import { downloadAnalyticsPdf } from '../../utils/analyticsReportPdfGenerator';
import { downloadReceiptPdf } from '../../utils/receiptPdfGenerator';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

export const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    summary: {},
    charts: {
      monthlyFeeCollection: [],
      pendingVsPaid: {},
      roomWiseCollection: [],
      paymentTrends: [],
      complaintCategories: [],
      feedbackRatings: [],
    },
    filters: {
      availableMonths: [],
      availableRooms: [],
    },
    records: [],
  });

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedRoom, setSelectedRoom] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Table search & pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Active chart tooltip state
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredTrend, setHoveredTrend] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const params = {};
      if (selectedMonth && selectedMonth !== 'All') params.month = selectedMonth;
      if (selectedRoom && selectedRoom !== 'All') params.roomNumber = selectedRoom;
      if (selectedStatus && selectedStatus !== 'All') params.status = selectedStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/analytics/dashboard', { params });
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth, selectedRoom, selectedStatus, startDate, endDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleResetFilters = () => {
    setSelectedMonth('All');
    setSelectedRoom('All');
    setSelectedStatus('All');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const summary = data.summary || {};
  const charts = data.charts || {};
  const filterOptions = data.filters || { availableMonths: [], availableRooms: [] };

  // Filtered records for table search
  const filteredRecords = useMemo(() => {
    const list = data.records || [];
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (r) =>
        (r.studentName && r.studentName.toLowerCase().includes(term)) ||
        (r.studentId && r.studentId.toLowerCase().includes(term)) ||
        (r.roomNumber && String(r.roomNumber).toLowerCase().includes(term)) ||
        (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(term)) ||
        (r.month && r.month.toLowerCase().includes(term))
    );
  }, [data.records, searchTerm]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // 10 KPI Stat Cards Configuration
  const kpiCards = [
    {
      title: 'Total Students',
      value: summary.totalStudents || 0,
      subtext: 'Registered hostellers',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
    },
    {
      title: 'Occupied Rooms',
      value: summary.occupiedRooms || 0,
      subtext: 'Active living rooms',
      icon: Building,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Total Invoiced Fees',
      value: formatINR(summary.totalMonthlyFees || 0),
      subtext: 'Total mess billings',
      icon: Receipt,
      color: 'bg-slate-500/10 text-slate-800 border-slate-200',
    },
    {
      title: 'Fees Collected',
      value: formatINR(summary.totalCollectedFees || 0),
      subtext: `${summary.totalMonthlyFees > 0 ? ((summary.totalCollectedFees / summary.totalMonthlyFees) * 100).toFixed(1) : 0}% recovery rate`,
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    },
    {
      title: 'Pending Mess Dues',
      value: formatINR(summary.totalPendingFees || 0),
      subtext: 'Awaiting student payment',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600 border-amber-200',
    },
    {
      title: 'Overdue Mess Dues',
      value: formatINR(summary.totalOverdueFees || 0),
      subtext: 'Past billing deadline',
      icon: AlertTriangle,
      color: 'bg-rose-500/10 text-rose-600 border-rose-200',
    },
    {
      title: 'Successful Payments',
      value: summary.totalSuccessfulTransactions || 0,
      subtext: 'Online & verified cash',
      icon: CreditCard,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    },
    {
      title: 'Total Complaints',
      value: summary.totalComplaints || 0,
      subtext: 'Logged mess grievances',
      icon: MessageSquareWarning,
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
    },
    {
      title: 'Unresolved Complaints',
      value: summary.unresolvedComplaints || 0,
      subtext: 'Pending review/action',
      icon: HelpCircle,
      color: 'bg-red-500/10 text-red-600 border-red-200',
    },
    {
      title: 'Student Rating',
      value: `${summary.averageRating || 4.6} / 5.0`,
      subtext: 'Mess food satisfaction',
      icon: Star,
      color: 'bg-amber-400/10 text-amber-500 border-amber-200',
      isStar: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={4} />
        <LoadingSkeleton type="table" count={6} />
      </div>
    );
  }

  const activeFilters = {
    month: selectedMonth,
    roomNumber: selectedRoom,
    status: selectedStatus,
    startDate,
    endDate,
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Hosteller Financial Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hostel Mess Analytics & Reports
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Comprehensive institutional overview of monthly fee collections, room-wise financial health, payment trends, and grievance resolutions directly from live records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all flex items-center space-x-2 disabled:opacity-50"
              title="Refresh Analytics from Database"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : 'text-slate-300'}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => exportAnalyticsCsv(data.records, summary, activeFilters)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => downloadAnalyticsPdf(data.records, summary, activeFilters)}
              className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-white border border-slate-600/50 text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Export PDF Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter Deck */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Multi-Dimensional Filters</span>
          </div>
          {(selectedMonth !== 'All' || selectedRoom !== 'All' || selectedStatus !== 'All' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline flex items-center space-x-1"
            >
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Billing Cycle
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
              >
                <option value="All">All Billing Cycles</option>
                {filterOptions.availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Room Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Hostel Room
            </label>
            <div className="relative">
              <select
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
              >
                <option value="All">All Rooms</option>
                {filterOptions.availableRooms.map((r) => (
                  <option key={r} value={r}>
                    Room {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="PAID">PAID (Settled)</option>
                <option value="PARTIALLY PAID">PARTIALLY PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="OVERDUE">OVERDUE (Past Due)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 10 KPI Summary Metrics Cards */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <span>Executive Key Performance Indicators (Actual DB Totals)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                    {kpi.title}
                  </span>
                  <div className={`p-1.5 rounded-lg border ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-1">
                    <span>{kpi.value}</span>
                    {kpi.isStar && <Star className="w-4 h-4 text-amber-500 fill-amber-500 inline" />}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                    {kpi.subtext}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Charts Grid (Section 1: Financial Performance) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Monthly Fee Collection (Billed vs Collected) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Monthly Fee Collection Analysis</h3>
                <p className="text-xs text-slate-500">Billed Amount vs Realized Collections across cycles</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-semibold">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-800" />
                  <span className="text-slate-600">Billed</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-slate-600">Collected</span>
                </div>
              </div>
            </div>

            {/* SVG Visual Bar Chart */}
            <div className="mt-6">
              {charts.monthlyFeeCollection && charts.monthlyFeeCollection.length > 0 ? (
                <div className="space-y-4">
                  {/* Find max billed value to scale bars */}
                  {(() => {
                    const maxBilled = Math.max(
                      ...charts.monthlyFeeCollection.map((m) => Math.max(m.billed, m.collected, 1000))
                    );

                    return charts.monthlyFeeCollection.map((item, idx) => {
                      const billedPct = Math.min(100, Math.round((item.billed / maxBilled) * 100));
                      const collectedPct = Math.min(100, Math.round((item.collected / maxBilled) * 100));

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredBar(idx)}
                          onMouseLeave={() => setHoveredBar(null)}
                          className="p-2.5 rounded-xl transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                            <span className="flex items-center space-x-2">
                              <span>{item.month}</span>
                              <span className="text-[10px] font-normal text-slate-500">
                                ({item.invoicesCount} Invoices)
                              </span>
                            </span>
                            <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                              {item.collectionRate}% Recovered
                            </span>
                          </div>

                          {/* Dual Bar Track */}
                          <div className="space-y-1.5">
                            {/* Billed Bar */}
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-medium text-slate-400 w-12">Billed:</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden relative">
                                <div
                                  className="h-full bg-slate-800 rounded-full transition-all duration-700 ease-out"
                                  style={{ width: `${billedPct}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 w-20 text-right">
                                {formatINR(item.billed)}
                              </span>
                            </div>

                            {/* Collected Bar */}
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-medium text-slate-400 w-12">Paid:</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden relative">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                                  style={{ width: `${collectedPct}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-emerald-600 w-20 text-right">
                                {formatINR(item.collected)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No monthly fee records match the selected filters.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Aggregated across active invoice cycles</span>
            <span className="font-semibold text-slate-700">Calculated dynamically</span>
          </div>
        </div>

        {/* Chart 2: Pending vs Paid Fees Donut Breakdown */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Collection Status Distribution</h3>
              <p className="text-xs text-slate-500">Paid vs Pending vs Overdue balance</p>
            </div>

            {/* Visual Radial / Donut Gauge Representation */}
            <div className="mt-6 flex flex-col items-center">
              {(() => {
                const p = charts.pendingVsPaid || {};
                const paidPct = p.paidPercentage || 0;
                const pendingPct = p.pendingPercentage || 0;
                const overduePct = p.overduePercentage || 0;

                // SVG Arc parameters
                const radius = 64;
                const circumference = 2 * Math.PI * radius;
                const paidOffset = circumference - (paidPct / 100) * circumference;

                return (
                  <div className="relative flex items-center justify-center">
                    <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
                      {/* Background circle */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        className="text-slate-100"
                        strokeWidth="18"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      {/* Paid Progress Arc */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        className="text-emerald-500 transition-all duration-1000 ease-out"
                        strokeWidth="18"
                        strokeDasharray={circumference}
                        strokeDashoffset={paidOffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>

                    {/* Centered Donut Content */}
                    <div className="absolute text-center">
                      <div className="text-2xl font-black text-slate-900">{paidPct}%</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Collected
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Status Breakdown Legend & Metric Blocks */}
              <div className="w-full mt-6 space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-emerald-950">Paid & Settled</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-800">
                      {formatINR(charts.pendingVsPaid?.paidAmount || 0)}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">
                      {charts.pendingVsPaid?.paidPercentage || 0}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-semibold text-amber-950">Pending Due</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-800">
                      {formatINR(charts.pendingVsPaid?.pendingAmount || 0)}
                    </span>
                    <span className="text-[10px] text-amber-600 block">
                      {charts.pendingVsPaid?.pendingPercentage || 0}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-rose-950">Overdue (Past Date)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-800">
                      {formatINR(charts.pendingVsPaid?.overdueAmount || 0)}
                    </span>
                    <span className="text-[10px] text-rose-600 block">
                      {charts.pendingVsPaid?.overduePercentage || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Total Invoiced Scope: <strong className="text-slate-700">{formatINR(summary.totalMonthlyFees || 0)}</strong>
          </div>
        </div>
      </div>

      {/* 5. Interactive Charts Grid (Section 2: Room-Wise & Payment Trends) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Room-Wise Fee Collection */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Room-Wise Fee Collection</h3>
                <p className="text-xs text-slate-500">Ranked hostel rooms by billing & collection recovery</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                Top Rooms
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              {charts.roomWiseCollection && charts.roomWiseCollection.length > 0 ? (
                charts.roomWiseCollection.map((rm, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-md bg-navy-900 text-white flex items-center justify-center text-[10px] font-black">
                          #{idx + 1}
                        </span>
                        <span>{rm.room}</span>
                        <span className="text-[10px] font-normal text-slate-500">
                          ({rm.studentCount} Hostellers, {rm.block})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-600 font-bold">{formatINR(rm.collected)}</span>
                        <span className="text-slate-400 font-normal"> / {formatINR(rm.billed)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${rm.collectionRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-medium">
                      <span>Pending: {formatINR(rm.pending)}</span>
                      <span className="text-emerald-700 font-bold">{rm.collectionRate}% Cleared</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No room-wise records found for active filters.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Helps wardens audit defaulting blocks</span>
            <span className="font-semibold text-slate-700">Auto-Sorted by Billed Total</span>
          </div>
        </div>

        {/* Chart 4: Monthly Student Payment Trends */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Collection Trends</h3>
                <p className="text-xs text-slate-500">Daily transaction volume and revenue inflow timeline</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                Daily Revenue
              </span>
            </div>

            <div className="mt-6">
              {charts.paymentTrends && charts.paymentTrends.length > 0 ? (
                <div>
                  {/* Visual SVG Timeline Chart */}
                  {(() => {
                    const trends = charts.paymentTrends;
                    const maxAmount = Math.max(...trends.map((t) => t.amount), 5000);

                    return (
                      <div className="space-y-3">
                        <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-200">
                          {trends.map((t, idx) => {
                            const barHeight = Math.max(12, Math.round((t.amount / maxAmount) * 100));
                            const isHovered = hoveredTrend === idx;

                            return (
                              <div
                                key={idx}
                                onMouseEnter={() => setHoveredTrend(idx)}
                                onMouseLeave={() => setHoveredTrend(null)}
                                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                              >
                                {isHovered && (
                                  <div className="absolute -top-10 z-20 bg-slate-900 text-white text-[10px] rounded-lg px-2 py-1 shadow-lg pointer-events-none whitespace-nowrap">
                                    <div className="font-bold">{formatINR(t.amount)}</div>
                                    <div className="text-slate-300">{t.count} Payments</div>
                                  </div>
                                )}
                                <div
                                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                                    isHovered ? 'bg-emerald-600 scale-105' : 'bg-emerald-500/80 hover:bg-emerald-500'
                                  }`}
                                  style={{ height: `${barHeight}%` }}
                                />
                                <span className="text-[10px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                                  {t.date}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Recent Transactions list */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {trends.slice(-4).map((t, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                            >
                              <span className="font-medium text-slate-600">{t.date}</span>
                              <span className="font-bold text-slate-900">{formatINR(t.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No transaction trends recorded for current scope.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Verified online and manual payments</span>
            <span className="font-semibold text-emerald-600">Chronological Stream</span>
          </div>
        </div>
      </div>

      {/* 6. Interactive Charts Grid (Section 3: Complaints & Feedback Satisfaction) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 5: Complaint Category Breakdown */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Grievances by Category</h3>
                <p className="text-xs text-slate-500">Distribution across 8 standard hostel mess categories</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                {summary.totalComplaints || 0} Total Grievances
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {charts.complaintCategories && charts.complaintCategories.length > 0 ? (
                charts.complaintCategories.map((c, idx) => (
                  <div key={idx} className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-800 mb-1">
                      <span className="font-bold flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{c.category}</span>
                      </span>
                      <div className="space-x-2 text-[11px]">
                        <span className="text-emerald-600 font-semibold">{c.resolvedCount} Resolved</span>
                        <span className="text-rose-500 font-semibold">({c.pendingCount} Pending)</span>
                        <span className="text-slate-400">| {c.count} Total</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full rounded-l-full"
                        style={{
                          width: `${c.count > 0 ? (c.resolvedCount / c.count) * 100 : 0}%`,
                        }}
                        title={`Resolved: ${c.resolvedCount}`}
                      />
                      <div
                        className="bg-rose-400 h-full rounded-r-full"
                        style={{
                          width: `${c.count > 0 ? (c.pendingCount / c.count) * 100 : 0}%`,
                        }}
                        title={`Pending: ${c.pendingCount}`}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No complaints registered in the database.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Resolved</span>
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-400 ml-2" />
              <span>Unresolved</span>
            </span>
            <span className="font-semibold text-slate-700">8 Standard Categories</span>
          </div>
        </div>

        {/* Chart 6: Student Feedback Rating Breakdown */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Dining Ratings</h3>
                <p className="text-xs text-slate-500">Quality satisfaction scores from daily menu reviews</p>
              </div>
              <div className="flex items-center space-x-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 font-extrabold text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{summary.averageRating || 4.6} Average</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
              {/* Overall Score Circle */}
              <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex flex-col items-center justify-center p-4 shadow-lg shadow-amber-500/20 text-center shrink-0">
                <div className="text-3xl font-black">{summary.averageRating || 4.6}</div>
                <div className="flex items-center space-x-0.5 my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 fill-white text-white" />
                  ))}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-100">
                  Overall Score
                </div>
              </div>

              {/* Star Rating Distribution Bars */}
              <div className="w-full space-y-2.5">
                {charts.feedbackRatings &&
                  charts.feedbackRatings.map((f, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs">
                      <span className="w-12 font-bold text-slate-600 flex items-center space-x-1">
                        <span>{f.rating}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-700"
                          style={{ width: `${f.percentage}%` }}
                        />
                      </div>
                      <span className="w-14 text-right text-slate-500 text-[11px] font-semibold">
                        {f.count} ({f.percentage}%)
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Collected from student daily meal ratings</span>
            <span className="font-semibold text-emerald-600">Verified Submissions</span>
          </div>
        </div>
      </div>

      {/* 7. Detailed Filtered Invoice Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Invoice Reconciliation & Audit Roster</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredRecords.length} student records matching active filter criteria
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student, room, ID, invoice..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll / Room</th>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4">Billed (₹)</th>
                <th className="py-3 px-4">Paid (₹)</th>
                <th className="py-3 px-4">Pending (₹)</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => {
                  const stat = (rec.status || 'PENDING').toUpperCase();
                  let badgeVariant = 'default';
                  if (stat === 'PAID') badgeVariant = 'success';
                  else if (stat === 'PARTIALLY PAID') badgeVariant = 'warning';
                  else if (stat === 'OVERDUE') badgeVariant = 'danger';

                  return (
                    <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {rec.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rec.studentName}</div>
                        <div className="text-[10px] text-slate-500">{rec.hostelBlock}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">Room {rec.roomNumber}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{rec.studentId}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{rec.month}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatINR(rec.billedAmount)}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {formatINR(rec.paidAmount)}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-600">
                        {formatINR(rec.pendingBalance)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={badgeVariant}>{rec.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {rec.dueDate ? formatDate(rec.dueDate) : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => downloadReceiptPdf(rec, { name: rec.studentName, studentId: rec.studentId, roomNumber: rec.roomNumber, hostelBlock: rec.hostelBlock })}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors inline-flex items-center space-x-1"
                          title="Download Official Receipt PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 text-slate-600" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-slate-400 text-xs">
                    No reconciliation records found matching the active criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 font-semibold"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
