const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { recordAuditLog } = require('../utils/auditLogger');
const { sanitizeText, isValidImagePayload } = require('../utils/securityValidator');

// Standardized categories
const COMPLAINT_CATEGORIES = [
  'Food Quality',
  'Food Quantity',
  'Hygiene and Cleanliness',
  'Late Food Service',
  'Menu-Related Issues',
  'Staff Behaviour',
  'Water Issues',
  'Other Problems',
];

// Standardized statuses
const COMPLAINT_STATUSES = [
  'SUBMITTED',
  'UNDER REVIEW',
  'IN PROGRESS',
  'RESOLVED',
  'REJECTED',
];

// @desc    Get complaints (Student gets their own, Admin gets all)
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;
    const filter = {};

    // Role-based scoping: Student only views their own complaints
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    }

    if (status && status !== 'All') {
      // Support matching uppercase or legacy
      if (status === 'SUBMITTED') {
        filter.status = { $in: ['SUBMITTED', 'Pending'] };
      } else if (status === 'IN PROGRESS') {
        filter.status = { $in: ['IN PROGRESS', 'In Progress'] };
      } else if (status === 'RESOLVED') {
        filter.status = { $in: ['RESOLVED', 'Resolved'] };
      } else if (status === 'REJECTED') {
        filter.status = { $in: ['REJECTED', 'Rejected'] };
      } else {
        filter.status = status;
      }
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (priority && priority !== 'All') {
      filter.priority = priority;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { ticketNumber: regex },
        { title: regex },
        { description: regex },
        { studentName: regex },
        { studentRoom: regex },
        { studentId: regex },
      ];
    }

    const complaints = await Complaint.find(filter)
      .populate('student', 'name email roomNumber hostelBlock studentId phone avatar')
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 });

    // Compute comprehensive stats
    const allComplaintsForStats = await Complaint.find(
      req.user.role === 'student' ? { student: req.user._id } : {}
    );

    const stats = {
      total: allComplaintsForStats.length,
      submitted: allComplaintsForStats.filter((c) => ['SUBMITTED', 'Pending'].includes(c.status)).length,
      underReview: allComplaintsForStats.filter((c) => c.status === 'UNDER REVIEW').length,
      inProgress: allComplaintsForStats.filter((c) => ['IN PROGRESS', 'In Progress'].includes(c.status)).length,
      resolved: allComplaintsForStats.filter((c) => ['RESOLVED', 'Resolved'].includes(c.status)).length,
      rejected: allComplaintsForStats.filter((c) => ['REJECTED', 'Rejected'].includes(c.status)).length,
      reopened: allComplaintsForStats.filter((c) => c.isReopened).length,
    };

    res.json({
      success: true,
      stats,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'name email roomNumber hostelBlock studentId phone avatar')
      .populate('resolvedBy', 'name email role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Check authorization: Student can only access their own
    if (req.user.role === 'student' && complaint.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this complaint' });
    }

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new complaint (Student)
// @route   POST /api/complaints
// @access  Private (Student)
const createComplaint = async (req, res) => {
  try {
    const {
      title,
      category,
      priority = 'Medium',
      description,
      imageUrl = '',
      incidentDate,
    } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complaint title, category, and detailed description',
      });
    }

    // Image payload validation
    if (imageUrl) {
      const imgCheck = isValidImagePayload(imageUrl);
      if (!imgCheck.valid) {
        return res.status(400).json({
          success: false,
          message: imgCheck.error || 'Invalid evidence photo format',
        });
      }
    }

    const sanitizedTitle = sanitizeText(title);
    const sanitizedDesc = sanitizeText(description);

    // Generate unique readable ticket number (e.g. CMP-2026-4921)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `CMP-${new Date().getFullYear()}-${randomSuffix}`;

    const studentRoomStr = `${req.user.hostelBlock || 'Hostel'} - Room ${req.user.roomNumber || 'N/A'}`;

    const complaint = await Complaint.create({
      ticketNumber,
      student: req.user._id,
      studentName: req.user.name,
      studentRoom: studentRoomStr,
      studentId: req.user.studentId || '',
      studentPhone: req.user.phone || '',
      studentEmail: req.user.email || '',
      title: sanitizedTitle,
      category,
      priority,
      status: 'SUBMITTED',
      description: sanitizedDesc,
      imageUrl: imageUrl.trim(),
      incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
      replies: [
        {
          author: req.user._id,
          authorName: req.user.name,
          authorRole: 'student',
          message: sanitizedDesc,
          createdAt: new Date(),
        },
      ],
    });

    // Acknowledgment notification to student
    await Notification.create({
      recipient: req.user._id,
      targetRole: 'student',
      title: `Complaint Received: #${ticketNumber}`,
      message: `Your grievance regarding "${title}" has been received and queued for Mess Committee review.`,
      type: 'complaint',
      priority: 'normal',
      link: '/complaints',
    });

    // Notify admins about new complaint submission
    await Notification.create({
      targetRole: 'admin',
      title: `New Grievance Filed: #${ticketNumber}`,
      message: `"${title}" reported by ${req.user.name} (${studentRoomStr}) under '${category}'.`,
      type: 'complaint',
      priority: priority === 'Urgent' || priority === 'High' ? 'urgent' : 'normal',
      link: '/admin-complaints',
    });

    res.status(201).json({
      success: true,
      message: `Complaint #${ticketNumber} submitted successfully! The mess committee has been alerted.`,
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update complaint status & resolution (Admin)
// @route   PUT /api/complaints/:id/status
// @access  Private (Admin / Staff)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const previousStatus = complaint.status;
    if (status) {
      complaint.status = status;
    }

    if (adminResponse && adminResponse.trim()) {
      complaint.adminResponse = adminResponse.trim();
      complaint.replies.push({
        author: req.user._id,
        authorName: `${req.user.name} (Mess Bhaiya)`,
        authorRole: 'admin',
        message: adminResponse.trim(),
        createdAt: new Date(),
      });
    }

    if (status === 'RESOLVED' || status === 'Resolved') {
      complaint.resolvedBy = req.user._id;
      complaint.resolvedByName = req.user.name;
      complaint.resolvedAt = new Date();
    } else if (status === 'REJECTED' || status === 'Rejected') {
      complaint.resolvedBy = req.user._id;
      complaint.resolvedByName = req.user.name;
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Send instant notification to student whenever complaint status changes
    await Notification.create({
      recipient: complaint.student,
      targetRole: 'student',
      title: `Complaint #${complaint.ticketNumber} Update: ${complaint.status}`,
      message: adminResponse
        ? `Mess Bhaiya remarks: "${adminResponse.trim()}". Status is now ${complaint.status}.`
        : `Your complaint #${complaint.ticketNumber} status changed from ${previousStatus} to ${complaint.status}.`,
      type: 'complaint',
      priority: complaint.status === 'RESOLVED' ? 'high' : 'normal',
      link: '/complaints',
    });

    // Audit Log Entry
    await recordAuditLog({
      action: 'UPDATE_COMPLAINT_STATUS',
      req,
      targetType: 'Complaint',
      targetId: complaint._id,
      summary: `Updated complaint #${complaint.ticketNumber} from ${previousStatus} to ${complaint.status}`,
      details: { ticketNumber: complaint.ticketNumber, previousStatus, newStatus: complaint.status, adminResponse },
    });

    res.json({
      success: true,
      message: `Complaint #${complaint.ticketNumber} status updated to '${complaint.status}' and student notified!`,
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to complaint (Admin or Student)
// @route   POST /api/complaints/:id/reply
// @access  Private
const replyToComplaint = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Role verification
    const isStudent = req.user.role === 'student';
    if (isStudent && complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this complaint' });
    }

    const replyObj = {
      author: req.user._id,
      authorName: isStudent ? req.user.name : `${req.user.name} (Mess Admin)`,
      authorRole: req.user.role,
      message: message.trim(),
      createdAt: new Date(),
    };

    complaint.replies.push(replyObj);

    if (!isStudent) {
      complaint.adminResponse = message.trim();
    }

    await complaint.save();

    // Send notifications
    if (isStudent) {
      // Notify admin that student replied
      await Notification.create({
        targetRole: 'admin',
        title: `Reply on Complaint #${complaint.ticketNumber}`,
        message: `${req.user.name}: "${message.trim().substring(0, 80)}..."`,
        type: 'complaint',
        link: '/admin-complaints',
      });
    } else {
      // Notify student that admin replied
      await Notification.create({
        recipient: complaint.student,
        targetRole: 'student',
        title: `Mess Bhaiya replied to #${complaint.ticketNumber}`,
        message: `"${message.trim().substring(0, 100)}..."`,
        type: 'complaint',
        link: '/complaints',
      });
    }

    res.json({
      success: true,
      message: 'Reply posted successfully',
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign complaint to staff/personnel (Admin)
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin / Staff)
const assignComplaint = async (req, res) => {
  try {
    const assignedName = req.body.assignedName || req.body.assignedStaffName;
    const assignedRole = req.body.assignedRole || req.body.assignedStaffRole;

    if (!assignedName || !assignedRole) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assigned staff name and role',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.assignedTo = {
      name: assignedName.trim(),
      role: assignedRole.trim(),
      assignedAt: new Date(),
    };

    // If still in SUBMITTED, automatically transition to UNDER REVIEW
    if (['SUBMITTED', 'Pending'].includes(complaint.status)) {
      complaint.status = 'UNDER REVIEW';
    }

    complaint.replies.push({
      author: req.user._id,
      authorName: `${req.user.name} (Admin)`,
      authorRole: 'admin',
      message: `Assigned issue to ${assignedName} (${assignedRole}) for on-ground investigation and action.`,
      createdAt: new Date(),
    });

    await complaint.save();

    // Notify student
    await Notification.create({
      recipient: complaint.student,
      targetRole: 'student',
      title: `Complaint #${complaint.ticketNumber} Assigned`,
      message: `Your grievance has been assigned to ${assignedName} (${assignedRole}) for inspection. Status is now ${complaint.status}.`,
      type: 'complaint',
      link: '/complaints',
    });

    // Audit Log Entry
    await recordAuditLog({
      action: 'ASSIGN_COMPLAINT',
      req,
      targetType: 'Complaint',
      targetId: complaint._id,
      summary: `Assigned complaint #${complaint.ticketNumber} to ${assignedName} (${assignedRole})`,
      details: { ticketNumber: complaint.ticketNumber, assignedName, assignedRole },
    });

    res.json({
      success: true,
      message: `Complaint #${complaint.ticketNumber} assigned to ${assignedName} (${assignedRole})`,
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reopen a complaint if issue is not resolved (Student)
// @route   POST /api/complaints/:id/reopen
// @access  Private (Student)
const reopenComplaint = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a clear reason why the issue remains unresolved',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Verify ownership
    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reopen this complaint' });
    }

    complaint.isReopened = true;
    complaint.reopenReason = reason.trim();
    complaint.reopenedAt = new Date();
    complaint.status = 'UNDER REVIEW'; // Set back to UNDER REVIEW for admin review

    complaint.replies.push({
      author: req.user._id,
      authorName: req.user.name,
      authorRole: 'student',
      message: `[REOPENED TICKET]: ${reason.trim()}`,
      createdAt: new Date(),
    });

    await complaint.save();

    // High priority notification to Admins
    await Notification.create({
      targetRole: 'admin',
      title: `Ticket #${complaint.ticketNumber} REOPENED by Student`,
      message: `${req.user.name} reported unresolved issue: "${reason.trim()}". Marked for admin review.`,
      type: 'complaint',
      priority: 'urgent',
      link: '/admin-complaints',
    });

    // Confirmation notification to Student
    await Notification.create({
      recipient: req.user._id,
      targetRole: 'student',
      title: `Complaint #${complaint.ticketNumber} Reopened`,
      message: `Your request to reopen #${complaint.ticketNumber} has been received and escalated to the Mess Bhaiya for re-inspection.`,
      type: 'complaint',
      link: '/complaints',
    });

    res.json({
      success: true,
      message: `Complaint #${complaint.ticketNumber} has been reopened and placed Under Review for admin escalation.`,
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
  replyToComplaint,
  assignComplaint,
  reopenComplaint,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
};
