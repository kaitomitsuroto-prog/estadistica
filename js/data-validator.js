/**
 * Data Validation Module
 * Comprehensive data quality checks, outlier detection, and missing value handling
 */

class DataValidator {
  constructor() {
    this.validationRules = [];
    this.report = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {}
    };
  }

  /**
   * Comprehensive data validation
   * @param {Array} data - Data rows
   * @param {Array} headers - Column headers
   * @returns {Object} Validation report
   */
  validate(data, headers) {
    this.report = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {}
    };

    // Basic checks
    this.checkEmptyData(data, headers);
    this.checkDuplicateHeaders(headers);

    if (this.report.errors.length > 0) {
      this.report.isValid = false;
      return this.report;
    }

    // Column-level checks
    headers.forEach(header => {
      this.validateColumn(data, header);
    });

    // Determine final validity
    this.report.isValid = this.report.errors.length === 0;

    return this.report;
  }

  /**
   * Check for empty data
   */
  checkEmptyData(data, headers) {
    if (!data || data.length === 0) {
      this.report.errors.push('Dataset vacío: no hay filas de datos');
    }

    if (!headers || headers.length === 0) {
      this.report.errors.push('Sin encabezados: no hay columnas definidas');
    }
  }

  /**
   * Check for duplicate column headers
   */
  checkDuplicateHeaders(headers) {
    const seen = new Set();
    const duplicates = [];

    headers.forEach(h => {
      if (seen.has(h)) {
        duplicates.push(h);
      }
      seen.add(h);
    });

    if (duplicates.length > 0) {
      this.report.errors.push(
        `Encabezados duplicados: ${duplicates.join(', ')}`
      );
    }
  }

  /**
   * Validate individual column
   */
  validateColumn(data, columnName) {
    const values = data.map(r => r[columnName]);
    const nonEmptyValues = values.filter(v => v !== '' && v !== null && v !== undefined);

    // Check if column is empty
    if (nonEmptyValues.length === 0) {
      this.report.warnings.push(`Columna '${columnName}' está completamente vacía`);
      return;
    }

    // Check for missing values
    const missingInfo = this.detectMissing(values);
    if (missingInfo.hasMissing) {
      this.report.warnings.push(
        `Columna '${columnName}': ${missingInfo.count} valores faltantes (${missingInfo.percentage.toFixed(1)}%)`
      );
    }

    // Check data type consistency
    const typeInfo = this.analyzeDataTypes(nonEmptyValues);
    if (typeInfo.inconsistent) {
      this.report.warnings.push(
        `Columna '${columnName}': tipos de datos mixtos - ${typeInfo.types.join(', ')}`
      );
    }

    // For numeric columns, check for outliers
    if (typeInfo.isNumeric) {
      this.validateNumericColumn(data, columnName, nonEmptyValues);
    }

    // Store summary
    this.report.summary[columnName] = {
      totalValues: values.length,
      nonEmptyValues: nonEmptyValues.length,
      missingValues: missingInfo.count,
      missingPercent: missingInfo.percentage,
      dataTypes: typeInfo.types,
      isNumeric: typeInfo.isNumeric
    };
  }

  /**
   * Validate numeric column
   */
  validateNumericColumn(data, columnName, values) {
    const numericValues = values
      .map(v => parseFloat(String(v).replace(',', '.')))
      .filter(v => !isNaN(v));

    // Check for extreme values
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const range = max - min;

    if (range === 0) {
      this.report.warnings.push(
        `Columna '${columnName}': todos los valores son idénticos`
      );
    }

    // Detect outliers
    const outliers = this.detectOutliers(numericValues);
    if (outliers.length > 0) {
      const outlierPercent = (outliers.length / numericValues.length) * 100;
      if (outlierPercent > 10) {
        this.report.warnings.push(
          `Columna '${columnName}': ${outliers.length} posibles outliers (${outlierPercent.toFixed(1)}%)`
        );
      }
    }

    // Check for infinite or NaN values
    const invalidValues = values.filter(
      v => !isFinite(parseFloat(v))
    ).length;
    if (invalidValues > 0) {
      this.report.errors.push(
        `Columna '${columnName}': contiene valores infinitos o inválidos`
      );
    }
  }

  /**
   * Detect missing values (NA, N/A, empty, null)
   * @param {Array} values - Column values
   * @returns {Object} Missing value info
   */
  detectMissing(values) {
    const missing = values.filter(
      v => v === '' || v === null || v === undefined ||
           String(v).toUpperCase() === 'NA' ||
           String(v).toUpperCase() === 'N/A' ||
           String(v).toUpperCase() === 'NULL'
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
  detectOutliers(values) {
    if (values.length < 4) return [];

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
   * Analyze data types in a column
   * @param {Array} values - Non-empty values
   * @returns {Object} Type analysis
   */
  analyzeDataTypes(values) {
    const types = new Set();
    let numericCount = 0;
    let dateCount = 0;
    let textCount = 0;

    values.forEach(v => {
      const strVal = String(v).trim();

      // Check if numeric
      const numVal = parseFloat(strVal.replace(',', '.'));
      if (!isNaN(numVal) && numVal.toString() === strVal.replace(',', '.')) {
        types.add('numeric');
        numericCount++;
      }
      // Check if date (ISO format)
      else if (/^\d{4}-\d{2}-\d{2}/.test(strVal)) {
        types.add('date');
        dateCount++;
      }
      // Otherwise text
      else {
        types.add('text');
        textCount++;
      }
    });

    const total = values.length;
    const isNumeric = numericCount / total > 0.6;
    const inconsistent = types.size > 1 && !isNumeric;

    return {
      types: Array.from(types),
      isNumeric,
      inconsistent,
      distribution: { numeric: numericCount, date: dateCount, text: textCount }
    };
  }

  /**
   * Check for duplicate rows
   * @param {Array} data - Data rows
   * @returns {Object} Duplicate report
   */
  findDuplicates(data) {
    const seen = new Set();
    const duplicates = [];

    data.forEach((row, idx) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        duplicates.push(idx);
      }
      seen.add(key);
    });

    return {
      hasDuplicates: duplicates.length > 0,
      count: duplicates.length,
      percentage: (duplicates.length / data.length) * 100,
      indices: duplicates
    };
  }

  /**
   * Get data quality score (0-100)
   * @param {Object} report - Validation report
   * @returns {number} Quality score
   */
  getQualityScore(report) {
    if (!report.summary) return 0;

    const columns = Object.values(report.summary);
    if (columns.length === 0) return 0;

    let totalScore = 0;
    columns.forEach(col => {
      const missingScore = Math.max(0, 100 - col.missingPercent * 10);
      const typeScore = col.dataTypes.length === 1 ? 100 : 50;
      const colScore = (missingScore + typeScore) / 2;
      totalScore += colScore;
    });

    return Math.round(totalScore / columns.length);
  }

  /**
   * Generate HTML report of validation
   * @param {Object} report - Validation report
   * @returns {string} HTML report
   */
  generateHTMLReport(report) {
    let html = `<div class="card">
      <h3>📋 Reporte de Validación de Datos</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Estado General</div>
          <div class="stat-val" style="color:${report.isValid ? 'var(--green)' : 'var(--red)'}">
            ${report.isValid ? '✓ Válido' : '✗ Inválido'}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Calidad de Datos</div>
          <div class="stat-val">${this.getQualityScore(report)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Errores</div>
          <div class="stat-val" style="color:${report.errors.length > 0 ? 'var(--red)' : 'var(--green)'}">${report.errors.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Advertencias</div>
          <div class="stat-val" style="color:${report.warnings.length > 0 ? 'var(--orange)' : 'var(--green)'}">${report.warnings.length}</div>
        </div>
      </div>`

    if (report.errors.length > 0) {
      html += `<div class="alert alert-error">
        <strong>Errores Críticos:</strong>
        <ul style="margin-top:8px">
          ${report.errors.map(e => `<li>${e}</li>`).join('')}
        </ul>
      </div>`;
    }

    if (report.warnings.length > 0) {
      html += `<div class="alert alert-warn">
        <strong>Advertencias:</strong>
        <ul style="margin-top:8px">
          ${report.warnings.map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>`;
    }

    if (report.summary && Object.keys(report.summary).length > 0) {
      html += `<div style="margin-top:16px">
        <h4>Resumen por Columna</h4>
        <div class="table-wrap"><table>
          <thead><tr>
            <th>Columna</th>
            <th>Total</th>
            <th>Válidos</th>
            <th>Faltantes</th>
            <th>Tipo(s)</th>
          </tr></thead>
          <tbody>`;

      Object.entries(report.summary).forEach(([colName, info]) => {
        html += `<tr>
          <td><strong>${colName}</strong></td>
          <td>${info.totalValues}</td>
          <td>${info.nonEmptyValues}</td>
          <td>${info.missingValues} (${info.missingPercent.toFixed(1)}%)</td>
          <td>${info.dataTypes.join(', ')}</td>
        </tr>`;
      });

      html += `</tbody></table></div></div>`;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Suggest data cleaning actions
   * @param {Object} report - Validation report
   * @returns {Array} List of suggestions
   */
  suggestActions(report) {
    const suggestions = [];

    report.errors.forEach(err => {
      if (err.includes('vacío')) {
        suggestions.push('Verifique que haya datos válidos en el archivo');
      }
      if (err.includes('duplicados')) {
        suggestions.push('Considere eliminar encabezados duplicados');
      }
      if (err.includes('infinitos')) {
        suggestions.push('Revise y corrija valores infinitos o inválidos');
      }
    });

    report.warnings.forEach(warn => {
      if (warn.includes('faltantes')) {
        suggestions.push('Considere imputar valores faltantes o excluir esas filas');
      }
      if (warn.includes('outliers')) {
        suggestions.push('Revise los posibles outliers antes del análisis');
      }
      if (warn.includes('mixtos')) {
        suggestions.push('Asegúrese de que los tipos de datos sean consistentes');
      }
      if (warn.includes('idénticos')) {
        suggestions.push('Columnas con valores constantes no aportarán información útil');
      }
    });

    return suggestions;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataValidator;
}
