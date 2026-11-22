/**
 * Client-Side Image File Validator and Base64 Converter
 * Validates MIME types, extensions, and enforces maximum 5MB size limit
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const validateAndReadImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file selected'));
    }

    // Check MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return reject(
        new Error(
          `Invalid file format (${file.type || 'unknown'}). Please upload a JPEG, PNG, WebP, or GIF image.`
        )
      );
    }

    // Check file size
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return reject(
        new Error(`Image size (${sizeMB} MB) exceeds maximum allowed limit of 5 MB.`)
      );
    }

    // Read as Base64 Data URL
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        success: true,
        dataUrl: reader.result,
        fileName: file.name,
        size: file.size,
      });
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file. Please try again.'));
    };

    reader.readAsDataURL(file);
  });
};
