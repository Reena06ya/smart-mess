const FeeInvoice = require('../models/FeeInvoice');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../utils/emailService');
const { recordAuditLog } = require('../utils/auditLogger');
const { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature } = require('../config/razorpay');

/**
 * Helper to normalize and ensure invoice status is current
 */
const refreshInvoiceStatus = (inv) => {
  const total = Number(inv.totalAmount) || 0;
  const paid = Number(inv.paidAmount) || 0;

  if (paid >= total && total > 0) {
    inv.status = 'PAID';
  } else if (paid > 0 && paid < total) {
    inv.status = 'PARTIALLY PAID';
  } else if (inv.dueDate && new Date(inv.dueDate) < new Date()) {
    inv.status = 'OVERDUE';
  } else {
    inv.status = 'PENDING';
  }
  return inv;
};

// @desc    Get student's own invoices & payment summary
// @route   GET /api/fees/my-invoices
// @access  Private (Student)
const getMyInvoices = async (req, res) => {
  try {
    const invoices = await FeeInvoice.find({ student: req.user._id })
      .populate('student', 'name studentId hostelName hostelBlock roomNumber bedNumber phone email')
      .sort({ createdAt: -1 });

    // Refresh statuses dynamically
    for (const inv of invoices) {
      const oldStatus = inv.status;
      refreshInvoiceStatus(inv);
      if (oldStatus !== inv.status) {
        await inv.save();
      }
    }

    const payments = await Payment.find({ student: req.user._id })
      .populate('invoice', 'month totalAmount paidAmount dueDate')
      .sort({ paidAt: -1 });

    const totalMessFees = invoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    const totalPending = invoices.reduce(
      (acc, curr) => acc + Math.max(0, (curr.totalAmount || 0) - (curr.paidAmount || 0)),
      0
    );

    const pendingInvoices = invoices.filter((inv) => inv.status !== 'PAID');
    const nextDueDate = pendingInvoices.length > 0 ? pendingInvoices[0].dueDate : null;
    const currentInvoice = invoices[0] || null;

    res.json({
      success: true,
      data: {
        invoices,
        payments,
        totalMessFees,
        totalPaid,
        totalPending,
        nextDueDate,
        currentInvoice,
        totalDue: totalPending,
        monthlyPlan: req.user.monthlyMessPlan || 3800,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all invoices with flexible filters (Admin)
// @route   GET /api/fees/all
// @access  Private (Admin / Staff)
const getAllInvoices = async (req, res) => {
  try {
    const { status, month, roomNumber, search } = req.query;
    const query = {};

    if (month && month !== 'All') {
      query.month = month;
    }

    let invoices = await FeeInvoice.find(query)
      .populate('student', 'name email studentId hostelBlock roomNumber bedNumber phone messStatus monthlyMessPlan')
      .sort({ createdAt: -1 });

    // Update statuses
    for (const inv of invoices) {
      const oldStatus = inv.status;
      refreshInvoiceStatus(inv);
      if (oldStatus !== inv.status) {
        await inv.save();
      }
    }

    // Filter by status if specified
    if (status && status !== 'All') {
      const targetStatus = status.toUpperCase();
      invoices = invoices.filter((inv) => {
        const invStatus = (inv.status || '').toUpperCase();
        if (targetStatus === 'PARTIAL' || targetStatus === 'PARTIALLY PAID') {
          return invStatus === 'PARTIALLY PAID' || invStatus === 'PARTIAL';
        }
        if (targetStatus === 'UNPAID') {
          return invStatus === 'PENDING' || invStatus === 'OVERDUE' || invStatus === 'PARTIALLY PAID';
        }
        return invStatus === targetStatus;
      });
    }

    // Filter by room number
    if (roomNumber && roomNumber !== 'All') {
      invoices = invoices.filter(
        (inv) => inv.student?.roomNumber?.toLowerCase() === roomNumber.toLowerCase()
      );
    }

    // Search by student name or student ID
    if (search) {
      const s = search.toLowerCase();
      invoices = invoices.filter(
        (inv) =>
          inv.student &&
          (inv.student.name?.toLowerCase().includes(s) ||
            inv.student.studentId?.toLowerCase().includes(s) ||
            inv.student.roomNumber?.toLowerCase().includes(s))
      );
    }

    // Calculate aggregated stats across all matching invoices
    const allInvoices = await FeeInvoice.find(month && month !== 'All' ? { month } : {});
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    for (const inv of allInvoices) {
      refreshInvoiceStatus(inv);
      totalInvoiced += inv.totalAmount || 0;
      totalCollected += inv.paidAmount || 0;
      totalPending += Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));

      if (inv.status === 'PAID') paidCount++;
      else if (inv.status === 'PARTIALLY PAID') partialCount++;
      else if (inv.status === 'OVERDUE') overdueCount++;
      else pendingCount++;
    }

    res.json({
      success: true,
      count: invoices.length,
      stats: {
        totalInvoiced,
        totalCollected,
        totalPending,
        paidCount,
        partialCount,
        pendingCount,
        overdueCount,
      },
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate monthly invoices for students (Admin)
// @route   POST /api/fees/generate-monthly
// @access  Private (Admin)
const generateMonthlyInvoices = async (req, res) => {
  try {
    const {
      month,
      year,
      baseAmount = 3800,
      dueDate,
      dueInDays = 15,
      studentId, // Optional: generate for a single student
    } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Please provide billing month and year' });
    }

    const monthStr = `${month} ${year}`;

    // Target students: either single student or all active students
    let targetStudents = [];
    if (studentId) {
      const single = await User.findById(studentId);
      if (!single) {
        return res.status(404).json({ success: false, message: 'Target student not found' });
      }
      targetStudents = [single];
    } else {
      targetStudents = await User.find({ role: 'student', messStatus: 'Active' });
    }

    let finalDueDate;
    if (dueDate) {
      finalDueDate = new Date(dueDate);
    } else {
      finalDueDate = new Date();
      finalDueDate.setDate(finalDueDate.getDate() + Number(dueInDays));
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const student of targetStudents) {
      const existing = await FeeInvoice.findOne({ student: student._id, month: monthStr });
      if (!existing) {
        const studentFee = Number(student.monthlyMessPlan) || Number(baseAmount);
        await FeeInvoice.create({
          student: student._id,
          month: monthStr,
          year: Number(year),
          baseAmount: studentFee,
          rebateDiscount: 0,
          extraCharges: 0,
          totalAmount: studentFee,
          paidAmount: 0,
          status: finalDueDate < new Date() ? 'OVERDUE' : 'PENDING',
          dueDate: finalDueDate,
          notes: `Hostel mess subscription billing for ${monthStr}`,
          assignedBy: req.user._id,
        });

        // Increment student balance
        student.balanceDue = (student.balanceDue || 0) + studentFee;
        await student.save();

        createdCount++;
      } else {
        skippedCount++;
      }
    }

    // In-app alert to students
    await Notification.create({
      targetRole: 'student',
      title: `Hostel Mess Bill Issued for ${monthStr}`,
      message: `Your monthly mess fee invoice of ${monthStr} has been published. Due date: ${finalDueDate.toLocaleDateString('en-GB')}.`,
      type: 'fee',
      priority: 'high',
      link: '/fees',
    });

    // Admin Monthly Fee Collection Summary Notification
    await Notification.create({
      recipient: null,
      targetRole: 'admin',
      title: `Monthly Fee Collection Summary: ${monthStr}`,
      message: `Monthly bills generated for ${createdCount} hostellers for ${monthStr}. Total mess fees billing: ₹${(createdCount * defaultFee).toLocaleString('en-IN')}. Due date set to ${finalDueDate.toLocaleDateString('en-GB')}.`,
      type: 'fee',
      priority: 'normal',
      link: '/admin-fees',
    });

    // Audit Log Entry
    await recordAuditLog({
      action: 'GENERATE_MONTHLY_INVOICES',
      req,
      targetType: 'FeeInvoice',
      summary: `Generated ${createdCount} monthly mess fee invoices for ${monthStr} (Default Fee: ₹${defaultFee})`,
      details: { month: monthStr, createdCount, defaultFee, dueDate: finalDueDate },
    });

    res.json({
      success: true,
      message: `Generated ${createdCount} invoices for ${monthStr} (${skippedCount} already existed)`,
      createdCount,
      skippedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create custom fee record or assign different amount to individual student (Admin)
// @route   POST /api/fees/individual-invoice
// @access  Private (Admin)
const createIndividualInvoice = async (req, res) => {
  try {
    const {
      studentId,
      month,
      year,
      amount,
      dueDate,
      reason = 'Custom student fee allocation',
      notes = '',
    } = req.body;

    if (!studentId || !month || !year || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, month, year, fee amount, and due date',
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const monthStr = `${month} ${year}`;
    const feeAmount = Number(amount);
    const parsedDueDate = new Date(dueDate);

    // Check if an invoice already exists for this month
    const existing = await FeeInvoice.findOne({ student: student._id, month: monthStr });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An invoice for ${student.name} for ${monthStr} already exists. Please edit the existing invoice.`,
      });
    }

    const newInvoice = await FeeInvoice.create({
      student: student._id,
      month: monthStr,
      year: Number(year),
      baseAmount: feeAmount,
      rebateDiscount: 0,
      extraCharges: 0,
      totalAmount: feeAmount,
      paidAmount: 0,
      status: parsedDueDate < new Date() ? 'OVERDUE' : 'PENDING',
      dueDate: parsedDueDate,
      notes: notes || reason,
      customAmountReason: reason,
      assignedBy: req.user._id,
    });

    // Update student balance
    student.balanceDue = (student.balanceDue || 0) + feeAmount;
    await student.save();

    // Notify student
    await Notification.create({
      recipient: student._id,
      targetRole: 'student',
      title: `Individual Mess Bill: ${monthStr}`,
      message: `A custom mess invoice of ₹${feeAmount.toLocaleString('en-IN')} has been assigned to your account. Due: ${parsedDueDate.toLocaleDateString('en-GB')}.`,
      type: 'fee',
      priority: 'high',
      link: '/fees',
    });

    // Audit Log Entry
    await recordAuditLog({
      action: 'CREATE_INDIVIDUAL_INVOICE',
      req,
      targetType: 'FeeInvoice',
      targetId: newInvoice._id,
      summary: `Assigned custom invoice of ₹${feeAmount} for ${student.name} (${monthStr})`,
      details: { studentId: student._id, studentName: student.name, amount: feeAmount, month: monthStr, reason },
    });

    res.json({
      success: true,
      message: `Custom invoice of ₹${feeAmount} created for ${student.name}`,
      data: newInvoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit existing invoice amount / due date (Admin)
// @route   PUT /api/fees/update-invoice/:id
// @access  Private (Admin)
const updateInvoiceAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalAmount, rebateDiscount = 0, dueDate, notes, customAmountReason } = req.body;

    const invoice = await FeeInvoice.findById(id).populate('student');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const oldTotal = invoice.totalAmount;
    const newTotal = Number(totalAmount);

    if (newTotal < invoice.paidAmount) {
      return res.status(400).json({
        success: false,
        message: `Total amount cannot be less than already paid amount (₹${invoice.paidAmount})`,
      });
    }

    const delta = newTotal - oldTotal;

    invoice.baseAmount = newTotal;
    invoice.totalAmount = newTotal;
    invoice.rebateDiscount = Number(rebateDiscount) || 0;
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (notes) invoice.notes = notes;
    if (customAmountReason) invoice.customAmountReason = customAmountReason;
    invoice.assignedBy = req.user._id;

    refreshInvoiceStatus(invoice);
    await invoice.save();

    // Adjust student's overall balance
    if (invoice.student && delta !== 0) {
      const student = await User.findById(invoice.student._id);
      if (student) {
        student.balanceDue = Math.max(0, (student.balanceDue || 0) + delta);
        await student.save();
      }
    }

    // Audit Log Entry
    await recordAuditLog({
      action: 'UPDATE_INVOICE_AMOUNT',
      req,
      targetType: 'FeeInvoice',
      targetId: invoice._id,
      summary: `Updated invoice amount from ₹${oldTotal} to ₹${newTotal} for ${invoice.student?.name || 'Student'}`,
      details: { invoiceId: invoice._id, oldTotal, newTotal, delta, customAmountReason },
    });

    res.json({
      success: true,
      message: 'Invoice amount and due date updated successfully',
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initiate Razorpay order (Student) - Supports Custom Partial or Full Amount
// @route   POST /api/fees/create-order
// @access  Private (Student)
const createPaymentOrder = async (req, res) => {
  try {
    const { invoiceId, customAmount } = req.body;
    const invoice = await FeeInvoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    refreshInvoiceStatus(invoice);

    if (invoice.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'This invoice is already fully paid' });
    }

    const remainingBalance = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));

    // Determine payable amount
    let payableAmount = remainingBalance;
    if (customAmount !== undefined && customAmount !== null && customAmount !== '') {
      const parsedCustom = Number(customAmount);
      if (isNaN(parsedCustom) || parsedCustom <= 0) {
        return res.status(400).json({ success: false, message: 'Please enter a valid positive payment amount' });
      }
      if (parsedCustom > remainingBalance) {
        return res.status(400).json({
          success: false,
          message: `Amount cannot exceed the remaining balance of ₹${remainingBalance}`,
        });
      }
      payableAmount = parsedCustom;
    }

    const receiptId = `ORD-${Date.now()}`;

    const orderData = await createRazorpayOrder(payableAmount, receiptId, {
      invoiceId: invoice._id.toString(),
      studentId: req.user._id.toString(),
      month: invoice.month,
      isPartial: (payableAmount < remainingBalance).toString(),
    });

    res.json({
      success: true,
      data: {
        orderId: orderData.orderId,
        amount: orderData.amount, // in paise
        amountInINR: payableAmount,
        remainingBalance,
        isPartial: payableAmount < remainingBalance,
        currency: orderData.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_SmartMess2026Key',
        invoice: {
          id: invoice._id,
          month: invoice.month,
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          remainingBalance,
        },
        student: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          studentId: req.user.studentId,
          roomNumber: req.user.roomNumber,
        },
        isSimulated: orderData.isSimulated,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay payment signature and settle invoice with anti-duplicate guard
// @route   POST /api/fees/verify-payment
// @access  Private (Student)
const verifyPaymentAndSettle = async (req, res) => {
  try {
    const {
      invoiceId,
      amount,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!invoiceId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment verification parameters',
      });
    }

    // Anti-duplicate payment guard: Check if this payment ID was already processed
    const duplicatePayment = await Payment.findOne({ razorpayPaymentId });
    if (duplicatePayment) {
      return res.status(409).json({
        success: false,
        message: 'This payment transaction has already been verified and processed.',
        data: duplicatePayment,
      });
    }

    const invoice = await FeeInvoice.findById(invoiceId).populate('student');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Cryptographic signature verification
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      await Notification.create({
        recipient: req.user._id,
        targetRole: 'student',
        title: 'Mess Fee Payment Failed',
        message: `Your payment of ₹${amount || ''} could not be cryptographically verified. Please retry or contact the mess desk.`,
        type: 'payment',
        priority: 'urgent',
        link: '/fees',
      });
      emailService.sendPaymentFailedEmail(req.user, invoice, amount, 'Invalid signature / untrusted payment attempt');

      return res.status(400).json({
        success: false,
        message: 'Cryptographic signature verification failed. Untrusted payment attempt.',
      });
    }

    const remainingBefore = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));
    const settleAmount = Number(amount) || remainingBefore;
    const isPartial = (invoice.paidAmount + settleAmount) < invoice.totalAmount;
    const remainingAfter = Math.max(0, invoice.totalAmount - (invoice.paidAmount + settleAmount));

    const receiptNumber = `SM-REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Create persistent Payment transaction record
    const paymentRecord = await Payment.create({
      student: req.user._id,
      invoice: invoice._id,
      amount: settleAmount,
      currency: 'INR',
      paymentMethod: 'Razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentReference: razorpayPaymentId,
      status: 'PAID',
      receiptNumber,
      isPartial,
      remainingBalance: remainingAfter,
      paidAt: new Date(),
    });

    // Update invoice record
    invoice.paidAmount = (invoice.paidAmount || 0) + settleAmount;
    refreshInvoiceStatus(invoice);
    invoice.paidAt = new Date();
    invoice.paymentMethod = 'Razorpay';
    invoice.transactionId = razorpayPaymentId;
    invoice.receiptNumber = receiptNumber;
    await invoice.save();

    // Settle student balance
    const student = await User.findById(req.user._id);
    if (student) {
      student.balanceDue = Math.max(0, (student.balanceDue || 0) - settleAmount);
      await student.save();
    }

    // 1. In-app notification for Successful Payment
    await Notification.create({
      recipient: req.user._id,
      targetRole: 'student',
      title: isPartial ? 'Partial Mess Fee Payment Confirmed' : 'Successful Mess Fee Payment!',
      message: isPartial
        ? `Paid ₹${settleAmount.toLocaleString('en-IN')} for ${invoice.month}. Remaining balance: ₹${remainingAfter.toLocaleString('en-IN')}. Receipt #${receiptNumber}`
        : `Your payment of ₹${settleAmount.toLocaleString('en-IN')} for ${invoice.month} was verified. Receipt #${receiptNumber}`,
      type: 'payment',
      priority: 'high',
      link: '/fees',
    });

    // 2. In-app notification for Payment Receipt Generated
    await Notification.create({
      recipient: req.user._id,
      targetRole: 'student',
      title: 'Payment Receipt Generated',
      message: `Official PDF receipt #${receiptNumber} for ₹${settleAmount.toLocaleString('en-IN')} is ready for download.`,
      type: 'payment',
      priority: 'normal',
      link: '/fees',
    });

    // 3. Admin Notification for Fee Collection
    await Notification.create({
      recipient: null,
      targetRole: 'admin',
      title: 'Successful Student Payment Received',
      message: `₹${settleAmount.toLocaleString('en-IN')} received from ${student?.name || req.user.name} (Room ${student?.roomNumber || 'Hostel'}) via Razorpay. Txn #${razorpayPaymentId}.`,
      type: 'payment',
      priority: 'high',
      link: '/admin-fees',
    });

    // 4. Trigger live / simulated email notifications
    emailService.sendPaymentSuccessEmail(student || req.user, paymentRecord, invoice);
    emailService.sendAdminPaymentAlert('bhaiya@smartmess.in', student || req.user, paymentRecord);

    res.json({
      success: true,
      message: isPartial
        ? `Partial payment of ₹${settleAmount} recorded. Remaining: ₹${remainingAfter}`
        : 'Payment verified and official receipt generated successfully!',
      data: {
        receiptNumber,
        amountPaid: settleAmount,
        remainingBalance: remainingAfter,
        status: invoice.status,
        invoice,
        payment: paymentRecord,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record verified offline cash or UPI payment with audit trail (Admin)
// @route   POST /api/fees/record-cash
// @access  Private (Admin / Staff)
const recordOfflinePayment = async (req, res) => {
  try {
    const {
      invoiceId,
      amountPaid,
      paymentMethod = 'Cash',
      transactionReference = '',
      notes = '',
    } = req.body;

    if (!invoiceId || !amountPaid) {
      return res.status(400).json({ success: false, message: 'Please provide invoiceId and amount paid' });
    }

    const invoice = await FeeInvoice.findById(invoiceId).populate('student');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const payAmount = Number(amountPaid);
    if (payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount paid must be greater than zero' });
    }

    const remainingBefore = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));
    if (payAmount > remainingBefore) {
      return res.status(400).json({
        success: false,
        message: `Amount cannot exceed remaining balance of ₹${remainingBefore}`,
      });
    }

    const isPartial = (invoice.paidAmount + payAmount) < invoice.totalAmount;
    const remainingAfter = Math.max(0, invoice.totalAmount - (invoice.paidAmount + payAmount));

    const receiptNumber = `SM-OFF-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const txRef = transactionReference.trim() || `OFFLINE-${Date.now()}`;

    // Create audited Payment record
    const payment = await Payment.create({
      student: invoice.student._id,
      invoice: invoice._id,
      amount: payAmount,
      currency: 'INR',
      paymentMethod,
      paymentReference: txRef,
      status: 'PAID',
      receiptNumber,
      isPartial,
      remainingBalance: remainingAfter,
      verifiedBy: req.user._id,
      verifiedByName: req.user.name,
      verifiedAt: new Date(),
      notes: notes || `Verified by ${req.user.name} at Mess Office`,
      paidAt: new Date(),
    });

    // Update invoice
    invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
    refreshInvoiceStatus(invoice);
    invoice.paidAt = new Date();
    invoice.paymentMethod = paymentMethod;
    invoice.transactionId = txRef;
    invoice.receiptNumber = receiptNumber;
    await invoice.save();

    // Update student balance
    if (invoice.student) {
      const student = await User.findById(invoice.student._id);
      if (student) {
        student.balanceDue = Math.max(0, (student.balanceDue || 0) - payAmount);
        await student.save();
      }
    }

    // In-app notification to student
    await Notification.create({
      recipient: invoice.student._id,
      targetRole: 'student',
      title: `Offline Mess Payment Verified (${paymentMethod})`,
      message: `Received ₹${payAmount.toLocaleString('en-IN')} for ${invoice.month} verified by ${req.user.name}. Ref: ${txRef}. Receipt #${receiptNumber}`,
      type: 'payment',
      priority: 'high',
      link: '/fees',
    });

    // Receipt notification
    await Notification.create({
      recipient: invoice.student._id,
      targetRole: 'student',
      title: 'Payment Receipt Generated',
      message: `Official receipt #${receiptNumber} for ₹${payAmount.toLocaleString('en-IN')} (${paymentMethod}) is ready.`,
      type: 'payment',
      priority: 'normal',
      link: '/fees',
    });

    // Email receipt
    emailService.sendPaymentSuccessEmail(invoice.student, payment, invoice);

    // Audit Log Entry
    await recordAuditLog({
      action: 'RECORD_OFFLINE_PAYMENT',
      req,
      targetType: 'Payment',
      targetId: payment._id,
      summary: `Verified offline ${paymentMethod} payment of ₹${payAmount} for ${invoice.student?.name || 'Student'} (${invoice.month})`,
      details: { invoiceId: invoice._id, amount: payAmount, paymentMethod, transactionReference: txRef, receiptNumber },
    });

    res.json({
      success: true,
      message: `Offline ${paymentMethod} payment of ₹${payAmount} verified by ${req.user.name}`,
      data: {
        invoice,
        payment,
        receiptNumber,
        remainingBalance: remainingAfter,
        status: invoice.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    View individual student payment history (Admin or Student)
// @route   GET /api/fees/history/:studentId?
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    let targetStudentId = req.user._id;

    // If admin is requesting history for a specific student
    if (req.params.studentId && ['admin', 'staff'].includes(req.user.role)) {
      targetStudentId = req.params.studentId;
    }

    const student = await User.findById(targetStudentId).select(
      'name studentId email hostelBlock roomNumber phone balanceDue'
    );

    const payments = await Payment.find({ student: targetStudentId })
      .populate('invoice', 'month totalAmount paidAmount dueDate status')
      .populate('verifiedBy', 'name email role')
      .sort({ paidAt: -1 });

    res.json({
      success: true,
      student,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate monthly collection report (Admin)
// @route   GET /api/fees/reports/monthly
// @access  Private (Admin)
const getMonthlyCollectionReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};
    if (month && month !== 'All') {
      query.month = year ? `${month} ${year}` : month;
    }

    const invoices = await FeeInvoice.find(query)
      .populate('student', 'name studentId hostelBlock roomNumber phone balanceDue')
      .sort({ roomNumber: 1 });

    const invoiceIds = invoices.map((i) => i._id);
    const payments = await Payment.find({ invoice: { $in: invoiceIds } })
      .populate('verifiedBy', 'name role')
      .sort({ paidAt: -1 });

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

    const statusCounts = {
      PAID: 0,
      'PARTIALLY PAID': 0,
      PENDING: 0,
      OVERDUE: 0,
    };

    const methodBreakdown = {
      Razorpay: 0,
      Cash: 0,
      UPI: 0,
      'Bank Transfer': 0,
    };

    for (const inv of invoices) {
      refreshInvoiceStatus(inv);
      totalBilled += inv.totalAmount || 0;
      totalCollected += inv.paidAmount || 0;
      totalOutstanding += Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));

      if (statusCounts[inv.status] !== undefined) {
        statusCounts[inv.status]++;
      }
    }

    for (const p of payments) {
      const mode = p.paymentMethod || 'Razorpay';
      if (methodBreakdown[mode] !== undefined) {
        methodBreakdown[mode] += p.amount || 0;
      } else {
        methodBreakdown[mode] = (methodBreakdown[mode] || 0) + (p.amount || 0);
      }
    }

    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    res.json({
      success: true,
      reportMonth: query.month || 'All Months',
      generatedAt: new Date(),
      generatedBy: req.user.name,
      summary: {
        totalStudents: invoices.length,
        totalBilled,
        totalCollected,
        totalOutstanding,
        collectionRate,
        statusCounts,
        methodBreakdown,
      },
      invoices,
      payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed receipt by receiptNumber
// @route   GET /api/fees/receipt/:receiptNumber
// @access  Private
const getReceiptDetails = async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    // Search in Payment records first for exact transaction details
    let payment = await Payment.findOne({ receiptNumber })
      .populate({
        path: 'invoice',
        populate: { path: 'student', select: 'name email studentId hostelBlock roomNumber bedNumber phone dietPreference' },
      })
      .populate('student', 'name email studentId hostelBlock roomNumber bedNumber phone dietPreference')
      .populate('verifiedBy', 'name role');

    if (payment) {
      return res.json({
        success: true,
        type: 'payment_receipt',
        data: {
          receiptNumber: payment.receiptNumber,
          transactionId: payment.paymentReference || payment.razorpayPaymentId || `TX-${payment._id}`,
          amountPaid: payment.amount,
          month: payment.invoice?.month || 'Current Month',
          paymentDate: payment.paidAt,
          paymentMethod: payment.paymentMethod,
          paymentStatus: payment.status || 'PAID',
          isPartial: payment.isPartial,
          remainingBalance: payment.remainingBalance,
          verifiedByName: payment.verifiedByName || payment.verifiedBy?.name,
          verifiedAt: payment.verifiedAt,
          notes: payment.notes,
          student: payment.student || payment.invoice?.student,
          invoice: payment.invoice,
        },
      });
    }

    // Fallback: Check FeeInvoice
    const invoice = await FeeInvoice.findOne({ receiptNumber }).populate(
      'student',
      'name email studentId hostelBlock roomNumber bedNumber phone dietPreference'
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Receipt record not found' });
    }

    res.json({
      success: true,
      type: 'invoice_receipt',
      data: {
        receiptNumber: invoice.receiptNumber,
        transactionId: invoice.transactionId || `INV-${invoice._id}`,
        amountPaid: invoice.paidAmount,
        month: invoice.month,
        paymentDate: invoice.paidAt || invoice.updatedAt,
        paymentMethod: invoice.paymentMethod,
        paymentStatus: invoice.status,
        isPartial: invoice.paidAmount < invoice.totalAmount,
        remainingBalance: Math.max(0, invoice.totalAmount - invoice.paidAmount),
        student: invoice.student,
        invoice,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record failed or cancelled Razorpay payment attempt
// @route   POST /api/fees/payment-failed
// @access  Private (Student)
const recordPaymentFailure = async (req, res) => {
  try {
    const {
      invoiceId,
      amount,
      razorpayOrderId,
      errorCode = 'PAYMENT_FAILED',
      errorDescription = 'Transaction cancelled or declined by user/bank',
    } = req.body;

    const invoice = await FeeInvoice.findById(invoiceId);
    const failAmount = Number(amount) || (invoice ? invoice.totalAmount - invoice.paidAmount : 0);

    const failRecord = await Payment.create({
      student: req.user._id,
      invoice: invoiceId,
      amount: failAmount,
      currency: 'INR',
      paymentMethod: 'Razorpay',
      razorpayOrderId: razorpayOrderId || `fail_${Date.now()}`,
      paymentReference: errorCode,
      status: 'FAILED',
      receiptNumber: `FAIL-${Date.now().toString().slice(-6)}`,
      notes: errorDescription,
      paidAt: new Date(),
    });

    await Notification.create({
      recipient: req.user._id,
      targetRole: 'student',
      title: 'Mess Payment Failed / Cancelled',
      message: `Your payment attempt of ₹${failAmount.toLocaleString('en-IN')} could not be completed: ${errorDescription}`,
      type: 'fee',
      priority: 'high',
      link: '/fees',
    });

    res.json({
      success: true,
      message: 'Payment failure logged safely',
      data: failRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Handle Razorpay Webhook Events
// @route   POST /api/fees/webhook
// @access  Public (Signature Verified)
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Razorpay Webhook Warning]: Invalid webhook signature received');
      return res.status(400).json({ status: 'error', message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      if (paymentEntity) {
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;
        const amountInINR = paymentEntity.amount / 100;
        const invoiceId = paymentEntity.notes?.invoiceId;

        if (invoiceId) {
          // Idempotency check: don't double count if verifyPaymentAndSettle already settled it!
          const existingPayment = await Payment.findOne({ razorpayPaymentId: paymentId });
          if (existingPayment) {
            return res.status(200).json({ status: 'ok', message: 'Payment already processed' });
          }

          const invoice = await FeeInvoice.findById(invoiceId).populate('student');
          if (invoice) {
            const receiptNumber = `SM-REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
            const remainingAfter = Math.max(0, invoice.totalAmount - (invoice.paidAmount + amountInINR));
            const isPartial = remainingAfter > 0;

            await Payment.create({
              student: invoice.student?._id,
              invoice: invoice._id,
              amount: amountInINR,
              currency: 'INR',
              paymentMethod: 'Razorpay',
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              razorpaySignature: 'webhook_verified',
              paymentReference: paymentId,
              status: 'PAID',
              receiptNumber,
              isPartial,
              remainingBalance: remainingAfter,
              paidAt: new Date(),
            });

            invoice.paidAmount += amountInINR;
            refreshInvoiceStatus(invoice);
            invoice.paidAt = new Date();
            invoice.paymentMethod = 'Razorpay';
            invoice.transactionId = paymentId;
            invoice.receiptNumber = receiptNumber;
            await invoice.save();

            if (invoice.student) {
              const student = await User.findById(invoice.student._id);
              if (student) {
                student.balanceDue = Math.max(0, (student.balanceDue || 0) - amountInINR);
                await student.save();
              }
            }
          }
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      if (paymentEntity) {
        const invoiceId = paymentEntity.notes?.invoiceId;
        const failAmount = paymentEntity.amount / 100;

        await Payment.create({
          invoice: invoiceId,
          amount: failAmount,
          currency: 'INR',
          paymentMethod: 'Razorpay',
          razorpayOrderId: paymentEntity.order_id || 'failed_order',
          razorpayPaymentId: paymentEntity.id,
          status: 'FAILED',
          receiptNumber: `FAIL-${Date.now().toString().slice(-6)}`,
          notes: paymentEntity.error_description || 'Payment failed via webhook',
          paidAt: new Date(),
        });
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getMyInvoices,
  getAllInvoices,
  generateMonthlyInvoices,
  createIndividualInvoice,
  updateInvoiceAmount,
  createPaymentOrder,
  verifyPaymentAndSettle,
  recordPaymentFailure,
  handleRazorpayWebhook,
  recordOfflinePayment,
  getPaymentHistory,
  getMonthlyCollectionReport,
  getReceiptDetails,
};
