const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAnnouncement,
  checkDueReminders,
  checkUnresolvedComplaints,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);

// Static PUT routes BEFORE dynamic parameter routes
router.put('/mark-all/read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

router.delete('/:id', protect, deleteNotification);

// Admin operations
router.post('/broadcast', protect, authorizeRoles('admin', 'staff'), createAnnouncement);
router.post('/check-due-reminders', protect, authorizeRoles('admin', 'staff'), checkDueReminders);
router.post('/unresolved-complaints-alert', protect, authorizeRoles('admin', 'staff'), checkUnresolvedComplaints);

module.exports = router;
