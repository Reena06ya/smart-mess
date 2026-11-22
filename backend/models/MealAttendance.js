const mongoose = require('mongoose');

const mealAttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      default: '',
    },
    roomNumber: {
      type: String,
      default: '',
    },
    hostelBlock: {
      type: String,
      default: '',
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'snacks', 'dinner'],
      required: true,
    },
    passToken: {
      type: String,
      required: true,
    },
    scanned: {
      type: Boolean,
      default: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate check-in per meal per date
mealAttendanceSchema.index({ student: 1, date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('MealAttendance', mealAttendanceSchema);
