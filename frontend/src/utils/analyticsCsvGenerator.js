/**
 * Smart Mess Analytics CSV Report Generator
 * Exports filtered financial and operational records to downloadable CSV
 */

export const exportAnalyticsCsv = (records = [], summary = {}, filters = {}) => {
  if (!records || records.length === 0) {
    alert('No records available to export for the selected filters.');
    return;
  }

  // Define CSV headers
  const headers = [
    'Invoice Number',
    'Student Name',
    'Enrollment ID',
    'Hostel Block',
    'Room Number',
    'Billing Month',
    'Billed Amount (INR)',
    'Paid Amount (INR)',
    'Pending Balance (INR)',
    'Payment Status',
    'Due Date',
    'Payment Mode',
    'Transaction Reference',
    'Record Date',
  ];

  // Map data rows with CSV escaping
  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = records.map((r) => [
    escapeCsv(r.invoiceNumber || 'N/A'),
    escapeCsv(r.studentName || 'N/A'),
    escapeCsv(r.studentId || 'N/A'),
    escapeCsv(r.hostelBlock || 'Block A'),
    escapeCsv(r.roomNumber || 'N/A'),
    escapeCsv(r.month || 'N/A'),
    r.billedAmount || 0,
    r.paidAmount || 0,
    r.pendingBalance || 0,
    escapeCsv(r.status || 'PENDING'),
    escapeCsv(r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : 'N/A'),
    escapeCsv(r.paymentMethod || 'Online (Razorpay)'),
    escapeCsv(r.transactionId || 'N/A'),
    escapeCsv(r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : 'N/A'),
  ]);

  // Executive Summary Rows at top
  const summaryHeader = [
    ['--- EXECUTIVE FINANCIAL AUDIT SUMMARY ---'],
    ['Generated On', new Date().toLocaleString('en-IN')],
    ['Active Filter Month', filters.month || 'All Months'],
    ['Active Filter Room', filters.roomNumber || 'All Rooms'],
    ['Active Filter Status', filters.status || 'All Statuses'],
    ['Total Registered Students', summary.totalStudents || 0],
    ['Total Occupied Rooms', summary.occupiedRooms || 0],
    ['Total Billed Fees (INR)', summary.totalMonthlyFees || 0],
    ['Total Collected Fees (INR)', summary.totalCollectedFees || 0],
    ['Total Pending Balance (INR)', summary.totalPendingFees || 0],
    ['Total Overdue Dues (INR)', summary.totalOverdueFees || 0],
    ['Successful Transactions', summary.totalSuccessfulTransactions || 0],
    ['Total Complaints', summary.totalComplaints || 0],
    ['Unresolved Complaints', summary.unresolvedComplaints || 0],
    ['Average Student Rating', `${summary.averageRating || 0} / 5.0`],
    ['---------------------------------------------'],
    [],
  ];

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    summaryHeader.map((e) => e.join(',')).join('\n') +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `smart_mess_analytics_report_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
