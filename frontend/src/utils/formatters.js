/**
 * Format currency into Indian Rupees (₹)
 */
export const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to Indian standard (DD/MM/YYYY)
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format datetime to Indian standard with IST time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get status badge classes
 */
export const getStatusBadgeStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'resolved':
    case 'approved':
    case 'active':
    case 'successful':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';

    case 'in progress':
    case 'partial':
    case 'medium':
      return 'bg-blue-50 text-blue-700 border border-blue-200';

    case 'pending':
    case 'on leave':
    case 'low':
      return 'bg-amber-50 text-amber-700 border border-amber-200';

    case 'rejected':
    case 'failed':
    case 'overdue':
    case 'suspended':
    case 'urgent':
    case 'high':
      return 'bg-rose-50 text-rose-700 border border-rose-200';

    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};
