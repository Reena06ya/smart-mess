const express = require('express');
const router = express.Router();
const {
  getRebates,
  applyRebate,
  reviewRebate,
} = require('../controllers/rebateController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, getRebates);
router.post('/', protect, applyRebate);
router.put('/:id/review', protect, authorizeRoles('admin', 'staff'), reviewRebate);

module.exports = router;
