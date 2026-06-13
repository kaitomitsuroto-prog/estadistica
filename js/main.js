/**
 * Main Application
 * Orchestrates all modules and handles file loading
 */

class StatAcademia {
  constructor() {
    this.ui = new UIManager();
    this.stats = new StatisticsEngine();
    this.charts = new ChartsManager();
    this.export = new ExportManager();
  }

  // ==================== INITIALIZATION ====================

  init() {
    this.attachEventListeners();
    console.log('StatAcademia initialized');
  }

  attachEventListeners() {
    // File upload
    const uploadZone = document.getElementById('upload-zone');
    if (uploadZone) {
      uploadZone.addEventListener('dragover', e => this.handleDragOver(e));
      uploadZone.addEventListener('dragleave', e => this.handleDragLeave(e));
      uploadZone.addEventListener('drop', e => this.handleDrop(e));
      uploadZone.addEventListener('click', () => document.getElementById('file-input').click());
    }

    // Alpha selector
    const alphaSelect = document.getElementById('alpha-global');
    if (alphaSelect) {
      alphaSelect.addEventListener('change', () => this.ui.updateAlpha());
    }
  }

  // ==================== FILE LOADING ====================

  handleDragOver(e) {
    e.preventDefault();
    document.getElementById('upload-zone')?.classList.add('drag');
  }

  handleDragLeave() {
    document.getElementById('upload-zone')?.classList.remove('drag');
  }

  handleDrop(e) {
    e.preventDefault();
    this.handleDragLeave();
    if (e.dataTransfer.files.length > 0) {
      this.loadFile(e.dataTransfer.files[0]);
    }
  }

  loadFile(file) {
    if (!file) return;

    this.ui.showLoading('Cargando archivo...');
    const ext = file.name.split('.').pop().toLowerCase();

    const reader = new FileReader();
    reader.onload = e => {
      try {
        if (ext === 'csv') {
          this.parseCSV(e.target.result);
        } else if (ext === 'xlsx' || ext === 'xls') {
          this.parseExcel(e.target.result);
        } else {
          throw new Error('Formato de archivo no soportado');
        }
        this.ui.hideLoading();
      } catch (err) {
        this.ui.showError('run-error', 'Error cargando archivo: ' + err.message);
        this.ui.hideLoading();
      }
    };

    if (ext === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  parseCSV(text) {
    const parsed = Utils.parseCSV(text);
    this.processData(parsed.headers, parsed.rows);
  }

  parseExcel(buffer) {
    try {
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const headers = raw[0].map(h => String(h || '').trim());
      const rows = raw
        .slice(1)
        .map(r => {
          const row = {};
          headers.forEach((h, i) => {
            row[h] = r[i] !== undefined ? String(r[i]) : '';
          });
          return row;
        })
        .filter(r => Object.values(r).some(v => v !== ''));

      this.processData(headers, rows);
    } catch (err) {
      throw new Error('Error parsing Excel: ' + err.message);
    }
  }

  processData(headers, rows) {
    this.ui.state.headers = headers;
    this.ui.state.data = rows;
    this.ui.state.numericVars = [];
    this.ui.state.categoricalVars = [];
    this.stats.clearCache();

    headers.forEach(h => {
      const values = rows.map(r => r[h]);
      if (Utils.isNumeric(values)) {
        this.ui.state.numericVars.push(h);
      } else {
        this.ui.state.categoricalVars.push(h);
      }
    });

    this.ui.updateDataStatus(
      rows.length,
      headers.length,
      this.ui.state.numericVars.length,
      this.ui.state.categoricalVars.length
    );

    this.ui.renderDataPreview(
      rows,
      headers,
      this.ui.state.numericVars,
      this.ui.state.categoricalVars
    );
  }

  // ==================== ANALYSIS ====================

  runFullAnalysis() {
    try {
      Utils.validateData(this.ui.state.data);

      this.ui.showLoading('Ejecutando análisis completo...');

      // Calculate all statistics
      this.ui.state.results = {};

      // Descriptive statistics
      this.ui.state.results.descriptive = {};
      this.ui.state.numericVars.forEach(varName => {
        this.ui.state.results.descriptive[varName] = this.stats.calcDescriptive(
          this.ui.state.data,
          varName
        );
      });

      // Frequency tables
      this.ui.state.results.frequencies = {};
      this.ui.state.headers.forEach(varName => {
        try {
          this.ui.state.results.frequencies[varName] = this.stats.calcFreqTable(
            this.ui.state.data,
            varName
          );
        } catch (e) {
          console.warn(`Error calculando frecuencias para ${varName}:`, e);
        }
      });

      // Confidence intervals
      this.ui.state.results.confidenceIntervals = [];
      this.ui.state.numericVars.forEach(varName => {
        try {
          const ci = this.stats.calcCI_mean(this.ui.state.data, varName, this.ui.state.alpha);
          this.ui.state.results.confidenceIntervals.push(ci);
        } catch (e) {
          console.warn(`Error calculando IC para ${varName}:`, e);
        }
      });

      this.export.setData(this.ui.state.results);
      this.ui.hideLoading();

      Utils.notify('Análisis completado exitosamente', 'success');
      this.ui.showPage('descriptivo');
    } catch (err) {
      this.ui.showError('run-error', err.message);
      this.ui.hideLoading();
    }
  }
}

// ==================== GLOBAL INSTANCE ====================
let app;

document.addEventListener('DOMContentLoaded', () => {
  app = new StatAcademia();
  app.init();
});

// Expose some functions to global scope for inline handlers
window.showPage = page => app?.ui.showPage(page);
window.runFullAnalysis = () => app?.runFullAnalysis();
window.exportPDF = () => app?.export.exportPDF();
window.exportWord = () => app?.export.exportWord();
