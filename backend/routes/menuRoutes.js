const express = require('express');
const router = express.Router();
const {
  getWeeklyMenu,
  getTodayMenu,
  getTomorrowMenu,
  updateMenu,
  publishWeeklyMenu,
  rateMeal,
  submitSuggestion,
  getSuggestions,
  updateSuggestionStatus,
  upvoteSuggestion,
} = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public/Authenticated Menu routes
router.get('/weekly', getWeeklyMenu);
router.get('/today', getTodayMenu);
router.get('/tomorrow', getTomorrowMenu);

// Admin batch action
router.post('/publish-weekly', protect, authorizeRoles('admin', 'staff'), publishWeeklyMenu);

// Student rating
router.post('/rate', protect, rateMeal);

// Student suggestions & community upvotes
router.get('/suggestions', protect, getSuggestions);
router.post('/suggestions', protect, submitSuggestion);
router.put('/suggestions/:id', protect, authorizeRoles('admin', 'staff'), updateSuggestionStatus);
router.post('/suggestions/:id/upvote', protect, upvoteSuggestion);

// Update specific day menu
router.put('/:dayOfWeek', protect, authorizeRoles('admin', 'staff'), updateMenu);

module.exports = router;
