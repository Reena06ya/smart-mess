const express = require('express');
const router = express.Router();
const {
  getMyPasses,
  checkInMeal,
  getLiveHeadcount,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/my-passes', protect, getMyPasses);
router.post('/check-in', protect, checkInMeal);
router.get('/headcount', protect, authorizeRoles('admin', 'staff'), getLiveHeadcount);

module.exports = router;
