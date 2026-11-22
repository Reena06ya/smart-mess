const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Webhook endpoint (Public, signature-verified by Razorpay HMAC header)
router.post('/webhook', handleRazorpayWebhook);

// Student fee endpoints
router.get('/my-invoices', protect, getMyInvoices);
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifyPaymentAndSettle);
router.post('/payment-failed', protect, recordPaymentFailure);
router.get('/history', protect, getPaymentHistory);
router.get('/history/:studentId', protect, getPaymentHistory);
router.get('/receipt/:receiptNumber', protect, getReceiptDetails);

// Admin fee management & reconciliation endpoints
router.get('/all', protect, authorizeRoles('admin', 'staff'), getAllInvoices);
router.post('/generate-monthly', protect, authorizeRoles('admin', 'staff'), generateMonthlyInvoices);
router.post('/individual-invoice', protect, authorizeRoles('admin', 'staff'), createIndividualInvoice);
router.put('/update-invoice/:id', protect, authorizeRoles('admin', 'staff'), updateInvoiceAmount);
router.post('/record-cash', protect, authorizeRoles('admin', 'staff'), recordOfflinePayment);
router.get('/reports/monthly', protect, authorizeRoles('admin', 'staff'), getMonthlyCollectionReport);

module.exports = router;
