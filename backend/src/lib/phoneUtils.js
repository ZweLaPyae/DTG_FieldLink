/**
 * Phone number utility functions
 */

/**
 * Normalize phone number by removing all non-digit characters
 * @param {string} phone - Phone number in any format
 * @returns {string} - Phone number with only digits
 * 
 * Examples:
 * - "09-989851423" -> "09989851423"
 * - "082 867 6735" -> "0828676735"
 * - "082_8675213" -> "0828675213"
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters (spaces, dashes, underscores, parentheses, etc.)
  return phone.replace(/\D/g, '');
}

/**
 * Format phone number for display (Myanmar format)
 * @param {string} phone - Normalized phone number
 * @returns {string} - Formatted phone number
 * 
 * Examples:
 * - "09989851423" -> "09-989851423"
 * - "0828676735" -> "082-8676735"
 */
export function formatPhone(phone) {
  if (!phone) return '';
  
  const normalized = normalizePhone(phone);
  
  // Myanmar format: XXX-XXXXXXX or XX-XXXXXXXX
  if (normalized.length === 11 && normalized.startsWith('09')) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2)}`;
  } else if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  } else if (normalized.length === 9) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2)}`;
  }
  
  return normalized;
}
