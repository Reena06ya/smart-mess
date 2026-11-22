/**
 * Smart Mess - Email Notification Service
 * Prepared for production integration with SMTP / Nodemailer / SendGrid / SES
 *
 * When SMTP credentials are provided in .env, it sends live emails.
 * Otherwise, it runs in simulated mode, safely logging structured email payloads without failing.
 */

const fs = require('fs');
const path = require('path');

// Optional dynamic import of nodemailer
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  // Nodemailer not installed; simulated mode active
}

const isConfigured = () => {
  return (
    nodemailer &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const getTransporter = () => {
  if (!isConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Base Send Email Function
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const fromAddress = process.env.EMAIL_FROM || '"Smart Mess Hostel Portal" <notifications@smartmess.in>';

    if (isConfigured()) {
      const transporter = getTransporter();
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: text || html.replace(/<[^>]*>?/gm, ''),
        html,
      });
      console.log(`[Email Sent]: Message ID ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId, to, subject };
    }

    // Simulated Mode: Logs structured email for verification and testing
    console.log('\n======================================================');
    console.log('✉️  [SIMULATED EMAIL NOTIFICATION - READY FOR SMTP]');
    console.log(`To: ${to}`);
    console.log(`From: ${fromAddress}`);
    console.log(`Subject: ${subject}`);
    console.log('------------------------------------------------------');
    console.log(text || html.replace(/<[^>]*>?/gm, '').substring(0, 300) + '...');
    console.log('======================================================\n');

    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to,
      subject,
    };
  } catch (error) {
    console.error(`[Email Service Error]: Failed to send to ${to}`, error.message);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------------
// HTML Email Templates
// -------------------------------------------------------------

const wrapHtmlTemplate = (title, contentHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .content { padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .badge-success { background-color: #d1fae5; color: #065f46; }
    .badge-warning { background-color: #fef3c7; color: #92400e; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; }
    .badge-info { background-color: #e0f2fe; color: #075985; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .btn { display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 10px 24px; border-radius: 10px; margin-top: 16px; }
    .footer { padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>Smart Mess – Hostel Management Portal</p>
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>This is an automated notification from Smart Mess Portal. For assistance, contact your Mess Bhaiya or Warden office.</p>
      <p>© ${new Date().getFullYear()} Smart Mess Portal. Indian Standard Time (IST).</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * 1. Monthly Mess Fee Generated
 */
const sendFeeGeneratedEmail = async (student, invoice) => {
  const title = `Mess Fee Invoice Generated for ${invoice.month}`;
  const html = wrapHtmlTemplate(
    title,
    `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>Your monthly hostel mess bill for <strong>${invoice.month}</strong> has been generated.</p>
    <div class="card">
      <p><strong>Student ID:</strong> ${student.studentId || 'N/A'}</p>
      <p><strong>Room Number:</strong> ${student.roomNumber || 'N/A'} (${student.hostelBlock || 'Hostel'})</p>
      <p><strong>Total Mess Fee:</strong> ₹${(invoice.totalAmount || 0).toLocaleString('en-IN')}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</p>
      <p><strong>Status:</strong> <span class="badge badge-warning">${invoice.status}</span></p>
    </div>
    <p>Please pay your mess fees before the due date to avoid service disruption.</p>
    <a href="http://localhost:3000" class="btn">Pay Online via Razorpay</a>
  `
  );

  return sendEmail({
    to: student.email,
    subject: `[Smart Mess] Monthly Fee Generated: ₹${invoice.totalAmount} for ${invoice.month}`,
    html,
  });
};

/**
 * 2. Upcoming Payment Due Date Reminder
 */
const sendDueDateReminderEmail = async (student, invoice, daysRemaining = 3) => {
  const title = `Reminder: Mess Fee Payment Due in ${daysRemaining} Days`;
  const html = wrapHtmlTemplate(
    title,
    `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>This is a gentle reminder that your mess fees for <strong>${invoice.month}</strong> are due soon.</p>
    <div class="card">
      <p><strong>Pending Amount:</strong> ₹${(Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0))).toLocaleString('en-IN')}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</p>
      <p><strong>Days Remaining:</strong> <span class="badge badge-warning">${daysRemaining} Days Left</span></p>
    </div>
    <p>UPI, Debit/Credit Cards, and Net Banking are supported.</p>
    <a href="http://localhost:3000" class="btn">Complete Payment</a>
  `
  );

  return sendEmail({
    to: student.email,
    subject: `[Smart Mess Reminder] Due in ${daysRemaining} Days: Mess Fee ₹${invoice.totalAmount}`,
    html,
  });
};

/**
 * 3. Payment Overdue Notice
 */
const sendPaymentOverdueEmail = async (student, invoice) => {
  const title = `Overdue Notice: Mess Fees for ${invoice.month}`;
  const html = wrapHtmlTemplate(
    title,
    `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>Your hostel mess payment for <strong>${invoice.month}</strong> is now <span class="badge badge-danger">OVERDUE</span>.</p>
    <div class="card">
      <p><strong>Outstanding Balance:</strong> ₹${(Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0))).toLocaleString('en-IN')}</p>
      <p><strong>Original Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</p>
    </div>
    <p>Kindly settle the outstanding amount immediately to ensure uninterrupted meal service.</p>
    <a href="http://localhost:3000" class="btn" style="background-color: #ef4444;">Clear Overdue Balance</a>
  `
  );

  return sendEmail({
    to: student.email,
    subject: `[URGENT] Overdue Mess Fee Notice: ₹${invoice.totalAmount} for ${invoice.month}`,
    html,
  });
};

/**
 * 4. Successful Payment Confirmation & Receipt
 */
const sendPaymentSuccessEmail = async (student, payment, invoice) => {
  const title = `Payment Confirmation – ₹${(payment.amount || 0).toLocaleString('en-IN')}`;
  const html = wrapHtmlTemplate(
    title,
    `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>We have successfully received your mess fee payment. Your official transaction receipt is ready.</p>
    <div class="card">
      <p><strong>Receipt / Transaction ID:</strong> ${payment.receiptNumber || payment.razorpayPaymentId || payment.transactionId || 'TXN-SUCCESS'}</p>
      <p><strong>Amount Paid:</strong> ₹${(payment.amount || 0).toLocaleString('en-IN')}</p>
      <p><strong>Payment Method:</strong> ${payment.paymentMethod || 'Online (Razorpay)'}</p>
      <p><strong>Billing Month:</strong> ${invoice?.month || 'Current Month'}</p>
      <p><strong>Payment Status:</strong> <span class="badge badge-success">PAID</span></p>
    </div>
    <p>You can download the PDF receipt directly from the student dashboard anytime.</p>
    <a href="http://localhost:3000" class="btn">View & Download PDF Receipt</a>
  `
  );

  return sendEmail({
    to: student.email,
    subject: `[Smart Mess Receipt] Payment of ₹${payment.amount} Confirmed (Txn: ${payment.receiptNumber || 'Verified'})`,
    html,
  });
};

/**
 * 5. Payment Failed Notice
 */
const sendPaymentFailedEmail = async (student, invoice, amount, reason = 'Bank declined or cancelled') => {
  const title = `Payment Transaction Incomplete`;
  const html = wrapHtmlTemplate(
    title,
    `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>Your attempt to pay <strong>₹${(amount || 0).toLocaleString('en-IN')}</strong> for ${invoice?.month || 'mess fees'} was not completed.</p>
    <div class="card">
      <p><strong>Reason:</strong> ${reason}</p>
      <p><strong>Status:</strong> <span class="badge badge-danger">FAILED / CANCELLED</span></p>
    </div>
    <p>No money was deducted from your account. If deducted, your bank will refund it within 3-5 working days.</p>
    <a href="http://localhost:3000" class="btn">Retry Payment</a>
  `
  );

  return sendEmail({
    to: student.email,
    subject: `[Smart Mess] Online Payment Attempt Failed - Action Required`,
    html,
  });
};

/**
 * 6. Complaint Status Update & Resolution
 */
const sendComplaintStatusEmail = async (student, complaint) => {
  const title = `Update on Complaint #${complaint.ticketNumber}`;
  const html = wrapHtmlTemplate(
    title,
    `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>The status of your grievance <strong>"${complaint.title}"</strong> has been updated.</p>
    <div class="card">
      <p><strong>Ticket ID:</strong> #${complaint.ticketNumber}</p>
      <p><strong>Category:</strong> ${complaint.category}</p>
      <p><strong>New Status:</strong> <span class="badge badge-info">${complaint.status}</span></p>
      ${complaint.adminResponse ? `<p><strong>Mess Bhaiya Response:</strong> "${complaint.adminResponse}"</p>` : ''}
    </div>
    <p>If you feel the issue is not fully resolved, you may reopen this ticket directly through your portal.</p>
    <a href="http://localhost:3000" class="btn">View Complaint Timeline</a>
  `
  );

  return sendEmail({
    to: student.email,
    subject: `[Smart Mess Helpdesk] Status Update: #${complaint.ticketNumber} is now ${complaint.status}`,
    html,
  });
};

