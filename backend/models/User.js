const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'staff'],
      default: 'student',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    // Student Specific Fields
    studentId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows null/undefined for admins without conflict
    },
    hostelName: {
      type: String,
      trim: true,
      default: 'CV Raman Central Hostel',
    },
    hostelBlock: {
      type: String,
      trim: true,
      default: 'Block A',
    },
    blockFloor: {
      type: String,
      trim: true,
      default: 'Block A / 2nd Floor',
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '101',
    },
    bedNumber: {
      type: String,
      trim: true,
      default: 'Bed-1',
    },
    dietPreference: {
      type: String,
      enum: ['Veg', 'Non-Veg', 'Jain', 'Eggetarian'],
      default: 'Veg',
    },
    messStatus: {
      type: String,
      enum: ['Active', 'Deactivated', 'Inactive', 'On Leave', 'Suspended', 'Left Hostel'],
      default: 'Active',
    },
    monthlyMessPlan: {
      type: Number,
      default: 3800, // INR per month
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    // Password Reset Tokens
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate random 20-byte token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expire time (30 minutes from now)
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
