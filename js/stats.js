/**
 * Statistics Engine
 * All statistical calculations and hypothesis tests
 */

class StatisticsEngine {
  constructor() {
    this.cache = new Map();
  }

  // Clear cache when data changes
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get numeric values for a variable
   * @param {Array} data - Raw data array
   * @param {string} varName - Variable name
   * @returns {Array} Numeric values
   */
  getNumericValues(data, varName) {
    const key = `numeric_${varName}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const vals = data
      .map(r => parseFloat(String(r[varName]).replace(',', '.')))
      .filter(v => !isNaN(v));
    
    this.cache.set(key, vals);
    return vals;
  }

  /**
   * Get categorical values for a variable
   * @param {Array} data - Raw data array
   * @param {string} varName - Variable name
   * @returns {Array} Categorical values
   */
  getCategoricalValues(data, varName) {
    const key = `categorical_${varName}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const vals = data
      .map(r => r[varName])
      .filter(v => v !== '' && v !== undefined && v !== null);
    
    this.cache.set(key, vals);
    return vals;
  }

  // ==================== DESCRIPTIVE STATISTICS ====================

  mean(arr) {
    if (!arr?.length) throw new Error('Array vacío');
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  median(arr) {
    if (!arr?.length) throw new Error('Array vacío');
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  mode(arr) {
    if (!arr?.length) throw new Error('Array vacío');
    const freq = {};
    arr.forEach(v => (freq[v] = (freq[v] || 0) + 1));
    const max = Math.max(...Object.values(freq));
    return Object.keys(freq)
      .filter(k => freq[k] === max)
      .map(Number);
  }

  variance(arr, sample = true) {
    if (!arr?.length) throw new Error('Array vacío');
    const m = this.mean(arr);
    const n = sample ? arr.length - 1 : arr.length;
    return arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / n;
  }

  std(arr, sample = true) {
    return Math.sqrt(this.variance(arr, sample));
  }

  coefficientOfVariation(arr) {
    if (!arr?.length) throw new Error('Array vacío');
    const m = this.mean(arr);
    if (m === 0) throw new Error('Media es cero');
    return (this.std(arr) / m) * 100;
  }

  quartiles(arr) {
    if (!arr?.length) throw new Error('Array vacío');
    const sorted = [...arr].sort((a, b) => a - b);
    const n = sorted.length;
    const q1Idx = Math.floor(n * 0.25);
    const q2Idx = Math.floor(n * 0.5);
    const q3Idx = Math.floor(n * 0.75);
    return {
      q1: sorted[q1Idx],
      q2: sorted[q2Idx],
      q3: sorted[q3Idx],
      iqr: sorted[q3Idx] - sorted[q1Idx]
    };
  }

  skewness(arr) {
    if (!arr?.length || arr.length < 3) throw new Error('Datos insuficientes');
    const m = this.mean(arr);
    const s = this.std(arr);
    const n = arr.length;
    const numerator = arr.reduce((sum, v) => sum + Math.pow((v - m) / s, 3), 0);
    return (n / ((n - 1) * (n - 2))) * numerator;
  }

  kurtosis(arr) {
    if (!arr?.length || arr.length < 4) throw new Error('Datos insuficientes');
    const m = this.mean(arr);
    const s = this.std(arr);
    const n = arr.length;
    const numerator = arr.reduce((sum, v) => sum + Math.pow((v - m) / s, 4), 0);
    return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * numerator - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3));
  }

  calcDescriptive(data, varName) {
    const vals = this.getNumericValues(data, varName);
    if (vals.length < 2) return null;

    const n = vals.length;
    const sorted = [...vals].sort((a, b) => a - b);
    const q = this.quartiles(vals);

    return {
      varName,
      n,
      mean: this.mean(vals),
      median: this.median(vals),
      mode: this.mode(vals),
      variance: this.variance(vals),
      std: this.std(vals),
      cv: this.coefficientOfVariation(vals),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      range: sorted[sorted.length - 1] - sorted[0],
      q1: q.q1,
      q3: q.q3,
      iqr: q.iqr,
      skewness: this.skewness(vals),
      kurtosis: this.kurtosis(vals),
      values: vals
    };
  }

  // ==================== FREQUENCY TABLES ====================

