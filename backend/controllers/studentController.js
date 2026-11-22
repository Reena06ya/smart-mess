const User = require('../models/User');
const FeeInvoice = require('../models/FeeInvoice');
const { recordAuditLog } = require('../utils/auditLogger');

/**
 * Helper to determine floor name from room number or blockFloor string
 * e.g., '101' -> '1st Floor', '204' -> '2nd Floor', '302' -> '3rd Floor', 'G01' -> 'Ground Floor'
 */
const getFloorFromRoom = (roomNumber, blockFloor) => {
  if (blockFloor && blockFloor.toLowerCase().includes('floor')) {
    const match = blockFloor.match(/(Ground|[0-9]+(?:st|nd|rd|th)?)\s*Floor/i);
    if (match) return match[0];
  }

  const roomStr = String(roomNumber || '').trim();
  if (!roomStr) return '1st Floor';

  const firstChar = roomStr.charAt(0);
  if (firstChar === 'G' || firstChar === 'g' || firstChar === '0') return 'Ground Floor';
  if (firstChar === '1') return '1st Floor';
  if (firstChar === '2') return '2nd Floor';
  if (firstChar === '3') return '3rd Floor';
  if (firstChar === '4') return '4th Floor';
  if (firstChar === '5') return '5th Floor';

  return '1st Floor';
};

