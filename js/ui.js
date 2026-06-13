/**
 * UI Manager
 * DOM manipulation, navigation, and event handling
 */

class UIManager {
  constructor() {
    this.currentPage = 'config';
    this.state = {
      data: null,
      headers: [],
      numericVars: [],
      categoricalVars: [],
      alpha: 0.05,
      objectives: '',
      hypotheses: [],
      results: {}
    };
  }

  /**
   * Show a specific page
   * @param {string} page - Page name
   */
  showPage(page) {
    document.querySelectorAll('.tab-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

    const contentEl = document.getElementById('page-' + page);
    if (contentEl) {
      contentEl.classList.add('active');
      this.currentPage = page;
    }

    const navEl = document.getElementById('nav-' + page);
    if (navEl) {
      navEl.classList.add('active');
    } else {
      document.querySelector('.nav-item').classList.add('active');
    }
  }

  /**
   * Update alpha significance level
   */
  updateAlpha() {
    this.state.alpha = parseFloat(document.getElementById('alpha-global').value);
  }

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoading(message = 'Procesando...') {
    const loading = document.getElementById('loading');
    const text = document.getElementById('loading-text');
    if (loading && text) {
      text.textContent = message;
      loading.classList.add('show');
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('show');
    }
  }

  /**
   * Update data status indicator
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @param {number} numeric - Number of numeric variables
   * @param {number} categorical - Number of categorical variables
   */
  updateDataStatus(rows, cols, numeric, categorical) {
    const el = document.getElementById('data-status');
    if (el) {
      el.innerHTML = `
        <strong style="color:var(--green)">${rows}</strong> filas × <strong style="color:var(--blue)">${cols}</strong> variables<br>
        <span style="color:var(--text3)">Numéricas: ${numeric} | Cat: ${categorical}</span>
      `;
    }
  }

  /**
   * Render data preview table
   * @param {Array} data - Data rows
   * @param {Array} headers - Column headers
   * @param {Array} numericVars - Numeric variable names
   * @param {Array} categoricalVars - Categorical variable names
   */
  renderDataPreview(data, headers, numericVars, categoricalVars) {
    const maxRows = 8;
    const maxCols = 8;
    const displayHeaders = headers.slice(0, maxCols);

    let html = `<div class="table-wrap"><table>
      <thead><tr>${displayHeaders.map(h => `<th>${h}</th>`).join('')}${headers.length > maxCols ? '<th>...</th>' : ''}
      </tr></thead><tbody>`;

    data.slice(0, maxRows).forEach(row => {
      html +=
        '<tr>' +
        displayHeaders.map(h => `<td>${row[h] || ''}</td>`).join('') +
        (headers.length > maxCols ? '<td>...</td>' : '') +
        '</tr>';
    });

    html += `</tbody></table></div>`;

    if (data.length > maxRows) {
      html += `<div style="font-size:12px;color:var(--text3);margin-top:8px;text-align:center">Mostrando ${maxRows} de ${data.length} filas</div>`;
    }

    html += `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">`;
    numericVars.forEach(v => (html += `<span class="tag tag-blue">📊 ${v}</span>`));
    categoricalVars.forEach(v => (html += `<span class="tag tag-purple">🏷 ${v}</span>`));
    html += `</div>`;

    document.getElementById('data-preview').innerHTML = html;
  }

  /**
   * Toggle manual data input visibility
   */
  toggleManualInput() {
    const el = document.getElementById('manual-input');
    if (el) {
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * Add hypothesis field
   * @param {number} index - Hypothesis index
   */
  addHypothesis(index) {
    const container = document.getElementById('hypotheses-container');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'hypothesis-row';
    div.id = `hyp-${index}`;
    div.innerHTML = `
      <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:12px">
        <span style="background:rgba(110,64,201,0.2);color:var(--purple);padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap">H${index + 1}</span>
        <textarea class="textarea" placeholder="Ingrese hipótesis..." style="min-height:60px"></textarea>
      </div>`;
    container.appendChild(div);
  }

  /**
   * Remove last hypothesis
   */
  removeHypothesis(index) {
    const el = document.getElementById(`hyp-${index}`);
    if (el) el.remove();
  }

  /**
   * Get all hypothesis texts
   * @returns {Array} Hypothesis texts
   */
  getHypotheses() {
    const rows = document.querySelectorAll('.hypothesis-row');
    return Array.from(rows)
      .map(r => r.querySelector('textarea')?.value.trim())
      .filter(h => h && h.length > 0);
  }

  /**
   * Get objectives text
   * @returns {string} Objectives
   */
  getObjectives() {
    const el = document.getElementById('objectives');
    return el ? el.value.trim() : '';
  }

  /**
   * Show error message
   * @param {string} containerId - Container ID
   * @param {string} message - Error message
   */
  showError(containerId, message) {
    const el = document.getElementById(containerId);
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
      setTimeout(() => {
        el.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Create a stat card HTML
   * @param {string} label - Label
   * @param {number} value - Value
   * @param {string} interpretation - Interpretation text
   * @returns {string} HTML
   */
  createStatCard(label, value, interpretation = '') {
    return `
      <div class="stat-card">
        <div class="stat-label">${label}</div>
        <div class="stat-val">${Utils.fmtStr(value)}</div>
        ${interpretation ? `<div class="stat-interp">${interpretation}</div>` : ''}
      </div>
    `;
  }

  /**
   * Create a math box HTML
   * @param {string} formula - Formula
   * @param {Array} steps - Calculation steps
   * @param {string} result - Final result
   * @returns {string} HTML
   */
  createMathBox(formula, steps, result) {
    let html = `<div class="math-box">`;
    html += `<div class="math-label">Fórmula</div>`;
    html += `<div class="math-formula">${formula}</div>`;
    if (steps.length > 0) {
      html += `<div class="math-label">Pasos</div>`;
      steps.forEach((step, i) => {
        html += `<div class="math-step"><span>${i + 1}.</span> ${step}</div>`;
      });
    }
    html += `<div class="math-result">${result}</div>`;
    html += `</div>`;
    return html;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}
