const mongoose = require('mongoose');

const feeInvoiceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String,
      required: true, // e.g. "November 2026"
    },
    year: {
      type: Number,
      required: true,
    },
    baseAmount: {
      type: Number,
      required: true,
      default: 3800,
    },
    rebateDiscount: {
      type: Number,
      default: 0,
    },
    extraCharges: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['PAID', 'PENDING', 'PARTIALLY PAID', 'OVERDUE', 'FAILED', 'Paid', 'Pending', 'Partial', 'Partially Paid', 'Overdue', 'Failed'],
      default: 'PENDING',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['Razorpay', 'Cash', 'UPI', 'NetBanking', 'Bank Transfer', 'None'],
      default: 'None',
    },
    transactionId: {
      type: String,
      default: '',
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    notes: {
      type: String,
      default: 'Monthly Hostel Mess charges',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customAmountReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Method to automatically calculate and update status based on payments and due date
feeInvoiceSchema.methods.calculateStatus = function () {
  if (this.status === 'FAILED') return 'FAILED';
  const total = Number(this.totalAmount) || 0;
  const paid = Number(this.paidAmount) || 0;

  if (paid >= total && total > 0) {
    this.status = 'PAID';
  } else if (paid > 0 && paid < total) {
    this.status = 'PARTIALLY PAID';
  } else if (this.dueDate && new Date(this.dueDate) < new Date()) {
    this.status = 'OVERDUE';
  } else {
    this.status = 'PENDING';
  }
  return this.status;
};

module.exports = mongoose.model('FeeInvoice', feeInvoiceSchema);
