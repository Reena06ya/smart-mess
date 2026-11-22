import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Landmark,
  AlertCircle,
  Loader2,
  QrCode,
  Download,
  X,
  FileCheck,
  ArrowRight,
  XCircle,
  RotateCcw,
  Lock,
} from 'lucide-react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { downloadReceiptPdf } from '../../utils/receiptPdfGenerator';

/**
 * Loads the official Razorpay Checkout SDK dynamically
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const RazorpayCheckoutModal = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  const { showToast } = useNotification();
  const [step, setStep] = useState('review'); // 'review' | 'method_select' | 'processing' | 'success' | 'failure'
  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [failureResult, setFailureResult] = useState(null);

  // Simulated Test Inputs (Transient only in UI - Never stored in database or API)
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [selectedBank, setSelectedBank] = useState('State Bank of India');

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  if (!isOpen || !invoice) return null;

  const totalAmount = invoice.totalAmount || 0;
  const alreadyPaid = invoice.paidAmount || 0;
  const remainingDue = Math.max(0, totalAmount - alreadyPaid);

  // Calculate actual amount to pay
  const payAmount =
    paymentType === 'full'
      ? remainingDue
      : Math.min(remainingDue, Math.max(1, Number(customAmount) || 0));

  const remainingAfterPayment = Math.max(0, remainingDue - payAmount);
  const isPartial = remainingAfterPayment > 0;

  const handleProceedToPayment = async () => {
    if (payAmount <= 0) {
      showToast('Please enter a valid payment amount greater than ₹0', 'error');
      return;
    }
    if (payAmount > remainingDue) {
      showToast(`Amount cannot exceed pending dues of ${formatINR(remainingDue)}`, 'error');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Order on Backend (Secret keys never exposed to client)
      const res = await api.post('/fees/create-order', {
        invoiceId: invoice._id,
        customAmount: payAmount,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Could not initiate Razorpay order');
      }

      const orderData = res.data.data;

      // If Razorpay live/test script is loaded and user has configured live test key
      if (
        window.Razorpay &&
        orderData.key &&
        !orderData.key.includes('SmartMess2026Key') &&
        !orderData.isSimulated
      ) {
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Smart Mess Hostel Portal',
          description: `Hostel Mess Dues (${invoice.month})`,
          order_id: orderData.orderId,
          handler: async (response) => {
            await verifyAndCompletePayment({
              invoiceId: invoice._id,
              amount: payAmount,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: async () => {
              await handlePaymentFailure({
                errorCode: 'CANCELLED_BY_USER',
                errorDescription: 'User cancelled or closed Razorpay payment popup',
                razorpayOrderId: orderData.orderId,
              });
            },
          },
          prefill: {
            name: orderData.student?.name,
            email: orderData.student?.email,
            contact: orderData.student?.phone,
          },
          theme: { color: '#10b981' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      } else {
        // Interactive Test Mode Payment Gateway
        setStep('method_select');
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      showToast(err.response?.data?.message || err.message || 'Payment initiation failed', 'error');
    }
  };

  // Simulate Payment Success
  const handleSimulatePaymentSubmission = async () => {
    setLoading(true);
    try {
      const simulatedOrderId = `order_${Math.random().toString(36).substring(2, 12)}`;
      const simulatedPaymentId = `pay_${Math.random().toString(36).substring(2, 12)}`;
      const simulatedSignature = 'simulated_signature_pass';

      await verifyAndCompletePayment({
        invoiceId: invoice._id,
        amount: payAmount,
        razorpayOrderId: simulatedOrderId,
        razorpayPaymentId: simulatedPaymentId,
        razorpaySignature: simulatedSignature,
      });
    } catch (err) {
      setLoading(false);
      showToast(err.response?.data?.message || 'Verification failed', 'error');
    }
  };

  // Simulate Payment Failure / Cancellation
  const handleSimulatePaymentFailure = async () => {
    await handlePaymentFailure({
      errorCode: 'SIMULATED_GATEWAY_DECLINE',
      errorDescription: 'Transaction declined by issuer bank (Simulated Test Mode)',
      razorpayOrderId: `fail_ord_${Date.now()}`,
    });
  };

  // Backend Cryptographic Signature Verification
  const verifyAndCompletePayment = async (payload) => {
    setStep('processing');
    try {
      const res = await api.post('/fees/verify-payment', payload);
      if (res.data?.success) {
        setPaymentResult(res.data.data);
        setStep('success');
        showToast(res.data.message || 'Payment verified successfully!', 'success');
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data.data);
        }
      } else {
        throw new Error(res.data?.message || 'Verification rejected by backend');
      }
    } catch (err) {
      await handlePaymentFailure({
        errorCode: 'SIGNATURE_VERIFICATION_FAILED',
        errorDescription: err.response?.data?.message || 'Cryptographic signature verification mismatch',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle and Log Payment Failure
  const handlePaymentFailure = async ({ errorCode, errorDescription, razorpayOrderId }) => {
    try {
      await api.post('/fees/payment-failed', {
        invoiceId: invoice._id,
        amount: payAmount,
        razorpayOrderId,
        errorCode,
        errorDescription,
      });
    } catch (e) {
      console.warn('Could not log failure to server:', e);
    }

    setFailureResult({
      code: errorCode,
      reason: errorDescription,
      amount: payAmount,
    });
    setStep('failure');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Razorpay Secure Online Checkout</h3>
              <p className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider">
                UPI • Cards • NetBanking • Test Mode
              </p>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* STEP 1: Invoice Review & Amount Selection */}
        {step === 'review' && (
          <div className="p-6 space-y-5">
            {/* Invoice Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 text-xs">
                <span className="text-slate-500 font-medium">Billing Period:</span>
                <span className="font-bold text-slate-900">{invoice.month}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Fee</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">{formatINR(totalAmount)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Paid So Far</p>
                  <p className="text-xs font-black text-emerald-600 mt-0.5">{formatINR(alreadyPaid)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Pending Amount</p>
                  <p className="text-xs font-black text-rose-600 mt-0.5">{formatINR(remainingDue)}</p>
                </div>
              </div>
            </div>

            {/* Payment Amount Choice */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">Choose Payment Amount:</label>

              <div className="grid grid-cols-2 gap-3">
                {/* Full Payment Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('full');
                    setCustomAmount('');
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all ${
                    paymentType === 'full'
                      ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">Pay Full Due</p>
                  <p className="text-base font-black text-emerald-700 mt-0.5">{formatINR(remainingDue)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Clears entire remaining balance</p>
                </button>

                {/* Custom / Partial Payment Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('custom');
                    if (!customAmount) setCustomAmount(Math.round(remainingDue / 2));
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all ${
                    paymentType === 'custom'
                      ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">Pay Custom / Partial</p>
                  <p className="text-base font-black text-amber-700 mt-0.5">Custom (₹)</p>
                  <p className="text-[10px] text-slate-500 mt-1">Pay part now, rest later</p>
                </button>
              </div>

              {/* Custom Amount Input Field */}
              {paymentType === 'custom' && (
                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2 animate-fade-in">
                  <label className="block text-xs font-bold text-amber-900">
                    Enter Exact Amount to Pay Now (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={remainingDue}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder={`Max: ${remainingDue}`}
                      className="w-full text-sm font-bold rounded-xl border border-amber-300 pl-8 pr-4 py-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-800">
                    <span>Quick presets:</span>
                    <div className="space-x-1.5">
                      {[1000, 1500, 2000].map(
                        (preset) =>
                          preset < remainingDue && (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setCustomAmount(preset)}
                              className="px-2 py-0.5 rounded-md bg-white border border-amber-300 font-bold hover:bg-amber-100"
                            >
                              ₹{preset}
                            </button>
                          )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Real-Time Settlement Preview */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Amount to Pay Now:</span>
                <span className="font-extrabold text-emerald-400 text-sm">{formatINR(payAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Remaining Balance After Payment:</span>
                <span className={`font-bold ${isPartial ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {formatINR(remainingAfterPayment)}
                </span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-slate-200">
                <span>Post-Payment Status:</span>
                <span className={`uppercase font-black ${isPartial ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isPartial ? 'PARTIALLY PAID' : 'PAID (FULLY SETTLED)'}
                </span>
              </div>
            </div>

            {/* Zero card storage guarantee */}
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>PCI-DSS Compliant: We never store debit/credit card numbers or UPI PINs.</span>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceedToPayment}
              disabled={loading || payAmount <= 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Razorpay Order...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Pay {formatINR(payAmount)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Interactive Payment Simulation Gateway */}
        {step === 'method_select' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Razorpay Test Environment
              </span>
              <h4 className="text-base font-black text-slate-900">Choose Test Payment Method</h4>
              <p className="text-xs text-slate-500">
                Paying <strong className="text-emerald-700">{formatINR(payAmount)}</strong> for {invoice.month}
              </p>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'upi', label: 'UPI / QR', icon: QrCode },
                { id: 'card', label: 'Debit/Credit Card', icon: CreditCard },
                { id: 'netbanking', label: 'NetBanking', icon: Landmark },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 rounded-2xl flex flex-col items-center space-y-1 text-xs font-bold border transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* UPI Section */}
            {selectedMethod === 'upi' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-2xl border border-slate-300 shadow-sm flex flex-col items-center justify-center">
                  <QrCode className="w-20 h-20 text-slate-800" />
                  <span className="text-[9px] font-mono text-slate-500 mt-1">Scan via any UPI App</span>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800">UPI ID: smartmess@razorpay</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Google Pay • PhonePe • Paytm • BHIM</p>
                </div>
              </div>
            )}

            {/* Card Section */}
            {selectedMethod === 'card' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Card Number (Test Simulation)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={cardNumber}
                    className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 p-2.5 bg-slate-100 text-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Expiry</label>
                    <input
                      type="text"
                      disabled
                      value={cardExpiry}
                      className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 p-2.5 bg-slate-100 text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">CVV</label>
                    <input
                      type="password"
                      disabled
                      value="•••"
                      className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 p-2.5 bg-slate-100 text-slate-600"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Card details are processed exclusively through Razorpay test vault.
                </p>
              </div>
            )}

            {/* NetBanking Section */}
            {selectedMethod === 'netbanking' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <label className="block text-xs font-bold text-slate-700">Select Bank:</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium"
                >
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                </select>
              </div>
            )}

            {/* Test Action Buttons: Simulate Success OR Simulate Failure */}
            <div className="space-y-2 pt-2">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePaymentSubmission}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Confirm & Pay ({formatINR(payAmount)})</span>
                  )}
                </button>
              </div>

              {/* Explicit Test Failure / Cancel Simulation Option */}
              <button
                type="button"
                onClick={handleSimulatePaymentFailure}
                className="w-full py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors"
              >
                Simulate Payment Failure / Cancellation
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Cryptographic Backend Processing */}
        {step === 'processing' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Verifying Cryptographic Signature...</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Verifying Razorpay HMAC-SHA256 signature, enforcing anti-duplicate ledger check, and updating student account.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS PAGE */}
        {step === 'success' && paymentResult && (
          <div className="p-8 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Payment Verified & Recorded
              </span>
              <h4 className="text-xl font-black text-slate-900 mt-2">
                ₹{paymentResult.amountPaid?.toLocaleString('en-IN')} Received Successfully!
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                Receipt Number: <strong className="text-slate-800">{paymentResult.receiptNumber}</strong>
              </p>
            </div>

            {/* Post payment balance status */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between text-slate-600">
                <span>Month:</span>
                <span className="font-bold text-slate-900">{invoice.month}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-900">Razorpay Online</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction Ref ID:</span>
                <span className="font-mono text-[11px] text-slate-800">
                  {paymentResult.payment?.razorpayPaymentId || 'VERIFIED'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fee Status:</span>
                <span className="font-black text-emerald-700">{paymentResult.status || 'PAID'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Remaining Dues:</span>
                <span
                  className={`font-black ${
                    paymentResult.remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {paymentResult.remainingBalance > 0
                    ? `₹${paymentResult.remainingBalance?.toLocaleString('en-IN')}`
                    : '₹0 (Fully Cleared)'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  downloadReceiptPdf(paymentResult.payment || paymentResult.invoice, invoice.student);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Receipt</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: FAILURE PAGE */}
        {step === 'failure' && (
          <div className="p-8 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                Payment Incomplete / Cancelled
              </span>
              <h4 className="text-xl font-black text-slate-900 mt-2">
                Transaction Could Not Be Processed
              </h4>
              <p className="text-xs text-rose-600 font-medium">
                {failureResult?.reason || 'The transaction was cancelled or declined by your bank.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between text-slate-600">
                <span>Attempted Amount:</span>
                <span className="font-bold text-slate-900">{formatINR(failureResult?.amount || payAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Deduction Status:</span>
                <span className="font-bold text-emerald-700">₹0 (No funds deducted from account)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Error Code:</span>
                <span className="font-mono text-[11px] text-slate-500">{failureResult?.code || 'DECLINED'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setStep('review')}
                className="flex-1 py-3 px-4 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RazorpayCheckoutModal;