  calcFreqTable(data, varName) {
    const vals = this.getNumericValues(data, varName);
    if (vals.length < 2) {
      return this.calcFreqTableCategorical(data, varName);
    }

    const n = vals.length;
    const numClasses = Math.max(5, Math.round(1 + 3.322 * Math.log10(n)));
    const sorted = [...vals].sort((a, b) => a - b);
    const mn = sorted[0];
    const mx = sorted[sorted.length - 1];
    const width = (mx - mn) / numClasses;

    const classes = [];
    for (let i = 0; i < numClasses; i++) {
      const lo = mn + i * width;
      const hi = lo + width;
      const isLast = i === numClasses - 1;
      const freq = vals.filter(v => (isLast ? v >= lo && v <= hi : v >= lo && v < hi)).length;
      classes.push({ lo, hi, freq });
    }

    let cumFreq = 0;
    return classes.map(c => {
      cumFreq += c.freq;
      const relFreq = c.freq / n;
      const cumRel = cumFreq / n;
      return {
        clase: `[${c.lo.toFixed(2)}, ${c.hi.toFixed(2)})`,
        fa: c.freq,
        fr: relFreq,
        fac: cumFreq,
        frc: cumRel,
        pct: relFreq * 100,
        pctAcum: cumRel * 100,
        midpoint: (c.lo + c.hi) / 2,
        lo: c.lo,
        hi: c.hi
      };
    });
  }

  calcFreqTableCategorical(data, varName) {
    const vals = this.getCategoricalValues(data, varName);
    const n = vals.length;
    if (n === 0) throw new Error('Sin datos');

    const freq = {};
    vals.forEach(v => (freq[v] = (freq[v] || 0) + 1));
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

    let cumFreq = 0;
    return sorted.map(([k, f]) => {
      cumFreq += f;
      const relFreq = f / n;
      const cumRel = cumFreq / n;
      return {
        clase: k,
        fa: f,
        fr: relFreq,
        fac: cumFreq,
        frc: cumRel,
        pct: relFreq * 100,
        pctAcum: cumRel * 100
      };
    });
  }

  // ==================== NORMAL DISTRIBUTION ====================

  normalCDF(z) {
    // Abramowitz & Stegun approximation
    const a1 = 0.31938153;
    const a2 = -0.356563782;
    const a3 = 1.781477937;
    const a4 = -1.821255978;
    const a5 = 1.330274429;
    const L = Math.abs(z);
    const k = 1 / (1 + 0.2316419 * L);
    const w =
      1 -
      (1 / Math.sqrt(2 * Math.PI)) *
        Math.exp(-((L * L) / 2)) *
        (a1 * k +
          a2 * k * k +
          a3 * k * k * k +
          a4 * k * k * k * k +
          a5 * k * k * k * k * k);
    return z < 0 ? 1 - w : w;
  }

  zScore(x, mu, sigma) {
    if (sigma === 0) throw new Error('Desviación estándar es cero');
    return (x - mu) / sigma;
  }

  // ==================== CRITICAL VALUES ====================

  tCritical(alpha, df, twoTailed = true) {
    try {
      return jStat.studentt.inv(twoTailed ? 1 - alpha / 2 : 1 - alpha, df);
    } catch (e) {
      console.warn('Error calculando t-crítico, usando aproximación Z');
      return 1.96;
    }
  }

  chiCritical(alpha, df) {
    try {
      return jStat.chisquare.inv(1 - alpha, df);
    } catch (e) {
      console.warn('Error calculando chi-crítico');
      return 3.84;
    }
  }

  // ==================== CONFIDENCE INTERVALS ====================

  calcCI_mean(data, varName, alpha) {
    const stats = this.calcDescriptive(data, varName);
    if (!stats) throw new Error('Datos insuficientes');

    const { n, mean: mu, std: s } = stats;
    const se = s / Math.sqrt(n);
    let z, critical, formula;

    if (n >= 30) {
      z = this.tCritical(alpha, 10000);
      formula = 'IC = x̄ ± Z(α/2) · (s/√n)';
      critical = `Z(${(alpha / 2).toFixed(4)}) = ${z.toFixed(4)}`;
    } else {
      z = this.tCritical(alpha, n - 1);
      formula = 'IC = x̄ ± t(α/2, n-1) · (s/√n)';
      critical = `t(${(alpha / 2).toFixed(4)}, ${n - 1}) = ${z.toFixed(4)}`;
    }

    const margin = z * se;
    const lo = mu - margin;
    const hi = mu + margin;

    return {
      type: 'Media',
      varName,
      formula,
      substitution: `IC = ${mu.toFixed(4)} ± ${z.toFixed(4)} · (${s.toFixed(4)}/√${n})`,
      development: `IC = ${mu.toFixed(4)} ± ${z.toFixed(4)} · ${se.toFixed(4)} = ${mu.toFixed(4)} ± ${margin.toFixed(4)}`,
      lo,
      hi,
      critical,
      n,
      mu,
      se,
      result: `[${lo.toFixed(4)}, ${hi.toFixed(4)}]`,
      interpretation: `Con un ${((1 - alpha) * 100).toFixed(0)}% de confianza, el verdadero promedio de ${varName} se encuentra entre ${lo.toFixed(2)} y ${hi.toFixed(2)}.`,
      conclusion: `Se estima con ${((1 - alpha) * 100).toFixed(0)}% de confianza que la media poblacional de "${varName}" está en el intervalo [${lo.toFixed(2)}, ${hi.toFixed(2)}].`
    };
  }

