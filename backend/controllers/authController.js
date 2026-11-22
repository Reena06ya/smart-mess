const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FeeInvoice = require('../models/FeeInvoice');
const Notification = require('../models/Notification');
const emailService = require('../utils/emailService');
const { recordAuditLog } = require('../utils/auditLogger');
const { isValidEmail, isValidImagePayload, sanitizeText } = require('../utils/securityValidator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'smart_mess_jwt_super_secret_key_2026_production', {
    expiresIn: '30d',
  });
};

// @desc    Register a new STUDENT (Public Registration)
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      studentId,
      avatar = '',
      hostelName = 'CV Raman Central Hostel',
      blockFloor = 'Block A / 2nd Floor',
      roomNumber = '101',
      bedNumber = 'Bed-1',
      dietPreference = 'Veg',
    } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password || !studentId || !roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Full Name, Email, Password, Student ID, and Room Number',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g. user@hostel.edu)',
      });
    }

    if (avatar) {
      const imgCheck = isValidImagePayload(avatar);
      if (!imgCheck.valid) {
        return res.status(400).json({
          success: false,
          message: imgCheck.error || 'Invalid avatar image format',
        });
      }
    }

    // 2. Check for duplicate email
    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in or use another email.',
      });
    }

    // 3. Check for duplicate student ID / Enrollment number
    const trimmedStudentId = studentId.trim();
    const idExists = await User.findOne({ studentId: { $regex: new RegExp(`^${trimmedStudentId}$`, 'i') } });
    if (idExists) {
      return res.status(400).json({
        success: false,
        message: `Student ID / Enrollment Number '${trimmedStudentId}' is already registered. Please check your ID or contact mess office.`,
      });
    }

    // Default avatar if none provided
    const userAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f172a&textColor=10b981`;

    // 4. Create Student - STRICTLY enforce role: 'student'
    const student = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student', // Public registration CANNOT create admin accounts
      phone: phone ? phone.trim() : '',
      studentId: trimmedStudentId,
      avatar: userAvatar,
      hostelName: hostelName.trim(),
      hostelBlock: blockFloor.split('/')[0].trim() || 'Block A',
      blockFloor: blockFloor.trim(),
      roomNumber: roomNumber.trim(),
      bedNumber: bedNumber ? bedNumber.trim() : 'Bed-1',
      dietPreference,
      messStatus: 'Active',
      monthlyMessPlan: 3800,
      balanceDue: 3800,
    });

    // 5. Automatically create initial fee invoice for current month
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10);

    await FeeInvoice.create({
      student: student._id,
      month: monthName,
      year: currentDate.getFullYear(),
      baseAmount: 3800,
      rebateDiscount: 0,
      totalAmount: 3800,
      paidAmount: 0,
      status: 'Pending',
      dueDate,
      notes: `Hostel mess charges for ${monthName}`,
    });

    // Notify Admins about new student registration
    await Notification.create({
      recipient: null,
      targetRole: 'admin',
      title: 'New Student Registration',
      message: `${student.name} (${student.studentId || 'ID Pending'}) has registered from Room ${student.roomNumber} (${student.hostelBlock}).`,
      type: 'registration',
      priority: 'normal',
      link: '/students',
    });

    // Simulated / live email alert to Admin
    emailService.sendAdminRegistrationAlert('bhaiya@smartmess.in', student);

    // Audit Log Entry
    await recordAuditLog({
      action: 'REGISTER_STUDENT',
      req: { ...req, user: student },
      targetType: 'User',
      targetId: student._id,
      summary: `Student self-registered: ${student.name} (${student.studentId}) in Room ${student.roomNumber}`,
      details: { studentId: student.studentId, roomNumber: student.roomNumber, hostelBlock: student.hostelBlock },
    });

    res.status(201).json({
      success: true,
      message: 'Student registration successful! Welcome to Smart Mess.',
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        phone: student.phone,
        studentId: student.studentId,
        avatar: student.avatar,
        hostelName: student.hostelName,
        blockFloor: student.blockFloor,
        hostelBlock: student.hostelBlock,
        roomNumber: student.roomNumber,
        bedNumber: student.bedNumber,
        dietPreference: student.dietPreference,
        balanceDue: student.balanceDue,
        monthlyMessPlan: student.monthlyMessPlan,
        token: generateToken(student._id),
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    STUDENT Login
// @route   POST /api/auth/student-login
// @access  Public
const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter your email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid student email address or password' });
    }

    // Role check: Prevent Admin from logging into student portal
    if (user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'This account belongs to an Administrator. Please use the Mess Bhaiya / Admin login portal.',
      });
    }

    res.json({
      success: true,
      message: 'Welcome back, Student!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.studentId,
        avatar: user.avatar,
        hostelName: user.hostelName,
        blockFloor: user.blockFloor,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        bedNumber: user.bedNumber,
        dietPreference: user.dietPreference,
        balanceDue: user.balanceDue,
        monthlyMessPlan: user.monthlyMessPlan,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    ADMIN (Mess Bhaiya) Login
// @route   POST /api/auth/admin-login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter admin email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Strict Role Enforcement: Students CANNOT log in via Admin portal
    if (user.role !== 'admin' && user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This portal is strictly restricted to authorized Mess Administrators and Staff.',
      });
    }

    res.json({
      success: true,
      message: 'Admin authorization granted. Welcome Mess Bhaiya!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    General Login (Fallback supporting both roles)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.studentId,
        avatar: user.avatar,
        hostelName: user.hostelName,
        blockFloor: user.blockFloor,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        bedNumber: user.bedNumber,
        dietPreference: user.dietPreference,
        balanceDue: user.balanceDue,
        monthlyMessPlan: user.monthlyMessPlan,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create an ADMIN account (Only an existing Administrator can create/promote)
// @route   POST /api/auth/create-admin
// @access  Private (Admin Only)
const createAdminAccount = async (req, res) => {
  try {
    const { name, email, password, phone, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Admin name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    const adminAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1e3a8a&textColor=ffffff`;

    const newAdmin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
      phone: phone ? phone.trim() : '',
      avatar: adminAvatar,
      hostelBlock: 'N/A',
      roomNumber: 'Mess Office',
      bedNumber: 'Office',
      dietPreference: 'Veg',
      messStatus: 'Active',
      balanceDue: 0,
      monthlyMessPlan: 0,
    });

    // Audit Log Entry
    await recordAuditLog({
      action: 'CREATE_ADMIN_ACCOUNT',
      req,
      targetType: 'User',
      targetId: newAdmin._id,
      summary: `Super Admin created new admin account for ${newAdmin.name} (${newAdmin.email})`,
      details: { adminId: newAdmin._id, name: newAdmin.name, email: newAdmin.email },
    });

    res.status(201).json({
      success: true,
      message: `Admin account for ${newAdmin.name} created successfully!`,
      data: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        phone: newAdmin.phone,
        avatar: newAdmin.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password - Request Reset Token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address was found',
      });
    }

    // Generate reset token and set expiry
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // In a live environment with an SMTP server, an email would be dispatched.
    // For local/test readiness, we return the token and instructions directly.
    res.json({
      success: true,
      message: 'Password reset token generated successfully. Valid for 30 minutes.',
      resetToken,
      expiresIn: '30 minutes',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password with Token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password with at least 6 characters',
      });
    }

    // Hash the token provided in URL
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token. Please request a new link.',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully! You can now log in with your new password.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.avatar = req.body.avatar || user.avatar;
    user.dietPreference = req.body.dietPreference || user.dietPreference;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  loginAdmin,
  loginUser,
  createAdminAccount,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
};