/**
 * 7. Admin Alert: New Student Registration
 */
const sendAdminRegistrationAlert = async (adminEmail, student) => {
  const title = `New Student Registration: ${student.name}`;
  const html = wrapHtmlTemplate(
    title,
    `
    <p>Hello Mess Administrator,</p>
    <p>A new student has registered on the Smart Mess portal.</p>
    <div class="card">
      <p><strong>Student Name:</strong> ${student.name}</p>
      <p><strong>Student ID / Roll No:</strong> ${student.studentId || 'N/A'}</p>
      <p><strong>Room Details:</strong> ${student.roomNumber} (${student.hostelBlock})</p>
      <p><strong>Email:</strong> ${student.email}</p>
      <p><strong>Phone:</strong> ${student.phone || 'N/A'}</p>
      <p><strong>Diet:</strong> ${student.dietPreference || 'Veg'}</p>
    </div>
    <a href="http://localhost:3000" class="btn">View Student Profile</a>
  `
  );

  return sendEmail({
    to: adminEmail,
    subject: `[Admin Alert] New Student Registration: ${student.name} (Room ${student.roomNumber})`,
    html,
  });
};

/**
 * 8. Admin Alert: Successful Student Payment
 */
const sendAdminPaymentAlert = async (adminEmail, student, payment) => {
  const title = `New Fee Collection: ₹${(payment.amount || 0).toLocaleString('en-IN')}`;
  const html = wrapHtmlTemplate(
    title,
    `
    <p>Hello Mess Administrator,</p>
    <p>A student has successfully paid their mess fee.</p>
    <div class="card">
      <p><strong>Student:</strong> ${student.name} (Room ${student.roomNumber})</p>
      <p><strong>Amount Collected:</strong> ₹${(payment.amount || 0).toLocaleString('en-IN')}</p>
      <p><strong>Method:</strong> ${payment.paymentMethod || 'Razorpay Online'}</p>
      <p><strong>Transaction ID:</strong> ${payment.razorpayPaymentId || payment.transactionId || 'N/A'}</p>
    </div>
    <a href="http://localhost:3000" class="btn">View Fee Treasury</a>
  `
  );

  return sendEmail({
    to: adminEmail,
    subject: `[Fee Received] ₹${payment.amount} from ${student.name} (Room ${student.roomNumber})`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendFeeGeneratedEmail,
  sendDueDateReminderEmail,
  sendPaymentOverdueEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendComplaintStatusEmail,
  sendAdminRegistrationAlert,
  sendAdminPaymentAlert,
};