  calcCI_proportion(data, varName, groupValue, alpha) {
    const vals = this.getCategoricalValues(data, varName);
    const n = vals.length;
    if (n === 0) throw new Error('Sin datos');

    const x = vals.filter(v => String(v) === String(groupValue)).length;
    const p = x / n;
    const z = this.tCritical(alpha, 10000);
    const se = Math.sqrt((p * (1 - p)) / n);
    const margin = z * se;
    const lo = Math.max(0, p - margin);
    const hi = Math.min(1, p + margin);

    return {
      type: 'Proporción',
      varName,
      groupValue,
      n,
      x,
      p,
      formula: 'IC = p̂ ± Z(α/2) · √(p̂·q̂/n)',
      substitution: `IC = ${p.toFixed(4)} ± ${z.toFixed(4)} · √(${p.toFixed(4)}·${(1 - p).toFixed(4)}/${n})`,
      development: `IC = ${p.toFixed(4)} ± ${z.toFixed(4)} · ${se.toFixed(4)} = ${p.toFixed(4)} ± ${margin.toFixed(4)}`,
      lo,
      hi,
      se,
      result: `[${(lo * 100).toFixed(2)}%, ${(hi * 100).toFixed(2)}%]`,
      interpretation: `Con ${((1 - alpha) * 100).toFixed(0)}% de confianza, la verdadera proporción de "${groupValue}" en ${varName} está entre ${(lo * 100).toFixed(1)}% y ${(hi * 100).toFixed(1)}%.`,
      conclusion: `La proporción estimada de ${groupValue} es ${(p * 100).toFixed(1)}% con IC al ${((1 - alpha) * 100).toFixed(0)}%: [${(lo * 100).toFixed(2)}%, ${(hi * 100).toFixed(2)}%].`
    };
  }

  calcCI_variance(data, varName, alpha) {
    const stats = this.calcDescriptive(data, varName);
    if (!stats) throw new Error('Datos insuficientes');

    const { n, variance: v2 } = stats;
    const df = n - 1;

    try {
      const chi_upper = jStat.chisquare.inv(1 - alpha / 2, df);
      const chi_lower = jStat.chisquare.inv(alpha / 2, df);
      const lo = (df * v2) / chi_upper;
      const hi = (df * v2) / chi_lower;

      return {
        type: 'Varianza',
        varName,
        n,
        variance: v2,
        df,
        formula: 'IC_σ² = [(n-1)s²/χ²(α/2), (n-1)s²/χ²(1-α/2)]',
        substitution: `IC = [(${df})·${v2.toFixed(4)}/χ²(${(alpha / 2).toFixed(4)},${df}), (${df})·${v2.toFixed(4)}/χ²(${(1 - alpha / 2).toFixed(4)},${df})]`,
        development: `IC = [${(df * v2).toFixed(4)}/${chi_upper.toFixed(4)}, ${(df * v2).toFixed(4)}/${chi_lower.toFixed(4)}]`,
        lo,
        hi,
        chi_upper,
        chi_lower,
        result: `[${lo.toFixed(4)}, ${hi.toFixed(4)}]`,
        interpretation: `Con ${((1 - alpha) * 100).toFixed(0)}% de confianza, la varianza poblacional de "${varName}" está entre ${lo.toFixed(4)} y ${hi.toFixed(4)}.`,
        conclusion: `IC para σ² de "${varName}" al ${((1 - alpha) * 100).toFixed(0)}%: [${lo.toFixed(2)}, ${hi.toFixed(2)}]. Desviación estándar estimada: [${Math.sqrt(lo).toFixed(2)}, ${Math.sqrt(hi).toFixed(2)}].`
      };
    } catch (e) {
      throw new Error('Error calculando IC para varianza: ' + e.message);
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatisticsEngine;
}
