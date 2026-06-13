/**
 * Export Manager
 * PDF and Word export functionality
 */

class ExportManager {
  constructor() {
    this.data = null;
    this.results = null;
  }

  /**
   * Set data for export
   * @param {Object} data - Analysis data and results
   */
  setData(data) {
    this.data = data;
  }

  /**
   * Generate PDF report
   * Note: Requires jsPDF library
   */
  exportPDF() {
    if (!this.data) {
      Utils.notify('Sin datos para exportar', 'error');
      return;
    }

    // Placeholder for PDF generation
    // In production, use jsPDF or similar library
    console.log('PDF export', this.data);
    Utils.notify('Exportación a PDF no implementada aún', 'warning');
  }

  /**
   * Generate Word document
   * Note: Requires docx library
   */
  exportWord() {
    if (!this.data) {
      Utils.notify('Sin datos para exportar', 'error');
      return;
    }

    // Placeholder for Word generation
    // In production, use docx or similar library
    console.log('Word export', this.data);
    Utils.notify('Exportación a Word no implementada aún', 'warning');
  }

  /**
   * Generate HTML report
   * @returns {string} HTML content
   */
  generateHTMLReport() {
    if (!this.data) {
      return '<p>Sin datos</p>';
    }

    let html = `<div class="report-section">
      <h1>Reporte de Análisis Estadístico</h1>
      <p>Generado: ${new Date().toLocaleString()}</p>
    </div>`;

    // Add sections based on available results
    if (this.data.descriptive) {
      html += this.generateDescriptiveSection();
    }

    if (this.data.frequencies) {
      html += this.generateFrequencySection();
    }

    return html;
  }

  /**
   * Generate descriptive statistics section
   * @returns {string} HTML
   */
  generateDescriptiveSection() {
    let html = `<div class="report-section">
      <h2>Estadística Descriptiva</h2>`;

    if (this.data.descriptive) {
      Object.values(this.data.descriptive).forEach(stats => {
        if (!stats) return;
        html += `
          <div class="card">
            <h3>${stats.varName}</h3>
            <table class="table-wrap">
              <tr><td>N</td><td>${stats.n}</td></tr>
              <tr><td>Media</td><td>${Utils.fmtStr(stats.mean)}</td></tr>
              <tr><td>Mediana</td><td>${Utils.fmtStr(stats.median)}</td></tr>
              <tr><td>Desv. Est.</td><td>${Utils.fmtStr(stats.std)}</td></tr>
              <tr><td>Mín</td><td>${Utils.fmtStr(stats.min)}</td></tr>
              <tr><td>Máx</td><td>${Utils.fmtStr(stats.max)}</td></tr>
            </table>
          </div>
        `;
      });
    }

    html += `</div>`;
    return html;
  }

  /**
   * Generate frequency section
   * @returns {string} HTML
   */
  generateFrequencySection() {
    let html = `<div class="report-section">
      <h2>Tablas de Frecuencia</h2>`;

    if (this.data.frequencies) {
      Object.entries(this.data.frequencies).forEach(([varName, freqTable]) => {
        if (!Array.isArray(freqTable) || freqTable.length === 0) return;

        html += `
          <div class="card">
            <h3>${varName}</h3>
            <table class="table-wrap">
              <thead>
                <tr>
                  <th>Clase</th>
                  <th>fa</th>
                  <th>fr</th>
                  <th>fac</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
        `;

        freqTable.forEach(f => {
          html += `
            <tr>
              <td>${f.clase}</td>
              <td>${f.fa}</td>
              <td>${Utils.fmtStr(f.fr, 4)}</td>
              <td>${f.fac}</td>
              <td>${Utils.fmtStr(f.pct, 2)}%</td>
            </tr>
          `;
        });

        html += `
              </tbody>
            </table>
          </div>
        `;
      });
    }

    html += `</div>`;
    return html;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportManager;
}
