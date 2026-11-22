const express = require('express');
const router = express.Router();
const { getAnalyticsDashboard, getAuditLogs } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// @route   GET /api/analytics/dashboard
// @desc    Get complete analytics dashboard data with filters
// @access  Private (Admin / Staff)
router.get('/dashboard', protect, authorizeRoles('admin', 'staff'), getAnalyticsDashboard);

// @route   GET /api/analytics/audit-logs
// @desc    Get administrative audit logs
// @access  Private (Admin)
router.get('/audit-logs', protect, authorizeRoles('admin'), getAuditLogs);

module.exports = router;
