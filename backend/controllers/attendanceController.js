const MealAttendance = require('../models/MealAttendance');
const User = require('../models/User');

const getTodayDateStr = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);
  return istDate.toISOString().split('T')[0];
};

// @desc    Get student's today passes and check-in statuses
// @route   GET /api/attendance/my-passes
// @access  Private (Student)
const getMyPasses = async (req, res) => {
  try {
    const today = getTodayDateStr();
    const records = await MealAttendance.find({
      student: req.user._id,
      date: today,
    });

    const mealTypes = ['breakfast', 'lunch', 'snacks', 'dinner'];
    const passes = mealTypes.map((type) => {
      const record = records.find((r) => r.mealType === type);
      return {
        mealType: type,
        date: today,
        tokenCode: `PASS-${req.user._id.toString().slice(-4)}-${type.toUpperCase().slice(0, 3)}-${today}`,
        isClaimed: !!record,
        scannedAt: record ? record.scannedAt : null,
      };
    });

    res.json({
      success: true,
      date: today,
      passes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check-in / Consume meal pass
// @route   POST /api/attendance/check-in
// @access  Private
const checkInMeal = async (req, res) => {
  try {
    const { mealType, studentId } = req.body;
    const today = getTodayDateStr();

    const targetStudentId = studentId || req.user._id;
    const student = await User.findById(targetStudentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.messStatus === 'On Leave' || student.messStatus === 'Suspended') {
      return res.status(400).json({
        success: false,
        message: `Student mess status is '${student.messStatus}'. Meal pass cannot be verified.`,
      });
    }

    const existing = await MealAttendance.findOne({
      student: student._id,
      date: today,
      mealType,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Meal already verified for ${mealType.toUpperCase()} at ${new Date(
          existing.scannedAt
        ).toLocaleTimeString('en-IN')}`,
        data: existing,
      });
    }

    const passToken = `PASS-${student._id.toString().slice(-4)}-${mealType.toUpperCase().slice(0, 3)}-${today}`;

    const record = await MealAttendance.create({
      student: student._id,
      studentName: student.name,
      studentId: student.studentId,
      roomNumber: student.roomNumber,
      hostelBlock: student.hostelBlock,
      date: today,
      mealType,
      passToken,
      scanned: true,
      scannedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `Meal token verified for ${student.name} (${mealType.toUpperCase()})! Enjoy your meal.`,
      data: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get live headcount and attendance analytics (Admin)
// @route   GET /api/attendance/headcount
// @access  Private (Admin / Staff)
const getLiveHeadcount = async (req, res) => {
  try {
    const today = getTodayDateStr();

    const activeTotal = await User.countDocuments({ role: 'student', messStatus: 'Active' });

    const attendanceRecords = await MealAttendance.find({ date: today }).sort({ scannedAt: -1 });

    const counts = {
      breakfast: attendanceRecords.filter((r) => r.mealType === 'breakfast').length,
      lunch: attendanceRecords.filter((r) => r.mealType === 'lunch').length,
      snacks: attendanceRecords.filter((r) => r.mealType === 'snacks').length,
      dinner: attendanceRecords.filter((r) => r.mealType === 'dinner').length,
    };

    res.json({
      success: true,
      date: today,
      totalActiveStudents: activeTotal,
      counts,
      recentCheckIns: attendanceRecords.slice(0, 15),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyPasses,
  checkInMeal,
  getLiveHeadcount,
};