// @desc    Get all students with room & mess details
// @route   GET /api/students
// @access  Private (Admin / Staff)
const getAllStudents = async (req, res) => {
  try {
    const { block, status, diet, search } = req.query;

    const query = { role: 'student' };

    if (block && block !== 'All') {
      query.hostelBlock = block;
    }
    if (status && status !== 'All') {
      query.messStatus = status;
    }
    if (diet && diet !== 'All') {
      query.dietPreference = diet;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(query).sort({ hostelBlock: 1, roomNumber: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get advanced room-wise student hierarchy & metrics
// @route   GET /api/students/room-wise
// @access  Private (Admin / Staff)
const getRoomWiseStudents = async (req, res) => {
  try {
    const { search, block, floor, unpaidOnly, status } = req.query;

    const studentQuery = { role: 'student' };
    if (status && status !== 'All') {
      studentQuery.messStatus = status;
    }
    if (block && block !== 'All') {
      studentQuery.hostelBlock = block;
    }

    const students = await User.find(studentQuery).sort({
      hostelBlock: 1,
      roomNumber: 1,
      bedNumber: 1,
    });

    // Fetch all latest fee invoices to attach real-time fee statuses
    const invoices = await FeeInvoice.find({}).sort({ createdAt: -1 });

    // Build latest invoice lookup map per student
    const studentInvoiceMap = {};
    for (const inv of invoices) {
      const sId = inv.student?.toString();
      if (sId && !studentInvoiceMap[sId]) {
        studentInvoiceMap[sId] = inv;
      }
    }

    // Enrich students with fee status
    const enrichedStudents = students.map((s) => {
      const latestInv = studentInvoiceMap[s._id.toString()];
      let feeStatus = 'PAID';

      if (latestInv) {
        const remaining = Math.max(0, (latestInv.totalAmount || 0) - (latestInv.paidAmount || 0));
        if (remaining <= 0 || latestInv.status === 'PAID') {
          feeStatus = 'PAID';
        } else if (latestInv.paidAmount > 0 && remaining > 0) {
          feeStatus = 'PARTIALLY PAID';
        } else if (latestInv.dueDate && new Date(latestInv.dueDate) < new Date()) {
          feeStatus = 'OVERDUE';
        } else {
          feeStatus = 'PENDING';
        }
      } else {
        feeStatus = (s.balanceDue || 0) > 0 ? 'PENDING' : 'PAID';
      }

      const derivedFloor = getFloorFromRoom(s.roomNumber, s.blockFloor);

      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        phone: s.phone || 'N/A',
        avatar: s.avatar || '',
        studentId: s.studentId || 'N/A',
        hostelName: s.hostelName || 'CV Raman Central Hostel',
        hostelBlock: s.hostelBlock || 'Block A',
        blockFloor: s.blockFloor || derivedFloor,
        floor: derivedFloor,
        roomNumber: s.roomNumber || '101',
        bedNumber: s.bedNumber || 'Bed-1',
        dietPreference: s.dietPreference || 'Veg',
        messStatus: s.messStatus || 'Active',
        monthlyMessPlan: s.monthlyMessPlan || 3800,
        balanceDue: s.balanceDue || 0,
        latestFeeStatus: feeStatus,
        latestInvoiceMonth: latestInv?.month || 'Current Month',
      };
    });

    // Grouping by Room
    const roomsMap = {};

    enrichedStudents.forEach((student) => {
      const roomKey = `${student.hostelBlock}___${student.floor}___${student.roomNumber}`;

      if (!roomsMap[roomKey]) {
        roomsMap[roomKey] = {
          id: roomKey,
          roomNumber: student.roomNumber,
          block: student.hostelBlock,
          floor: student.floor,
          students: [],
          totalStudents: 0,
          totalPendingFees: 0,
          hasUnpaid: false,
        };
      }

      roomsMap[roomKey].students.push(student);
      roomsMap[roomKey].totalStudents++;
      roomsMap[roomKey].totalPendingFees += student.balanceDue || 0;

      if (student.balanceDue > 0 || student.latestFeeStatus !== 'PAID') {
        roomsMap[roomKey].hasUnpaid = true;
      }
    });

    let roomsList = Object.values(roomsMap);

    // Filter by Floor if specified
    if (floor && floor !== 'All') {
      roomsList = roomsList.filter((r) => r.floor.toLowerCase() === floor.toLowerCase());
    }

    // Filter only unpaid students / rooms if requested
    if (unpaidOnly === 'true' || unpaidOnly === true) {
      roomsList = roomsList.filter((r) => r.hasUnpaid);
    }

    // Search across room number, student name, or enrollment ID
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      roomsList = roomsList.filter((r) => {
        const matchesRoom = r.roomNumber.toLowerCase().includes(q);
        const matchesStudent = r.students.some(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.studentId.toLowerCase().includes(q) ||
            s.phone.toLowerCase().includes(q)
        );
        return matchesRoom || matchesStudent;
      });
    }

    // Sort rooms in natural numerical order
    roomsList.sort((a, b) => {
      if (a.block !== b.block) return a.block.localeCompare(b.block);
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    });

    // Summary Statistics
    const totalRooms = roomsList.length;
    const totalStudentsInView = roomsList.reduce((acc, r) => acc + r.totalStudents, 0);
    const totalPendingFeesInView = roomsList.reduce((acc, r) => acc + r.totalPendingFees, 0);
    const unpaidStudentsCount = roomsList.reduce(
      (acc, r) => acc + r.students.filter((s) => s.balanceDue > 0 || s.latestFeeStatus !== 'PAID').length,
      0
    );

    // Distinct Blocks & Floors for UI filters
    const allBlocks = Array.from(new Set(enrichedStudents.map((s) => s.hostelBlock))).sort();
    const allFloors = Array.from(new Set(enrichedStudents.map((s) => s.floor))).sort();

    res.json({
      success: true,
      stats: {
        totalRooms,
        totalStudents: totalStudentsInView,
        totalPendingFees: totalPendingFeesInView,
        unpaidStudentsCount,
        allBlocks,
        allFloors,
      },
      data: roomsList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students in a specific room
// @route   GET /api/students/room/:roomNumber
// @access  Private (Admin / Staff)
const getStudentsByRoom = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const students = await User.find({ role: 'student', roomNumber });

    const totalPending = students.reduce((acc, s) => acc + (s.balanceDue || 0), 0);

    res.json({
      success: true,
      roomNumber,
      count: students.length,
      totalPendingFees: totalPending,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new student by Mess Admin
// @route   POST /api/students
// @access  Private (Admin / Staff)
const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password = 'password123',
      phone,
      studentId,
      hostelName = 'CV Raman Central Hostel',
      hostelBlock = 'Block A',
      blockFloor = '1st Floor',
      roomNumber = '101',
      bedNumber = 'Bed-1',
      dietPreference = 'Veg',
      messStatus = 'Active',
      monthlyMessPlan = 3800,
      balanceDue = 3800,
      avatar = '',
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    if (studentId) {
      const idExists = await User.findOne({ studentId });
      if (idExists) {
        return res.status(400).json({ success: false, message: 'Student ID already assigned to another hosteller' });
      }
    }

    const generatedId = studentId || `SM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const finalAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f172a&textColor=10b981`;

    const newStudent = await User.create({
      name,
      email,
      password,
      role: 'student',
      phone,
      avatar: finalAvatar,
      studentId: generatedId,
      hostelName,
      hostelBlock,
      blockFloor,
      roomNumber,
      bedNumber,
      dietPreference,
      messStatus,
      monthlyMessPlan: Number(monthlyMessPlan) || 3800,
      balanceDue: Number(balanceDue) || 0,
    });

    // Auto-create current month's invoice if balanceDue > 0
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    const planAmount = Number(monthlyMessPlan) || 3800;
    await FeeInvoice.create({
      student: newStudent._id,
      month: monthName,
      year: currentDate.getFullYear(),
      baseAmount: planAmount,
      rebateDiscount: 0,
      totalAmount: planAmount,
      paidAmount: 0,
      status: 'PENDING',
      dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10),
      notes: `Hostel mess subscription billing for ${monthName}`,
    });

    // Audit Log Entry
    await recordAuditLog({
      action: 'CREATE_STUDENT',
      req,
      targetType: 'User',
      targetId: newStudent._id,
      summary: `Enrolled new student ${name} (ID: ${generatedId}) into Room ${roomNumber} (${hostelBlock})`,
      details: { studentId: generatedId, roomNumber, hostelBlock, monthlyMessPlan: planAmount },
    });

    res.status(201).json({
      success: true,
      data: newStudent,
      message: `Student ${name} enrolled in Room ${roomNumber} with initial mess invoice`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin / Staff)
const updateStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const {
      name,
      phone,
      avatar,
      hostelName,
      hostelBlock,
      blockFloor,
      roomNumber,
      bedNumber,
      dietPreference,
      messStatus,
      monthlyMessPlan,
      balanceDue,
    } = req.body;

    if (name) student.name = name;
    if (phone !== undefined) student.phone = phone;
    if (avatar) student.avatar = avatar;
    if (hostelName) student.hostelName = hostelName;
    if (hostelBlock) student.hostelBlock = hostelBlock;
    if (blockFloor) student.blockFloor = blockFloor;
    if (roomNumber) student.roomNumber = roomNumber;
    if (bedNumber) student.bedNumber = bedNumber;
    if (dietPreference) student.dietPreference = dietPreference;
    if (messStatus) student.messStatus = messStatus;
    if (monthlyMessPlan !== undefined) student.monthlyMessPlan = Number(monthlyMessPlan);
    if (balanceDue !== undefined) student.balanceDue = Number(balanceDue);

    const updated = await student.save();

    // Audit Log Entry
    await recordAuditLog({
      action: 'UPDATE_STUDENT_INFO',
      req,
      targetType: 'User',
      targetId: student._id,
      summary: `Updated hosteller record for ${student.name} (Room ${student.roomNumber})`,
      details: { roomNumber: student.roomNumber, messStatus: student.messStatus, dietPreference: student.dietPreference },
    });

    res.json({
      success: true,
      data: updated,
      message: `Student details updated for Room ${student.roomNumber}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate student who leaves the hostel
// @route   PUT /api/students/:id/deactivate
// @access  Private (Admin)
const deactivateStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const isDeactivated = student.messStatus === 'Deactivated' || student.messStatus === 'Left Hostel';
    student.messStatus = isDeactivated ? 'Active' : 'Deactivated';
    await student.save();

    // Audit Log Entry
    await recordAuditLog({
      action: 'TOGGLE_STUDENT_DEACTIVATION',
      req,
      targetType: 'User',
      targetId: student._id,
      summary: `Changed hosteller ${student.name} mess status to ${student.messStatus}`,
      details: { previousStatus: isDeactivated ? 'Deactivated' : 'Active', newStatus: student.messStatus },
    });

    res.json({
      success: true,
      message: `Student ${student.name} ${student.messStatus === 'Deactivated' ? 'deactivated (marked as Left Hostel)' : 'reactivated'}`,
      data: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete student record permanently
// @route   DELETE /api/students/:id
// @access  Private (Admin)
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    await FeeInvoice.deleteMany({ student: req.params.id });

    res.json({
      success: true,
      message: `Student record and billing history for ${student.name} removed`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard student statistics
// @route   GET /api/students/stats/summary
// @access  Private (Admin / Staff)
const getStudentStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ role: 'student', messStatus: 'Active' });
    const deactivatedStudents = await User.countDocuments({
      role: 'student',
      messStatus: { $in: ['Deactivated', 'Left Hostel'] },
    });
    const onLeaveStudents = await User.countDocuments({ role: 'student', messStatus: 'On Leave' });

    const totalDueAgg = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: null, totalDue: { $sum: '$balanceDue' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        deactivatedStudents,
        onLeaveStudents,
        totalBalanceDue: totalDueAgg[0] ? totalDueAgg[0].totalDue : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student details with invoices
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const invoices = await FeeInvoice.find({ student: student._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        student,
        invoices,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllStudents,
  getRoomWiseStudents,
  getStudentsByRoom,
  getStudentById,
  createStudent,
  updateStudent,
  deactivateStudent,
  deleteStudent,
  getStudentStats,
};
