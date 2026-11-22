import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Receipt,
  Download,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileCheck,
  Tag,
  ShieldCheck,
  RefreshCw,
  History,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Wallet,
} from 'lucide-react';
import api from '../../services/api';
import { formatINR, formatDate, formatDateTime, getStatusBadgeStyle } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import RazorpayCheckoutModal from '../../components/payment/RazorpayCheckoutModal';
import ReceiptModal from '../../components/payment/ReceiptModal';
import { useNotification } from '../../context/NotificationContext';
import { downloadReceiptPdf } from '../../utils/receiptPdfGenerator';

export const StudentFees = () => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [feeData, setFeeData] = useState({
    invoices: [],
    payments: [],
    totalMessFees: 0,
    totalPaid: 0,
    totalPending: 0,
    nextDueDate: null,
    currentInvoice: null,
    monthlyPlan: 3800,
  });

  const [activeCheckoutInvoice, setActiveCheckoutInvoice] = useState(null);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState(null);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState(null);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fees/my-invoices');
      if (res.data?.success) {
        setFeeData(res.data.data);
      }
    } catch (err) {
      showToast('Error loading mess fee records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handlePaymentSuccess = () => {
    fetchFees();
    setActiveCheckoutInvoice(null);
  };

  const invoices = feeData.invoices || [];
  const payments = feeData.payments || [];
  const currentInvoice = feeData.currentInvoice || invoices[0] || null;
  const previousInvoices = invoices.slice(1);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>Hostel Dining Treasury</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Mess Invoices & Online Payments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View monthly dues, settle balances in full or in parts via Razorpay, and download verified PDF receipts.
          </p>
        </div>

        <button
          onClick={fetchFees}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding Due */}
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white rounded-2xl p-5 shadow-lg border border-navy-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Outstanding Due
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
              {formatINR(feeData.totalPending)}
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              {feeData.totalPending > 0
                ? 'Pending semester balance to settle'
                : 'All hostel mess dues cleared! 🎉'}
            </p>
          </div>

          {feeData.totalPending > 0 && currentInvoice && (
            <div className="mt-4 pt-3 border-t border-navy-800">
              <button
                onClick={() => setActiveCheckoutInvoice(currentInvoice)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay Dues Online</span>
              </button>
            </div>
          )}
        </div>

        {/* Paid Amount */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Paid Amount
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {formatINR(feeData.totalPaid)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Verified hostel fee remittances</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
            <span>{payments.length} successful transactions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Current Month's Fee */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Monthly Fee
              </span>
              {currentInvoice && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    currentInvoice.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentInvoice.status === 'PARTIALLY PAID'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {currentInvoice.status}
                </span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {formatINR(currentInvoice?.totalAmount || feeData.monthlyPlan)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {currentInvoice?.month || 'Current Month'} Bill
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Remaining Due:</span>
            <strong className="text-slate-900">
              {currentInvoice ? formatINR(Math.max(0, currentInvoice.totalAmount - currentInvoice.paidAmount)) : '₹0'}
            </strong>
          </div>
        </div>

        {/* Next Payment Due Date */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Payment Due Date
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {feeData.nextDueDate ? formatDate(feeData.nextDueDate) : 'No Pending Due'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {feeData.nextDueDate && new Date(feeData.nextDueDate) < new Date() ? (
                <span className="text-rose-600 font-bold">Dues are overdue! Please settle soon.</span>
              ) : (
                'Standard 15-day grace cycle'
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Monthly grace period applies</span>
          </div>
        </div>
      </div>

      {/* CURRENT ACTIVE MONTH INVOICE CARD */}
      {currentInvoice && (
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/30 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Current Billing Cycle
                </span>
                <h3 className="text-lg font-bold text-slate-900">{currentInvoice.month} Mess Fee</h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  currentInvoice.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : currentInvoice.status === 'PARTIALLY PAID'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                Status: {currentInvoice.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <p className="text-slate-400 font-semibold">Total Monthly Charge</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{formatINR(currentInvoice.totalAmount)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">Amount Paid</p>
              <p className="text-base font-black text-emerald-600 mt-0.5">{formatINR(currentInvoice.paidAmount)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">Remaining Balance</p>
              <p className="text-base font-black text-rose-600 mt-0.5">
                {formatINR(Math.max(0, currentInvoice.totalAmount - currentInvoice.paidAmount))}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">Due Date</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">{formatDate(currentInvoice.dueDate)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500">
              {currentInvoice.paidAmount >= currentInvoice.totalAmount
                ? 'Your mess fee for this month is fully settled.'
                : 'You can pay the full amount or any partial amount online.'}
            </p>

            <div className="flex items-center space-x-2">
              {currentInvoice.paidAmount < currentInvoice.totalAmount ? (
                <button
                  onClick={() => setActiveCheckoutInvoice(currentInvoice)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    Pay Now ({formatINR(currentInvoice.totalAmount - currentInvoice.paidAmount)})
                  </span>
                </button>
              ) : null}

              {currentInvoice.paidAmount > 0 && (
                <>
                  <button
                    onClick={() => setActiveReceiptInvoice(currentInvoice)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>View Receipt</span>
                  </button>

                  <button
                    onClick={() => downloadReceiptPdf(currentInvoice)}
                    className="px-3 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PREVIOUS MONTHS' INVOICES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">All Monthly Mess Invoices</h3>
            <p className="text-xs text-slate-500">Previous months' billing records and historical dues</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{invoices.length} invoices</span>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={3} type="table-row" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Receipt}
              title="No Invoices Found"
              description="Your mess billing invoices will appear here once generated by the Mess Bhaiya."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-3.5">Month</th>
                  <th className="px-6 py-3.5">Total Bill</th>
                  <th className="px-6 py-3.5">Paid Amount</th>
                  <th className="px-6 py-3.5">Remaining Balance</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Payment Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const remaining = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{inv.month}</p>
                        {inv.notes && <p className="text-[10px] text-slate-400">{inv.notes}</p>}
                      </td>

                      <td className="px-6 py-4 font-extrabold text-slate-900">
                        {formatINR(inv.totalAmount)}
                      </td>

                      <td className="px-6 py-4 font-bold text-emerald-600">
                        {formatINR(inv.paidAmount || 0)}
                      </td>

                      <td className="px-6 py-4 font-bold">
                        {remaining > 0 ? (
                          <span className="text-rose-600">{formatINR(remaining)}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">₹0 (Cleared)</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {formatDate(inv.dueDate)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PARTIALLY PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : inv.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        {remaining > 0 ? (
                          <button
                            onClick={() => setActiveCheckoutInvoice(inv)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                          >
                            Pay Dues
                          </button>
                        ) : null}

                        {inv.paidAmount > 0 && (
                          <>
                            <button
                              onClick={() => setActiveReceiptInvoice(inv)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-colors inline-flex items-center space-x-1"
                              title="View official receipt"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Receipt</span>
                            </button>

                            <button
                              onClick={() => downloadReceiptPdf(inv)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center"
                              title="Download PDF Receipt"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPLETE TRANSACTION HISTORY LEDGER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payment & Transaction Ledger</h3>
              <p className="text-xs text-slate-500">Official log of all online Razorpay & verified offline cash payments</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
            {payments.length} verified transactions
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No transactions recorded yet. Once a payment is completed, it will appear here with a verified receipt.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-3.5">Payment Date</th>
                  <th className="px-6 py-3.5">Receipt No.</th>
                  <th className="px-6 py-3.5">Month / Invoice</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Transaction Ref</th>
                  <th className="px-6 py-3.5">Amount Paid</th>
                  <th className="px-6 py-3.5">Remaining</th>
                  <th className="px-6 py-3.5 text-right">PDF Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">
                      {formatDateTime(p.paidAt)}
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-800">
                      {p.invoice?.month || 'Mess Fee'}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 font-semibold text-slate-700">
                        <span>{p.paymentMethod}</span>
                      </span>
                      {p.verifiedByName && (
                        <p className="text-[10px] text-blue-600 font-medium">by {p.verifiedByName}</p>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500 truncate max-w-[140px]" title={p.paymentReference || p.razorpayPaymentId}>
                      {p.paymentReference || p.razorpayPaymentId || `TX-${p._id.slice(-6)}`}
                    </td>

                    <td className="px-6 py-4 font-black text-emerald-700 text-sm">
                      {formatINR(p.amount)}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-600">
                      {p.remainingBalance > 0 ? (
                        <span className="text-amber-700">{formatINR(p.remainingBalance)}</span>
                      ) : (
                        <span className="text-emerald-700">₹0 (Paid)</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setActiveReceiptPayment(p);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-colors inline-flex items-center space-x-1"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => downloadReceiptPdf(p, p.student)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Online Checkout Modal */}
      {activeCheckoutInvoice && (
        <RazorpayCheckoutModal
          isOpen={!!activeCheckoutInvoice}
          invoice={activeCheckoutInvoice}
          onClose={() => setActiveCheckoutInvoice(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Printable Receipt Modal (Invoice-Level) */}
      {activeReceiptInvoice && (
        <ReceiptModal
          isOpen={!!activeReceiptInvoice}
          invoice={activeReceiptInvoice}
          onClose={() => setActiveReceiptInvoice(null)}
        />
      )}

      {/* Printable Receipt Modal (Transaction-Level) */}
      {activeReceiptPayment && (
        <ReceiptModal
          isOpen={!!activeReceiptPayment}
          payment={activeReceiptPayment}
          invoice={activeReceiptPayment.invoice}
          onClose={() => setActiveReceiptPayment(null)}
        />
      )}
    </div>
  );
};

export default StudentFees;
