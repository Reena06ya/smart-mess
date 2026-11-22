const Rebate = require('../models/Rebate');
const FeeInvoice = require('../models/FeeInvoice');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get mess rebates
// @route   GET /api/rebates
// @access  Private
const getRebates = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (req.user.role === 'student') {
      filter.student = req.user._id;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }

    const rebates = await Rebate.find(filter)
      .populate('student', 'name email roomNumber hostelBlock studentId')
      .sort({ createdAt: -1 });

    const totalRebates = rebates.length;
    const pendingRebates = rebates.filter((r) => r.status === 'Pending').length;
    const approvedRebates = rebates.filter((r) => r.status === 'Approved').length;
    const totalDiscountGiven = rebates
      .filter((r) => r.status === 'Approved')
      .reduce((sum, r) => sum + r.totalRebateAmount, 0);

    res.json({
      success: true,
      stats: { totalRebates, pendingRebates, approvedRebates, totalDiscountGiven },
      data: rebates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply for mess rebate / leave
// @route   POST /api/rebates
// @access  Private (Student)
const applyRebate = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide start date, end date, and reason' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    // Difference in days (inclusive)
    const diffTime = Math.abs(end - start);
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (numberOfDays < 2) {
      return res.status(400).json({ success: false, message: 'Mess rebate must be for at least 2 consecutive days' });
    }

    const dailyRate = 125; // INR per day
    const totalRebateAmount = numberOfDays * dailyRate;
    const rebateId = `REB-${Date.now().toString().slice(-6)}`;

    const rebate = await Rebate.create({
      rebateId,
      student: req.user._id,
      studentName: req.user.name,
      roomNumber: `${req.user.hostelBlock} ${req.user.roomNumber}`,
      startDate: start,
      endDate: end,
      numberOfDays,
      dailyRate,
      totalRebateAmount,
      reason,
      status: 'Pending',
    });

    // Notify Mess Admin
    await Notification.create({
      targetRole: 'admin',
      title: `New Rebate Request from ${req.user.name}`,
      message: `${req.user.name} applied for ${numberOfDays} days mess cut (₹${totalRebateAmount}). Reason: ${reason}.`,
      type: 'rebate',
      link: '/rebates',
    });

    res.status(201).json({
      success: true,
      message: `Rebate application #${rebateId} for ${numberOfDays} days (₹${totalRebateAmount}) submitted for approval.`,
      data: rebate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review & Approve/Reject rebate (Admin)
// @route   PUT /api/rebates/:id/review
// @access  Private (Admin / Staff)
const reviewRebate = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const rebate = await Rebate.findById(req.params.id);
    if (!rebate) {
      return res.status(404).json({ success: false, message: 'Rebate application not found' });
    }

    rebate.status = status;
    rebate.adminNotes = adminNotes || '';
    rebate.reviewedBy = req.user._id;
    rebate.reviewedAt = new Date();

    await rebate.save();

    // If Approved, deduct from student's balanceDue and pending fee invoice
    if (status === 'Approved') {
      const student = await User.findById(rebate.student);
      if (student) {
        student.balanceDue = Math.max(0, (student.balanceDue || 0) - rebate.totalRebateAmount);
        student.messStatus = 'On Leave'; // update status during leave
        await student.save();
      }

      // Also adjust latest pending invoice if exists
      const latestInvoice = await FeeInvoice.findOne({ student: rebate.student, status: 'Pending' }).sort({
        createdAt: -1,
      });

      if (latestInvoice) {
        latestInvoice.rebateDiscount = (latestInvoice.rebateDiscount || 0) + rebate.totalRebateAmount;
        latestInvoice.totalAmount = Math.max(0, latestInvoice.totalAmount - rebate.totalRebateAmount);
        await latestInvoice.save();
      }
    }

    // Send notification to student
    await Notification.create({
      recipient: rebate.student,
      targetRole: 'student',
      title: `Mess Rebate #${rebate.rebateId} ${status}`,
      message:
        status === 'Approved'
          ? `Your mess rebate for ${rebate.numberOfDays} days was approved! ₹${rebate.totalRebateAmount} credited.`
          : `Your rebate application was rejected. Note: "${adminNotes || 'Contact mess office'}".`,
      type: 'rebate',
      priority: 'high',
      link: '/rebates',
    });

    res.json({
      success: true,
      message: `Rebate application has been marked as ${status}`,
      data: rebate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRebates,
  applyRebate,
  reviewRebate,
};
