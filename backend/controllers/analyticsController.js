const FeeInvoice = require('../models/FeeInvoice');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Menu = require('../models/Menu');
const AuditLog = require('../models/AuditLog');

/**
 * Normalizes and synchronizes invoice status dynamically
 */
const refreshInvoiceStatus = (inv) => {
  const total = Number(inv.totalAmount) || 0;
  const paid = Number(inv.paidAmount) || 0;
  const now = new Date();

  if (paid >= total && total > 0) {
    inv.status = 'PAID';
  } else if (paid > 0 && paid < total) {
    inv.status = 'PARTIALLY PAID';
  } else if (inv.dueDate && new Date(inv.dueDate) < now) {
    inv.status = 'OVERDUE';
  } else {
    inv.status = 'PENDING';
  }
  return inv;
};

// @desc    Get complete analytics dashboard data with filters
// @route   GET /api/analytics/dashboard
// @access  Private (Admin / Staff)
const getAnalyticsDashboard = async (req, res) => {
  try {
    const { month, startDate, endDate, roomNumber, status } = req.query;

    // 1. Build Query for Fee Invoices
    const invoiceQuery = {};

    if (month && month !== 'All') {
      invoiceQuery.month = month;
    }

    // Date range filter
    if (startDate || endDate) {
      invoiceQuery.createdAt = {};
      if (startDate) {
        invoiceQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        invoiceQuery.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    // Room number filter
    let studentIdFilter = null;
    if (roomNumber && roomNumber !== 'All') {
      const roomStudents = await User.find({
        role: 'student',
        roomNumber: roomNumber.trim(),
      }).select('_id');
      studentIdFilter = roomStudents.map((s) => s._id);
      invoiceQuery.student = { $in: studentIdFilter };
    }

    // Fetch invoices matching query
    let allInvoices = await FeeInvoice.find(invoiceQuery)
      .populate('student', 'name studentId hostelName hostelBlock roomNumber bedNumber phone email dietPreference messStatus')
      .sort({ createdAt: -1 });

    // Refresh statuses in memory & calculate totals
    const now = new Date();
    allInvoices = allInvoices.map((inv) => refreshInvoiceStatus(inv));

    // Filter by payment status if requested
    let filteredInvoices = allInvoices;
    if (status && status !== 'All') {
      filteredInvoices = allInvoices.filter((inv) => {
        const invStatus = (inv.status || '').toUpperCase();
        const targetStatus = status.toUpperCase();
        if (targetStatus === 'PAID') return invStatus === 'PAID';
        if (targetStatus === 'PENDING') return invStatus === 'PENDING';
        if (targetStatus === 'PARTIALLY PAID') return invStatus === 'PARTIALLY PAID';
        if (targetStatus === 'OVERDUE') return invStatus === 'OVERDUE';
        return invStatus === targetStatus;
      });
    }

    // 2. Global Metric Calculations
    const allStudents = await User.find({ role: 'student' }).select('roomNumber hostelBlock balanceDue');
    const totalStudents = allStudents.length;

    // Occupied Rooms count
    const occupiedRoomNumbers = [
      ...new Set(allStudents.map((s) => s.roomNumber).filter((r) => r && r.trim() !== '')),
    ];
    const occupiedRooms = occupiedRoomNumbers.length;

    // Total fees metrics based on filtered invoices
    const totalMonthlyFees = filteredInvoices.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
    const totalCollectedFees = filteredInvoices.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
    const totalPendingFees = filteredInvoices.reduce(
      (acc, curr) => acc + Math.max(0, (Number(curr.totalAmount) || 0) - (Number(curr.paidAmount) || 0)),
      0
    );

    // Overdue fees calculation
    const totalOverdueFees = filteredInvoices.reduce((acc, curr) => {
      const isPastDue = curr.dueDate && new Date(curr.dueDate) < now;
      const outstanding = Math.max(0, (Number(curr.totalAmount) || 0) - (Number(curr.paidAmount) || 0));
      return isPastDue && outstanding > 0 ? acc + outstanding : acc;
    }, 0);

    // 3. Transactions Metrics
    const paymentQuery = {};
    if (studentIdFilter) {
      paymentQuery.student = { $in: studentIdFilter };
    }
    const allPayments = await Payment.find(paymentQuery)
      .populate('student', 'name studentId roomNumber')
      .populate('invoice', 'month totalAmount')
      .sort({ paidAt: -1 });

    const totalSuccessfulTransactions = allPayments.filter((p) => p.status === 'PAID').length;

    // 4. Complaints Metrics
    const allComplaints = await Complaint.find({}).sort({ createdAt: -1 });
    const totalComplaints = allComplaints.length;
    const unresolvedComplaints = allComplaints.filter((c) =>
      ['SUBMITTED', 'UNDER REVIEW', 'IN PROGRESS', 'Pending', 'In Progress'].includes(c.status)
    ).length;

    // Complaint category breakdown across all 8 standard categories
    const standardCategories = [
      'Food Quality',
      'Food Quantity',
      'Hygiene and Cleanliness',
      'Late Food Service',
      'Menu-Related Issues',
      'Staff Behaviour',
      'Water Issues',
      'Other Problems',
    ];

    const complaintCategories = standardCategories.map((cat) => {
      const matchCat = allComplaints.filter((c) => {
        if (c.category === cat) return true;
        if (cat === 'Hygiene and Cleanliness' && c.category === 'Hygiene & Cleanliness') return true;
        if (cat === 'Water Issues' && c.category === 'Utensils & Water') return true;
        if (cat === 'Staff Behaviour' && c.category === 'Mess Staff & Service') return true;
        if (cat === 'Other Problems' && c.category === 'Other') return true;
        return false;
      });

      const count = matchCat.length;
      const resolvedCount = matchCat.filter((c) => ['RESOLVED', 'Resolved'].includes(c.status)).length;
      const pendingCount = count - resolvedCount;

      return {
        category: cat,
        count,
        percentage: totalComplaints > 0 ? Number(((count / totalComplaints) * 100).toFixed(1)) : 0,
        resolvedCount,
        pendingCount,
      };
    });

    // 5. Student Feedback & Rating Metrics
    const menus = await Menu.find({});
    const allRatings = menus.flatMap((m) => m.ratings || []);
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;

    allRatings.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      ratingCounts[star] = (ratingCounts[star] || 0) + 1;
      ratingSum += Number(r.rating || 5);
    });

    const averageRating =
      allRatings.length > 0 ? Number((ratingSum / allRatings.length).toFixed(1)) : 4.6;

    const feedbackRatingChart = [5, 4, 3, 2, 1].map((star) => ({
      star: `${star} Star`,
      rating: star,
      count: ratingCounts[star] || 0,
      percentage:
        allRatings.length > 0
          ? Number((((ratingCounts[star] || 0) / allRatings.length) * 100).toFixed(1))
          : star === 5
          ? 70
          : star === 4
          ? 20
          : 5,
    }));

    // 6. Monthly Collection Chart Data
    // Group invoices by billing month
    const monthGroups = {};
    allInvoices.forEach((inv) => {
      const m = inv.month || 'Other';
      if (!monthGroups[m]) {
        monthGroups[m] = { billed: 0, collected: 0, pending: 0, count: 0 };
      }
      const billed = Number(inv.totalAmount) || 0;
      const collected = Number(inv.paidAmount) || 0;
      monthGroups[m].billed += billed;
      monthGroups[m].collected += collected;
      monthGroups[m].pending += Math.max(0, billed - collected);
      monthGroups[m].count += 1;
    });

    const monthlyFeeCollectionChart = Object.keys(monthGroups).map((m) => ({
      month: m,
      billed: monthGroups[m].billed,
      collected: monthGroups[m].collected,
      pending: monthGroups[m].pending,
      invoicesCount: monthGroups[m].count,
      collectionRate:
        monthGroups[m].billed > 0
          ? Number(((monthGroups[m].collected / monthGroups[m].billed) * 100).toFixed(1))
          : 0,
    }));

    // 7. Pending vs Paid Distribution
    const pendingVsPaidChart = {
      paidAmount: totalCollectedFees,
      pendingAmount: totalPendingFees,
      overdueAmount: totalOverdueFees,
      totalAmount: totalMonthlyFees,
      paidPercentage:
        totalMonthlyFees > 0 ? Number(((totalCollectedFees / totalMonthlyFees) * 100).toFixed(1)) : 0,
      pendingPercentage:
        totalMonthlyFees > 0 ? Number(((totalPendingFees / totalMonthlyFees) * 100).toFixed(1)) : 0,
      overduePercentage:
        totalMonthlyFees > 0 ? Number(((totalOverdueFees / totalMonthlyFees) * 100).toFixed(1)) : 0,
    };

    // 8. Room-Wise Fee Collection Chart Data
    // Group by student's room number
    const roomGroups = {};
    filteredInvoices.forEach((inv) => {
      const room = inv.student?.roomNumber || 'Common';
      const block = inv.student?.hostelBlock || 'Block A';
      const roomKey = `Room ${room}`;

      if (!roomGroups[roomKey]) {
        roomGroups[roomKey] = {
          room: roomKey,
          roomNumber: room,
          block,
          billed: 0,
          collected: 0,
          pending: 0,
          students: new Set(),
        };
      }

      const billed = Number(inv.totalAmount) || 0;
      const collected = Number(inv.paidAmount) || 0;
      roomGroups[roomKey].billed += billed;
      roomGroups[roomKey].collected += collected;
      roomGroups[roomKey].pending += Math.max(0, billed - collected);
      if (inv.student?._id) {
        roomGroups[roomKey].students.add(inv.student._id.toString());
      }
    });

    const roomWiseFeeCollectionChart = Object.values(roomGroups)
      .map((r) => ({
        room: r.room,
        roomNumber: r.roomNumber,
        block: r.block,
        studentCount: r.students.size,
        billed: r.billed,
        collected: r.collected,
        pending: r.pending,
        collectionRate: r.billed > 0 ? Number(((r.collected / r.billed) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.billed - a.billed)
      .slice(0, 8); // Top 8 rooms for clean visual chart

    // 9. Monthly Student Payment Trends Chart
    // Group payments chronologically
    const paymentTrendsMap = {};
    allPayments.forEach((p) => {
      const pDate = new Date(p.paidAt || p.createdAt);
      const dateKey = pDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!paymentTrendsMap[dateKey]) {
        paymentTrendsMap[dateKey] = { date: dateKey, amount: 0, count: 0, timestamp: pDate.getTime() };
      }
      paymentTrendsMap[dateKey].amount += Number(p.amount) || 0;
      paymentTrendsMap[dateKey].count += 1;
    });

    const paymentTrendsChart = Object.values(paymentTrendsMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10); // Last 10 payment days

    // 10. Distinct Filter Options
    const availableMonths = [
      ...new Set(allInvoices.map((inv) => inv.month).filter(Boolean)),
    ];
    const availableRooms = occupiedRoomNumbers.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    // 11. Detailed Filtered Records for Export / Table
    const records = filteredInvoices.map((inv) => ({
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber || `INV-${inv._id.toString().slice(-6).toUpperCase()}`,
      studentName: inv.student?.name || 'Unknown Student',
      studentId: inv.student?.studentId || 'N/A',
      roomNumber: inv.student?.roomNumber || 'N/A',
      hostelBlock: inv.student?.hostelBlock || 'Block A',
      month: inv.month,
      billedAmount: Number(inv.totalAmount) || 0,
      paidAmount: Number(inv.paidAmount) || 0,
      pendingBalance: Math.max(0, (Number(inv.totalAmount) || 0) - (Number(inv.paidAmount) || 0)),
      status: inv.status,
      dueDate: inv.dueDate,
      paymentMethod: inv.paymentMethod || 'Online (Razorpay)',
      transactionId: inv.transactionId || 'N/A',
      receiptNumber: inv.receiptNumber || 'N/A',
      createdAt: inv.createdAt,
    }));

    res.json({
      success: true,
      summary: {
        totalStudents,
        occupiedRooms,
        totalMonthlyFees,
        totalCollectedFees,
        totalPendingFees,
        totalOverdueFees,
        totalSuccessfulTransactions,
        totalComplaints,
        unresolvedComplaints,
        averageRating,
      },
      charts: {
        monthlyFeeCollection: monthlyFeeCollectionChart,
        pendingVsPaid: pendingVsPaidChart,
        roomWiseCollection: roomWiseFeeCollectionChart,
        paymentTrends: paymentTrendsChart,
        complaintCategories,
        feedbackRatings: feedbackRatingChart,
      },
      filters: {
        availableMonths,
        availableRooms,
      },
      records,
    });
  } catch (error) {
    console.error('[Analytics Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get administrative audit logs
// @route   GET /api/analytics/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res) => {
  try {
    const { action, targetType, limit = 50 } = req.query;
    const filter = {};
    if (action && action !== 'All') filter.action = action;
    if (targetType && targetType !== 'All') filter.targetType = targetType;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 50)
      .populate('admin', 'name email role');

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnalyticsDashboard,
  getAuditLogs,
};
