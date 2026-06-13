/**
 * Utility Functions
 * Formatting, validation, and helper functions
 */

class Utils {
  /**
   * Format number with specified decimal places
   * @param {number} num - Number to format
   * @param {number} decimals - Number of decimal places
   * @returns {number} Formatted number
   */
  static fmt(num, decimals = 4) {
    if (typeof num !== 'number') return num;
    return Number(num.toFixed(decimals));
  }

  /**
   * Format number as string with decimals
   * @param {number} num - Number to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted string
   */
  static fmtStr(num, decimals = 4) {
    return this.fmt(num, decimals).toFixed(decimals);
  }

  /**
   * Format percentage
   * @param {number} num - Decimal number (0-1)
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted percentage
   */
  static fmtPercent(num, decimals = 2) {
    return `${this.fmt(num * 100, decimals).toFixed(decimals)}%`;
  }

  /**
   * Format percentage with color
   * @param {number} num - Decimal number
   * @param {number} threshold - Threshold for color
   * @returns {string} HTML with color
   */
  static fmtPercentColor(num, threshold = 0.05) {
    const pct = this.fmt(num * 100, 2);
    const color = num < threshold ? 'var(--red)' : 'var(--green)';
    return `<span style="color:${color};font-weight:600">${pct.toFixed(2)}%</span>`;
  }

  /**
   * Check if data is numeric
   * @param {Array} values - Array of values
   * @returns {boolean} True if mostly numeric
   */
  static isNumeric(values) {
    const numericCount = values
      .map(v => parseFloat(String(v).replace(',', '.')))
      .filter(v => !isNaN(v)).length;
    return numericCount / Math.max(values.length, 1) > 0.6;
  }

  /**
   * Validate data is not empty
   * @param {Array} data - Data array
   * @returns {boolean} True if valid
   */
  static validateData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Sin datos cargados');
    }
    return true;
  }

  /**
   * Detect and handle missing values
   * @param {Array} values - Array of values
   * @returns {Object} Info about missing values
   */
  static detectMissing(values) {
    const missing = values.filter(
      v => v === '' || v === null || v === undefined || v === 'NA' || v === 'N/A'
    ).length;
    return {
      count: missing,
      percentage: (missing / values.length) * 100,
      hasMissing: missing > 0
    };
  }

  /**
   * Detect outliers using IQR method
   * @param {Array} values - Numeric array
   * @returns {Array} Outlier indices
   */
  static detectOutliers(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1Idx = Math.floor(sorted.length * 0.25);
    const q3Idx = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Idx];
    const q3 = sorted[q3Idx];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values
      .map((v, i) => (v < lowerBound || v > upperBound ? i : -1))
      .filter(i => i !== -1);
  }

  /**
   * Get string representation of hypothesis direction
   * @param {string} direction - 'left', 'right', or 'two'
   * @returns {string} HTML representation
   */
  static directionToString(direction) {
    const map = {
      left: '< (izquierda)',
      right: '> (derecha)',
      two: '≠ (bilateral)'
    };
    return map[direction] || direction;
  }

  /**
   * Parse CSV text
   * @param {string} text - CSV text
   * @param {string} separator - Field separator
   * @returns {Object} {headers, rows}
   */
  static parseCSV(text, separator = ',') {
    const lines = text.trim().split('\n');
    const sep = text.includes(';') ? ';' : separator;
    const headers = lines[0]
      .split(sep)
      .map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(l => {
      const vals = l.split(sep).map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, i) => (row[h] = vals[i] || ''));
      return row;
    });
    return { headers, rows };
  }

  /**
   * Show notification
   * @param {string} message - Message to show
   * @param {string} type - 'info', 'success', 'warning', 'error'
   * @param {number} duration - Duration in ms (0 = persistent)
   */
  static notify(message, type = 'info', duration = 3000) {
    const id = `notify-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = `alert alert-${type}`;
    div.style.cssText =
      'position:fixed;top:20px;right:20px;z-index:2000;min-width:300px;max-width:500px;animation:slideIn 0.3s;';
    div.textContent = message;
    document.body.appendChild(div);

    if (duration > 0) {
      setTimeout(() => div.remove(), duration);
    }
    return id;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
