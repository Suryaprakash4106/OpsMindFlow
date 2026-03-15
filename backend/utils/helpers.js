/**
 * Common helper functions used across the application
 */

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP as string
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Format date to readable string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Handle async errors for Express routes
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped function with error handling
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Sanitize user object by removing sensitive fields
 * @param {Object} user - Mongoose user document
 * @returns {Object} Clean user object
 */
function sanitizeUser(user) {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.otp;
  delete userObj.otpExpires;
  delete userObj.__v;
  return userObj;
}

module.exports = {
  generateOTP,
  formatDate,
  asyncHandler,
  sanitizeUser
};