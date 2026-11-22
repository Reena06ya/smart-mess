const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  authorName: {
    type: String,
    required: true,
  },
  authorRole: {
    type: String,
    enum: ['admin', 'staff', 'student'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentRoom: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      default: '',
    },
    studentPhone: {
      type: String,
      default: '',
    },
    studentEmail: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Food Quality',
        'Food Quantity',
        'Hygiene and Cleanliness',
        'Late Food Service',
        'Menu-Related Issues',
        'Staff Behaviour',
        'Water Issues',
        'Other Problems',
        // Legacy aliases
        'Hygiene & Cleanliness',
        'Mess Staff & Service',
        'Billing & Fees',
        'Timing & Delay',
        'Utensils & Water',
        'Other',
      ],
      required: [true, 'Complaint category is required'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER REVIEW',
        'IN PROGRESS',
        'RESOLVED',
        'REJECTED',
        'REOPENED',
        // Legacy support
        'Pending',
        'In Progress',
        'Resolved',
        'Rejected',
      ],
      default: 'SUBMITTED',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    incidentDate: {
      type: Date,
      default: Date.now,
    },
    assignedTo: {
      name: { type: String, default: 'Unassigned' },
      role: { type: String, default: '' },
      assignedAt: { type: Date },
    },
    replies: [replySchema],
    adminResponse: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedByName: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
    isReopened: {
      type: Boolean,
      default: false,
    },
    reopenReason: {
      type: String,
      default: '',
    },
    reopenedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Complaint', complaintSchema);
