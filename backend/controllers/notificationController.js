const Notification = require('../models/Notification');
const FeeInvoice = require('../models/FeeInvoice');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const emailService = require('../utils/emailService');

// @desc    Get notifications for logged-in user with filters & stats
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const { type, isRead, search, limit = 50 } = req.query;

    // Audience filtering based on role
    const audienceFilter = {
      $or: [
        { recipient: userId },
        { recipient: null, targetRole: 'all' },
        { recipient: null, targetRole: userRole },
      ],
    };

    // If admin, also include targetRole 'staff'
    if (['admin', 'staff'].includes(userRole)) {
      audienceFilter.$or.push({ recipient: null, targetRole: 'staff' });
      audienceFilter.$or.push({ recipient: null, targetRole: 'admin' });
    }

    const query = { ...audienceFilter };

    // Filter by type
    if (type && type !== 'All') {
      if (type === 'fee') {
        query.type = { $in: ['fee', 'payment'] };
      } else {
        query.type = type;
      }
    }

    // Filter by read status
    if (isRead !== undefined && isRead !== 'all') {
      query.isRead = isRead === 'true' || isRead === true;
    }

    // Search query
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { message: regex }];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Stats across all notifications for this user
    const allUserNotifs = await Notification.find(audienceFilter);
    const unreadCount = allUserNotifs.filter((n) => !n.isRead).length;

    const stats = {
      total: allUserNotifs.length,
      unread: unreadCount,
      fee: allUserNotifs.filter((n) => ['fee', 'payment'].includes(n.type)).length,
      menu: allUserNotifs.filter((n) => n.type === 'menu').length,
      complaint: allUserNotifs.filter((n) => n.type === 'complaint').length,
      announcement: allUserNotifs.filter((n) => n.type === 'announcement').length,
      adminAlerts: allUserNotifs.filter((n) => ['registration', 'feedback'].includes(n.type)).length,
    };

    res.json({
      success: true,
      unreadCount,
      stats,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Quick endpoint to get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    const audienceFilter = {
      $or: [
        { recipient: userId },
        { recipient: null, targetRole: 'all' },
        { recipient: null, targetRole: userRole },
      ],
      isRead: false,
    };

    if (['admin', 'staff'].includes(userRole)) {
      audienceFilter.$or.push({ recipient: null, targetRole: 'staff' });
      audienceFilter.$or.push({ recipient: null, targetRole: 'admin' });
    }

    const unreadCount = await Notification.countDocuments(audienceFilter);

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all/read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const audienceFilter = {
      $or: [
        { recipient: userId },
        { recipient: null, targetRole: 'all' },
        { recipient: null, targetRole: userRole },
      ],
      isRead: false,
    };

    if (['admin', 'staff'].includes(userRole)) {
      audienceFilter.$or.push({ recipient: null, targetRole: 'staff' });
      audienceFilter.$or.push({ recipient: null, targetRole: 'admin' });
    }

    const result = await Notification.updateMany(audienceFilter, {
      isRead: true,
      readAt: new Date(),
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Verify ownership or admin
    if (
      notification.recipient &&
      notification.recipient.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this notification' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Notification removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create announcement (Admin / Staff)
// @route   POST /api/notifications/broadcast
// @access  Private (Admin / Staff)
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetRole = 'student', priority = 'normal', link = '' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Please provide title and message' });
    }

    const notification = await Notification.create({
      recipient: null,
      targetRole,
      title: title.trim(),
      message: message.trim(),
      type: 'announcement',
      priority,
      link,
    });

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted to students successfully',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger Due Date & Overdue Reminders (Automated / Admin)
// @route   POST /api/notifications/check-due-reminders
// @access  Private (Admin / Staff)
const checkDueReminders = async (req, res) => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. Invoices approaching due date (within 3 days, not yet paid)
    const upcomingInvoices = await FeeInvoice.find({
      dueDate: { $gte: now, $lte: threeDaysFromNow },
      status: { $in: ['PENDING', 'PARTIALLY PAID', 'Pending', 'Partially Paid'] },
    }).populate('student', 'name email roomNumber studentId');

    let upcomingNotifsCount = 0;
    for (const inv of upcomingInvoices) {
      if (!inv.student) continue;

      const daysRemaining = Math.max(1, Math.ceil((new Date(inv.dueDate) - now) / (1000 * 60 * 60 * 24)));
      const remainingAmount = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));

      // Prevent sending duplicate reminder within last 24 hours
      const existing = await Notification.findOne({
        recipient: inv.student._id,
        type: 'fee',
        title: { $regex: /Upcoming Payment Due/i },
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      });

      if (!existing) {
        await Notification.create({
          recipient: inv.student._id,
          targetRole: 'student',
          title: `Upcoming Payment Due in ${daysRemaining} Day(s)`,
          message: `Your mess fee balance of ₹${remainingAmount.toLocaleString('en-IN')} for ${inv.month} is due on ${new Date(inv.dueDate).toLocaleDateString('en-GB')}. Please settle online.`,
          type: 'fee',
          priority: 'high',
          link: '/fees',
        });

        // Email Notification
        emailService.sendDueDateReminderEmail(inv.student, inv, daysRemaining);
        upcomingNotifsCount++;
      }
    }

    // 2. Invoices overdue (past due date, not fully paid)
    const overdueInvoices = await FeeInvoice.find({
      dueDate: { $lt: now },
      status: { $in: ['PENDING', 'PARTIALLY PAID', 'OVERDUE', 'Pending', 'Partially Paid', 'Overdue'] },
    }).populate('student', 'name email roomNumber studentId');

    let overdueNotifsCount = 0;
    for (const inv of overdueInvoices) {
      if (!inv.student) continue;

      inv.status = 'OVERDUE';
      await inv.save();

      const remainingAmount = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));

      // Check if overdue notification was sent in last 48 hours
      const existingOverdue = await Notification.findOne({
        recipient: inv.student._id,
        type: 'fee',
        title: { $regex: /Payment Overdue/i },
        createdAt: { $gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
      });

      if (!existingOverdue) {
        await Notification.create({
          recipient: inv.student._id,
          targetRole: 'student',
          title: `Payment Overdue: Mess Fee for ${inv.month}`,
          message: `Your mess fee payment of ₹${remainingAmount.toLocaleString('en-IN')} is overdue. Please settle your dues immediately to avoid mess fine.`,
          type: 'fee',
          priority: 'urgent',
          link: '/fees',
        });

        // Email Notification
        emailService.sendPaymentOverdueEmail(inv.student, inv);
        overdueNotifsCount++;
      }
    }

    res.json({
      success: true,
      message: `Due date scan complete. Sent ${upcomingNotifsCount} upcoming due reminders and ${overdueNotifsCount} overdue notices.`,
      upcomingCount: upcomingNotifsCount,
      overdueCount: overdueNotifsCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Alert: Unresolved complaints summary
// @route   POST /api/notifications/unresolved-complaints-alert
// @access  Private (Admin / Staff)
const checkUnresolvedComplaints = async (req, res) => {
  try {
    const unresolved = await Complaint.find({
      status: { $in: ['SUBMITTED', 'UNDER REVIEW', 'IN PROGRESS', 'Pending', 'In Progress'] },
    }).sort({ createdAt: 1 });

    const urgentCount = unresolved.filter((c) => ['Urgent', 'High'].includes(c.priority)).length;

    if (unresolved.length > 0) {
      await Notification.create({
        recipient: null,
        targetRole: 'admin',
        title: `Mess Helpdesk: ${unresolved.length} Unresolved Complaints Pending`,
        message: `There are currently ${unresolved.length} active grievance tickets requiring staff attention (${urgentCount} marked High/Urgent priority).`,
        type: 'complaint',
        priority: urgentCount > 0 ? 'urgent' : 'high',
        link: '/admin-complaints',
      });
    }

    res.json({
      success: true,
      unresolvedCount: unresolved.length,
      urgentCount,
      message: `Checked unresolved complaints. Found ${unresolved.length} pending tickets.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAnnouncement,
  checkDueReminders,
  checkUnresolvedComplaints,
};
