/**
 * Input Validation & Sanitization Utility for Smart Mess
 * Protects against XSS, script injection, and invalid image payloads
 */

// Regular expressions
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
const URL_IMAGE_REGEX = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i;
const TRUSTED_DOMAINS = ['unsplash.com', 'dicebear.com', 'cloudinary.com', 'githubusercontent.com', 'googleusercontent.com'];

/**
 * Strips script tags, javascript: uris, and malicious HTML event handlers
 */
const sanitizeText = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .trim();
};

/**
 * Validates email address format
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates image input (accepts either valid https URL from trusted domain/image extension or valid base64 data URI)
 */
const isValidImagePayload = (imageStr) => {
  if (!imageStr || typeof imageStr !== 'string') return true; // optional
  const trimmed = imageStr.trim();
  if (trimmed === '') return true;

  // Check Base64 Data URI
  if (trimmed.startsWith('data:image/')) {
    // Max 5MB Base64 string check (~7MB in base64 chars)
    if (trimmed.length > 7 * 1024 * 1024) {
      return { valid: false, error: 'Image size exceeds maximum allowed 5MB limit' };
    }
    const isValidFormat = BASE64_IMAGE_REGEX.test(trimmed);
    if (!isValidFormat) {
      return { valid: false, error: 'Invalid base64 image encoding or unsupported image mime type' };
    }
    return { valid: true };
  }

  // Check HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const isImageExt = URL_IMAGE_REGEX.test(trimmed);
    const isTrusted = TRUSTED_DOMAINS.some((d) => trimmed.toLowerCase().includes(d));
    if (isImageExt || isTrusted) {
      return { valid: true };
    }
    return { valid: false, error: 'Image URL must end with .jpg, .png, .webp, or originate from a trusted image CDN' };
  }

  return { valid: false, error: 'Image must be a valid HTTPS URL or Base64 data image URI' };
};

/**
 * Validates and constrains numeric amounts
 */
const isValidPositiveNumber = (val) => {
  const num = Number(val);
  return !isNaN(num) && num > 0 && isFinite(num);
};

module.exports = {
  sanitizeText,
  isValidEmail,
  isValidImagePayload,
  isValidPositiveNumber,
};
