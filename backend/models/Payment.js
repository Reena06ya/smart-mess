const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeInvoice',
      required: true,
    },
    amount: {
      type: Number,
      required: true, // in INR
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['Razorpay', 'Cash', 'UPI', 'Bank Transfer'],
      default: 'Razorpay',
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PAID', 'PENDING', 'PARTIALLY PAID', 'OVERDUE', 'FAILED', 'successful', 'created', 'failed', 'refunded'],
      default: 'successful',
    },
    receiptNumber: {
      type: String,
      required: true,
    },
    paymentReference: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    isPartial: {
      type: Boolean,
      default: false,
    },
    remainingBalance: {
      type: Number,
      default: 0,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedByName: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
