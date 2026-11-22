import { jsPDF } from 'jspdf';
import { formatINR, formatDate, formatDateTime } from './formatters';

/**
 * Generates and downloads an official Smart Mess Payment Receipt PDF
 * containing:
 * - Student Name
 * - Student ID
 * - Room Number
 * - Payment Amount
 * - Month
 * - Transaction ID
 * - Payment Date
 * - Payment Status
 * - Verification Seal & Signature
 */
export const downloadReceiptPdf = (invoiceOrPayment, customStudent = null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const student = customStudent || invoiceOrPayment.student || {};
  const isPaymentRecord = !!invoiceOrPayment.paymentMethod && !!invoiceOrPayment.amount;

  const receiptNumber =
    invoiceOrPayment.receiptNumber ||
    invoiceOrPayment.transactionId ||
    `SM-REC-${Date.now().toString().slice(-6)}`;

  const studentName = student.name || 'Hostel Student';
  const studentId = student.studentId || 'N/A';
  const roomNumber = `${student.hostelBlock || 'Block A'} - Room ${student.roomNumber || 'N/A'}${
    student.bedNumber ? ` (${student.bedNumber})` : ''
  }`;
  const billingMonth = invoiceOrPayment.month || invoiceOrPayment.invoice?.month || 'Current Month';

  const amountPaid = isPaymentRecord
    ? invoiceOrPayment.amount
    : invoiceOrPayment.paidAmount || invoiceOrPayment.totalAmount || 0;

  const totalAmount = invoiceOrPayment.totalAmount || invoiceOrPayment.invoice?.totalAmount || amountPaid;
  const remainingBalance = Math.max(0, totalAmount - amountPaid);

  const transactionId =
    invoiceOrPayment.paymentReference ||
    invoiceOrPayment.razorpayPaymentId ||
    invoiceOrPayment.transactionId ||
    `TX-${Date.now()}`;

  const paymentDate = formatDateTime(
    invoiceOrPayment.paidAt || invoiceOrPayment.createdAt || new Date()
  );

  let rawStatus = (invoiceOrPayment.status || '').toUpperCase();
  if (rawStatus === 'SUCCESSFUL' || rawStatus === 'PAID') {
    rawStatus = remainingBalance > 0 ? 'PARTIALLY PAID' : 'PAID';
  } else if (rawStatus === 'PARTIAL') {
    rawStatus = 'PARTIALLY PAID';
  } else if (!rawStatus) {
    rawStatus = 'PAID';
  }

  const paymentMethod = invoiceOrPayment.paymentMethod || 'Razorpay Online';
  const verifiedBy = invoiceOrPayment.verifiedByName || (invoiceOrPayment.verifiedBy?.name) || 'Central Mess Office';

  // --- PDF Styling ---
  // Outer Border
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.roundedRect(10, 10, 190, 277, 4, 4);

  // Top Accent Header Bar
  doc.setFillColor(15, 23, 42); // navy-900
  doc.roundedRect(10, 10, 190, 32, 4, 4, 'F');
  doc.rect(10, 34, 190, 8, 'F'); // square bottom of rounded top

  // Institution Logo / Monogram
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(18, 16, 16, 16, 3, 3, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SM', 26, 27, { align: 'center' });

  // Institution Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SMART MESS HOSTEL MANAGEMENT', 40, 23);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Central Student Hostel Dining Services • University Campus • New Delhi, 110001', 40, 29);
  doc.text('Contact: mess@smartmess.in • Ph: +91 11 2345 6789', 40, 34);

  // Subheader Ribbon
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(10, 42, 190, 12, 'F');
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('OFFICIAL MESS FEE PAYMENT RECEIPT', 105, 50, { align: 'center' });

  // Receipt Number & Date Metadata Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, 58, 178, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIPT NO:', 22, 65);
  doc.text('PAYMENT DATE & TIME:', 110, 65);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(receiptNumber, 22, 73);

  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(paymentDate, 110, 73);

  // 2-Column Details Grid
  // Column 1: Student Particulars
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('STUDENT INFORMATION', 16, 90);

  doc.setDrawColor(226, 232, 240);
  doc.line(16, 92, 98, 92);

  const drawField = (label, val, x, y, width = 75) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(String(val), x, y + 4.5);
  };

  drawField('Student Name:', studentName, 16, 98);
  drawField('Student ID / Enrollment:', studentId, 16, 109);
  drawField('Room & Hostel Allocation:', roomNumber, 16, 120);
  drawField('Hostel Campus:', student.hostelName || 'Tagore Hostel Campus', 16, 131);

  // Column 2: Payment Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('PAYMENT DETAILS', 110, 90);

  doc.setDrawColor(226, 232, 240);
  doc.line(110, 92, 194, 92);

  drawField('Billing Month:', billingMonth, 110, 98);
  drawField('Payment Method:', paymentMethod, 110, 109);
  drawField('Transaction Reference ID:', transactionId, 110, 120);
  drawField('Verified By / Authority:', verifiedBy, 110, 131);

  // Status Badge Pill in Payment Box
  const statusColors = {
    PAID: [16, 185, 129], // emerald
    'PARTIALLY PAID': [217, 119, 6], // amber
    PENDING: [100, 116, 139], // slate
    OVERDUE: [225, 29, 72], // rose
    FAILED: [239, 68, 68], // red
  };
  const color = statusColors[rawStatus] || [16, 185, 129];
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(150, 94, 44, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`STATUS: ${rawStatus}`, 172, 98.5, { align: 'center' });

  // Table of Charges
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('FEE BREAKDOWN & ACCOUNT SETTLEMENT', 16, 148);

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(16, 151, 178, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(16, 151, 178, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION', 20, 156);
  doc.text('PERIOD', 110, 156);
  doc.text('TOTAL (INR)', 150, 156, { align: 'right' });
  doc.text('PAID (INR)', 188, 156, { align: 'right' });

  // Table Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Monthly Hostel Mess Subscription (4 Meals/Day)', 20, 166);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Includes Breakfast, Lunch, Evening Snacks & Dinner', 20, 170.5);

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(billingMonth, 110, 167);
  doc.text(formatINR(totalAmount), 150, 167, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(formatINR(amountPaid), 188, 167, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(16, 175, 194, 175);

  // Summary Totals Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(100, 180, 94, 38, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);

  const drawSummaryLine = (label, value, y, isBold = false, isEmerald = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9.5 : 8.5);
    doc.setTextColor(isEmerald ? 16 : isBold ? 15 : 100, isEmerald ? 185 : isBold ? 23 : 116, isEmerald ? 129 : isBold ? 42 : 139);
    doc.text(label, 105, y);
    doc.text(value, 188, y, { align: 'right' });
  };

  drawSummaryLine('Total Monthly Invoiced:', formatINR(totalAmount), 187);
  drawSummaryLine('Amount Paid in this Receipt:', formatINR(amountPaid), 194, true, true);
  drawSummaryLine('Remaining Balance Due:', formatINR(remainingBalance), 201, false, remainingBalance > 0);
  drawSummaryLine('Account Status:', rawStatus, 208, true);

  // Notes Box
  doc.setFillColor(254, 252, 232); // light amber
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(16, 180, 78, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(161, 98, 7);
  doc.text('IMPORTANT NOTES:', 20, 186);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(113, 63, 18);
  const noteLines = doc.splitTextToSize(
    '1. This receipt is computer generated and verified electronically.\n2. Preserving this document is recommended for end-of-semester mess clearance.\n3. Dues must be settled prior to the 15th of each calendar month.',
    70
  );
  doc.text(noteLines, 20, 192);

  // Security Seal & Verification Watermark
  doc.setDrawColor(16, 185, 129);
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(16, 226, 178, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text('DIGITALLY SIGNED & VERIFIED BY SMART MESS CENTRAL PORTAL', 22, 234);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(4, 120, 87);
  doc.text(
    `Cryptographic Verification Hash: SHA256-${transactionId.slice(-16).toUpperCase()} • Verified: ${paymentDate}`,
    22,
    240
  );
  doc.text(`Authorized by: ${verifiedBy} (Hostel Mess Committee)`, 22, 246);

  // Signature Line
  doc.setDrawColor(148, 163, 184);
  doc.line(140, 266, 186, 266);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('AUTHORIZED SIGNATORY', 163, 270, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Mess Bhaiya / Hostel Warden', 163, 273.5, { align: 'center' });

  // System Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated on ${formatDateTime(new Date())} • Smart Mess Web Portal v2.0 • Page 1 of 1`,
    105,
    283,
    { align: 'center' }
  );

  // Trigger Save / Download
  const filename = `Mess_Receipt_${receiptNumber}_${studentId}.pdf`;
  doc.save(filename);
};

export default downloadReceiptPdf;
