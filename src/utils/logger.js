const logger = {
  /**
   * Log an info message
   * @param {string} message - The message to log
   * @param {Object} [data] - Optional data to include
   */
  info(message, data) {
    console.log(`[INFO] ${message}`, data ? data : '');
  },

  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {Object} [data] - Optional data to include
   */
  warn(message, data) {
    console.warn(`[WARN] ${message}`, data ? data : '');
  },

  /**
   * Log an error message
   * @param {string} message - The message to log
   * @param {Error|Object} [error] - Optional error to include
   */
  error(message, error) {
    console.error(`[ERROR] ${message}`, error ? error : '');
  },

  /**
   * Log a debug message (only in development or when DEBUG env var is set)
   * @param {string} message - The message to log
   * @param {Object} [data] - Optional data to include
   */
  debug(message, data) {
    // Only log debug messages if NODE_ENV is not production or DEBUG is set
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, data ? data : '');
    }
  }
};

module.exports = logger;
