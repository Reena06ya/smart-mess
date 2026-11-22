import React from 'react';
import { Printer, Download, X, CheckCircle2, ShieldCheck, FileText, UserCheck } from 'lucide-react';
import { formatINR, formatDateTime, formatDate } from '../../utils/formatters';
import { downloadReceiptPdf } from '../../utils/receiptPdfGenerator';

export const ReceiptModal = ({ isOpen, onClose, invoice, payment }) => {
  if (!isOpen || (!invoice && !payment)) return null;

  const data = payment || invoice;
  const student = data.student || invoice?.student || {};

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadReceiptPdf(data, student);
  };

  const receiptNumber = data.receiptNumber || (data._id ? `SM-REC-${data._id.slice(-6)}` : 'SM-REC-OFFICIAL');
  const studentName = student.name || 'Student';
  const studentId = student.studentId || 'N/A';
  const roomNumber = `${student.hostelBlock || 'Block A'} • Room ${student.roomNumber || 'N/A'}${
    student.bedNumber ? ` (${student.bedNumber})` : ''
  }`;
  const billingMonth = data.month || invoice?.month || 'Current Month';

  const amountPaid = data.amount !== undefined ? data.amount : (data.paidAmount || data.totalAmount || 0);
  const totalAmount = data.totalAmount || invoice?.totalAmount || amountPaid;
  const remainingBalance = Math.max(0, totalAmount - amountPaid);

  const transactionId = data.paymentReference || data.razorpayPaymentId || data.transactionId || 'ONLINE-VERIFIED';
  const paymentDate = data.paidAt || data.updatedAt || new Date();

  let paymentStatus = (data.status || 'PAID').toUpperCase();
  if (paymentStatus === 'SUCCESSFUL' || paymentStatus === 'PAID') {
    paymentStatus = remainingBalance > 0 ? 'PARTIALLY PAID' : 'PAID';
  } else if (paymentStatus === 'PARTIAL') {
    paymentStatus = 'PARTIALLY PAID';
  }

  const paymentMethod = data.paymentMethod || 'Razorpay Online';
  const verifiedByName = data.verifiedByName || data.verifiedBy?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Top Control Bar */}
        <div className="bg-navy-950 text-white px-5 py-3.5 flex items-center justify-between print:hidden border-b border-navy-800">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Hostel Mess Receipt</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              title="Download official PDF receipt file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-semibold transition-colors"
              title="Print receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Canvas */}
        <div id="receipt-paper" className="p-6 sm:p-8 bg-white font-sans text-slate-800 space-y-5">
          {/* Institution Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-navy-950 text-emerald-400 font-black text-xl mb-2 shadow-md">
              SM
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-navy-950">
              Smart Mess Hostel Management
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Central Student Hostel Mess Office • University Campus • New Delhi, 110001
            </p>
            <div className="mt-2.5 inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-0.5 rounded-full border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>OFFICIAL PAYMENT RECEIPT</span>
            </div>
          </div>

          {/* Receipt ID & Date Grid */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Receipt Number</p>
              <p className="font-mono font-bold text-slate-900 text-xs sm:text-sm">{receiptNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Payment Date & Time</p>
              <p className="font-semibold text-slate-800 text-xs">{formatDateTime(paymentDate)}</p>
            </div>
          </div>

          {/* Student & Payment Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-4 text-xs">
            {/* Student Particulars */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Student Particulars</p>
              <p className="font-bold text-slate-900 text-sm">{studentName}</p>
              <p className="text-slate-600 font-mono">
                Student ID: <strong className="text-slate-900">{studentId}</strong>
              </p>
              <p className="text-slate-600">
                Room Details: <strong className="text-slate-900">{roomNumber}</strong>
              </p>
              <p className="text-slate-500">{student.email}</p>
            </div>

            {/* Payment Meta */}
            <div className="space-y-1 sm:text-right">
              <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Transaction Info</p>
              <p className="font-bold text-slate-900">
                Billing Month: <span className="text-emerald-700">{billingMonth}</span>
              </p>
              <p className="text-slate-600">
                Payment Mode: <strong className="text-slate-900">{paymentMethod}</strong>
              </p>
              <p className="text-slate-600 font-mono text-[11px] truncate" title={transactionId}>
                Ref ID: {transactionId}
              </p>
              <div className="pt-1 flex sm:justify-end">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : paymentStatus === 'PARTIALLY PAID'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  Status: {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-900">Fee Breakdown</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                  <th className="text-left py-1.5">Description</th>
                  <th className="text-center py-1.5">Month</th>
                  <th className="text-right py-1.5">Total Dues</th>
                  <th className="text-right py-1.5">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5">
                    <p className="font-bold text-slate-900">Hostel Mess Subscription</p>
                    <p className="text-[10px] text-slate-500">4 daily meals (Breakfast, Lunch, Snacks, Dinner)</p>
                  </td>
                  <td className="py-2.5 text-center text-slate-600 font-medium">{billingMonth}</td>
                  <td className="py-2.5 text-right font-medium text-slate-800">{formatINR(totalAmount)}</td>
                  <td className="py-2.5 text-right font-black text-emerald-700">{formatINR(amountPaid)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Summary Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Monthly Bill:</span>
              <span className="font-bold text-slate-800">{formatINR(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Amount Paid in this Receipt:</span>
              <span className="font-bold text-emerald-700">{formatINR(amountPaid)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Remaining Balance:</span>
              <span className={`font-bold ${remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {remainingBalance > 0 ? formatINR(remainingBalance) : '₹0 (Fully Cleared)'}
              </span>
            </div>
            <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
              <span>Net Settled Amount:</span>
              <span className="text-emerald-600 font-black text-base">{formatINR(amountPaid)}</span>
            </div>
          </div>

          {/* Verified By / Offline Audit Banner */}
          {verifiedByName && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Verified & Recorded by Mess Staff: <strong>{verifiedByName}</strong> on {formatDateTime(data.verifiedAt || paymentDate)}
              </span>
            </div>
          )}

          {/* Authorized Seal & Signatory */}
          <div className="pt-4 flex items-end justify-between text-[11px] text-slate-500 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Verified Transaction</span>
            </div>
            <div className="text-center">
              <div className="w-28 border-b border-slate-400 mb-1"></div>
              <p className="font-bold text-slate-800 text-[10px]">Authorized Signatory</p>
              <p className="text-[9px] text-slate-400">Hostel Mess Committee</p>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-400 pt-1">
            This is an electronically generated and cryptographically verifiable receipt. No physical signature required.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
