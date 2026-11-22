const express = require('express');
const router = express.Router();
const {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
  replyToComplaint,
  assignComplaint,
  reopenComplaint,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get all (filtered by role) & Create complaint
router.get('/', protect, getComplaints);
router.post('/', protect, createComplaint);

// Single complaint
router.get('/:id', protect, getComplaintById);

// Admin actions
router.put('/:id/status', protect, authorizeRoles('admin', 'staff'), updateComplaintStatus);
router.put('/:id/assign', protect, authorizeRoles('admin', 'staff'), assignComplaint);

// Collaborative actions
router.post('/:id/reply', protect, replyToComplaint);

// Student reopen
router.post('/:id/reopen', protect, reopenComplaint);

module.exports = router;
