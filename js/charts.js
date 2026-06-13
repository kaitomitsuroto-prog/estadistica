/**
 * Charts Manager
 * All visualization logic using Chart.js
 */

class ChartsManager {
  constructor() {
    this.instances = {};
  }

  /**
   * Create histogram
   * @param {string} containerId - Container element ID
   * @param {Array} freqTable - Frequency table data
   * @param {string} varName - Variable name
   */
  createHistogram(containerId, freqTable, varName) {
    const ctx = document.getElementById(containerId)?.getContext('2d');
    if (!ctx) return;

    if (this.instances[containerId]) {
      this.instances[containerId].destroy();
    }

    const labels = freqTable.map(f => f.clase);
    const data = freqTable.map(f => f.fa);

    this.instances[containerId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Frecuencia Absoluta',
            data,
            backgroundColor: 'var(--blue)',
            borderColor: 'var(--blue2)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: `Histograma de ${varName}`
          },
          legend: { display: true }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Frecuencia' }
          },
          x: {
            title: { display: true, text: varName }
          }
        }
      }
    });
  }

  /**
   * Create box plot
   * @param {string} containerId - Container element ID
   * @param {Object} stats - Descriptive statistics
   * @param {string} varName - Variable name
   */
  createBoxPlot(containerId, stats, varName) {
    const ctx = document.getElementById(containerId)?.getContext('2d');
    if (!ctx) return;

    if (this.instances[containerId]) {
      this.instances[containerId].destroy();
    }

    // Simple box plot visualization
    const { min, q1, median: q2, q3, max } = stats;
    const width = max - min;

    this.instances[containerId] = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Min-Max',
            data: [{ x: min, y: 0 }, { x: max, y: 0 }],
            showLine: true,
            borderColor: 'var(--blue)',
            backgroundColor: 'transparent'
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: `Diagrama de Caja - ${varName}`
          }
        },
        scales: {
          x: {
            min: min - width * 0.1,
            max: max + width * 0.1
          }
        }
      }
    });
  }

  /**
   * Create frequency bar chart for categorical data
   * @param {string} containerId - Container element ID
   * @param {Array} freqTable - Frequency table data
   * @param {string} varName - Variable name
   */
  createFrequencyChart(containerId, freqTable, varName) {
    const ctx = document.getElementById(containerId)?.getContext('2d');
    if (!ctx) return;

    if (this.instances[containerId]) {
      this.instances[containerId].destroy();
    }

    const labels = freqTable.map(f => f.clase);
    const data = freqTable.map(f => f.fa);

    this.instances[containerId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Frecuencia',
            data,
            backgroundColor: 'var(--purple)',
            borderColor: 'var(--purple2)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: `Distribución de ${varName}`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Frecuencia' }
          }
        }
      }
    });
  }

  /**
   * Create Q-Q plot for normality test
   * @param {string} containerId - Container element ID
   * @param {Array} values - Data values
   * @param {string} varName - Variable name
   */
  createQQPlot(containerId, values, varName) {
    const ctx = document.getElementById(containerId)?.getContext('2d');
    if (!ctx) return;

    if (this.instances[containerId]) {
      this.instances[containerId].destroy();
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const data = sorted.map((v, i) => ({
      x: (i + 1) / (n + 1),
      y: v
    }));

    this.instances[containerId] = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Datos',
            data,
            backgroundColor: 'var(--blue)',
            borderColor: 'transparent'
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: `Q-Q Plot - ${varName}`
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Cuantiles Teóricos' }
          },
          y: {
            title: { display: true, text: 'Cuantiles Observados' }
          }
        }
      }
    });
  }

  /**
   * Destroy all chart instances
   */
  destroyAll() {
    Object.values(this.instances).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.instances = {};
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartsManager;
}
