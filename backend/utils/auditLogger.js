const AuditLog = require('../models/AuditLog');

/**
 * Records an immutable administrative audit log entry
 * @param {Object} params
 * @param {string} params.action - Action identifier e.g. 'RECORD_OFFLINE_PAYMENT'
 * @param {Object} params.req - Express request containing req.user and IP
 * @param {string} params.targetType - Model name e.g. 'FeeInvoice', 'User'
 * @param {string} params.targetId - ID of affected entity
 * @param {string} params.summary - Human-readable action description
 * @param {Object} params.details - Detailed key-value context
 */
const recordAuditLog = async ({
  action,
  req,
  targetType,
  targetId = '',
  summary,
  details = {},
}) => {
  try {
    const admin = req?.user;
    const ipAddress =
      req?.headers?.['x-forwarded-for'] ||
      req?.connection?.remoteAddress ||
      req?.socket?.remoteAddress ||
      '127.0.0.1';

    await AuditLog.create({
      action,
      admin: admin?._id || null,
      adminName: admin?.name || 'Mess Administrator',
      adminEmail: admin?.email || 'admin@smartmess.in',
      adminRole: admin?.role || 'admin',
      targetType,
      targetId: String(targetId || ''),
      summary,
      details,
      ipAddress: String(ipAddress),
    });
  } catch (error) {
    // Non-blocking fallback: Never crash primary transaction if audit logging encounters a glitch
    console.error('[Audit Log Error]:', error.message);
  }
};

module.exports = {
  recordAuditLog,
};
