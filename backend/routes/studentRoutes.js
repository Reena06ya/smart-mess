const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getRoomWiseStudents,
  getStudentsByRoom,
  getStudentById,
  createStudent,
  updateStudent,
  deactivateStudent,
  deleteStudent,
  getStudentStats,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/stats/summary', protect, authorizeRoles('admin', 'staff'), getStudentStats);
router.get('/room-wise', protect, authorizeRoles('admin', 'staff'), getRoomWiseStudents);
router.get('/room/:roomNumber', protect, authorizeRoles('admin', 'staff'), getStudentsByRoom);
router.get('/', protect, authorizeRoles('admin', 'staff'), getAllStudents);
router.get('/:id', protect, getStudentById);
router.post('/', protect, authorizeRoles('admin', 'staff'), createStudent);
router.put('/:id', protect, authorizeRoles('admin', 'staff'), updateStudent);
router.put('/:id/deactivate', protect, authorizeRoles('admin', 'staff'), deactivateStudent);
router.delete('/:id', protect, authorizeRoles('admin'), deleteStudent);

module.exports = router;
