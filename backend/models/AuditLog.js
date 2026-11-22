const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    adminName: {
      type: String,
      default: 'Mess Administrator',
    },
    adminEmail: {
      type: String,
      default: '',
    },
    adminRole: {
      type: String,
      default: 'admin',
    },
    targetType: {
      type: String,
      enum: ['FeeInvoice', 'Payment', 'User', 'Complaint', 'Menu', 'System', 'Auth'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
