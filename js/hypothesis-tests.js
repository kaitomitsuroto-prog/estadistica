/**
 * Hypothesis Tests - Non-parametric and Normality Tests
 * Mann-Whitney, Wilcoxon, Kruskal-Wallis, Shapiro-Wilk, K-S
 */

class HypothesisTests {
  constructor(statsEngine) {
    this.stats = statsEngine;
  }

  // ==================== NORMALITY TESTS ====================

  /**
   * Shapiro-Wilk Test for Normality (n ≤ 5000)
   * @param {Array} values - Data values
   * @returns {Object} Test result {statistic, pValue, isNormal, conclusion}
   */
  shapiroWilkTest(values) {
    if (values.length < 3) {
      throw new Error('Se requieren al menos 3 datos para Shapiro-Wilk');
    }
    if (values.length > 5000) {
      throw new Error('Shapiro-Wilk no es práctico para n > 5000');
    }

    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);

    // Calculate mean and variance
    const mean = this.stats.mean(sorted);
    const sd = this.stats.std(sorted);

    // Coefficients for Shapiro-Wilk test
    const a = this.getShapiroWilkCoefficients(n);

    // Calculate W statistic
    let numerator = 0;
    for (let i = 0; i < Math.floor(n / 2); i++) {
      const diff = sorted[n - 1 - i] - sorted[i];
      numerator += a[i] * diff;
    }

    const denominator = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
    const W = (numerator * numerator) / denominator;

    // Calculate p-value (approximation)
    const pValue = this.approximateShapiroWilkPValue(W, n);

    return {
      test: 'Shapiro-Wilk',
      statistic: W,
      pValue,
      n,
      alpha: 0.05,
      isNormal: pValue > 0.05,
      conclusion: pValue > 0.05
        ? `W = ${W.toFixed(6)}, p = ${pValue.toFixed(6)} > 0.05. Los datos parecen distribuirse normalmente.`
        : `W = ${W.toFixed(6)}, p = ${pValue.toFixed(6)} < 0.05. Se rechaza normalidad.`,
      interpretation: pValue > 0.05
        ? 'Evidencia insuficiente para rechazar normalidad (p > 0.05)'
        : 'Se rechaza la hipótesis de normalidad (p < 0.05)'
    };
  }

  /**
   * Kolmogorov-Smirnov Test for Normality (n > 50)
   * @param {Array} values - Data values
   * @returns {Object} Test result
   */
  kolmogorovSmirnovTest(values) {
    if (values.length < 2) {
      throw new Error('Se requieren al menos 2 datos para K-S');
    }

    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const mean = this.stats.mean(sorted);
    const sd = this.stats.std(sorted);

    // Standardize data
    const standardized = sorted.map(x => (x - mean) / sd);

    // Calculate empirical and theoretical CDFs
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
      const empiricalCDF = (i + 1) / n;
      const theoreticalCDF = this.stats.normalCDF(standardized[i]);
      const diff = Math.abs(empiricalCDF - theoreticalCDF);
      maxDiff = Math.max(maxDiff, diff);
    }

    // K-S statistic and critical value
    const KS = maxDiff;
    const criticalValue = 1.36 / Math.sqrt(n); // Approximate critical value for α = 0.05

    return {
      test: 'Kolmogorov-Smirnov',
      statistic: KS,
      criticalValue,
      n,
      alpha: 0.05,
      isNormal: KS < criticalValue,
      conclusion: KS < criticalValue
        ? `D = ${KS.toFixed(6)} < ${criticalValue.toFixed(6)}. Los datos parecen distribuirse normalmente.`
        : `D = ${KS.toFixed(6)} ≥ ${criticalValue.toFixed(6)}. Se rechaza normalidad.`,
      interpretation: KS < criticalValue
        ? 'Evidencia insuficiente para rechazar normalidad'
        : 'Se rechaza la hipótesis de normalidad'
    };
  }

  /**
   * Anderson-Darling Test for Normality
   * @param {Array} values - Data values
   * @returns {Object} Test result
   */
  andersonDarlingTest(values) {
    if (values.length < 3) {
      throw new Error('Se requieren al menos 3 datos para Anderson-Darling');
    }

    const n = values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const mean = this.stats.mean(sorted);
    const sd = this.stats.std(sorted);

    // Standardize
    const standardized = sorted.map(x => (x - mean) / sd);

    // Calculate A² statistic
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const Fz = this.stats.normalCDF(standardized[i]);
      const term1 = (2 * i + 1) / n * Math.log(Fz);
      const term2 = (2 * (n - i) - 1) / n * Math.log(1 - Fz);
      sum += term1 + term2;
    }

    const A2 = -n - sum;

    // Adjusted A² for small samples
    const A2_adj = A2 * (1 + 0.75 / n + 2.25 / (n * n));

    // Critical values for α = 0.05
    const criticalValue = 0.752;

    return {
      test: 'Anderson-Darling',
      statistic: A2,
      statistic_adjusted: A2_adj,
      criticalValue,
      n,
      alpha: 0.05,
      isNormal: A2_adj < criticalValue,
      conclusion: A2_adj < criticalValue
        ? `A² = ${A2_adj.toFixed(6)} < ${criticalValue.toFixed(6)}. Datos normales.`
        : `A² = ${A2_adj.toFixed(6)} ≥ ${criticalValue.toFixed(6)}. Datos no normales.`,
      interpretation: A2_adj < criticalValue
        ? 'No hay evidencia para rechazar normalidad'
        : 'Se rechaza la hipótesis de normalidad'
    };
  }

  // ==================== NON-PARAMETRIC TESTS - TWO SAMPLES ====================

  /**
   * Mann-Whitney U Test (Independent Samples)
   * @param {Array} group1 - First sample
   * @param {Array} group2 - Second sample
   * @returns {Object} Test result
   */
  mannWhitneyUTest(group1, group2) {
    if (group1.length < 2 || group2.length < 2) {
      throw new Error('Cada grupo requiere al menos 2 datos');
    }

    const n1 = group1.length;
    const n2 = group2.length;
    const n = n1 + n2;

    // Combine and rank
    const combined = [
      ...group1.map((v, i) => ({ value: v, group: 1, index: i })),
      ...group2.map((v, i) => ({ value: v, group: 2, index: i }))
    ].sort((a, b) => a.value - b.value);

    // Assign ranks (handling ties)
    const ranks = new Array(n);
    for (let i = 0; i < n; ) {
      let j = i;
      while (j < n && combined[j].value === combined[i].value) j++;
      const avgRank = (i + j + 1) / 2;
      for (let k = i; k < j; k++) {
        ranks[k] = avgRank;
      }
      i = j;
    }

    // Calculate U statistics
    const R1 = ranks.slice(0, n1).reduce((a, b) => a + b, 0);
    const U1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - R1;
    const U2 = n1 * n2 - U1;
    const U = Math.min(U1, U2);

    // Mean and variance of U
    const meanU = (n1 * n2) / 2;
    const sdU = Math.sqrt((n1 * n2 * (n + 1)) / 12);

    // Z statistic (continuity correction)
    const Z = (U - 0.5 - meanU) / sdU;
    const pValue = 2 * (1 - this.stats.normalCDF(Math.abs(Z)));

    return {
      test: 'Mann-Whitney U',
      statistic: U,
      U1,
      U2,
      R1,
      Z,
      pValue,
      n1,
      n2,
      alpha: 0.05,
      significant: pValue < 0.05,
      conclusion: pValue < 0.05
        ? `U = ${U.toFixed(2)}, p = ${pValue.toFixed(6)} < 0.05. Las distribuciones son significativamente diferentes.`
        : `U = ${U.toFixed(2)}, p = ${pValue.toFixed(6)} ≥ 0.05. No hay diferencia significativa.`,
      interpretation: pValue < 0.05
        ? 'Se rechaza H₀: las medianas de los dos grupos son diferentes'
        : 'No hay evidencia para rechazar H₀: las medianas son iguales'
    };
  }

  /**
   * Wilcoxon Signed-Rank Test (Paired Samples)
   * @param {Array} before - Before values
   * @param {Array} after - After values
   * @returns {Object} Test result
   */
  wilcoxonSignedRankTest(before, after) {
    if (before.length !== after.length) {
      throw new Error('Las muestras deben tener el mismo tamaño');
    }
    if (before.length < 2) {
      throw new Error('Se requieren al menos 2 pares');
    }

    const n = before.length;
    const differences = before.map((b, i) => after[i] - b);

    // Remove zeros
    const nonZeroDiffs = differences.filter(d => d !== 0);
    const nNonZero = nonZeroDiffs.length;

    if (nNonZero < 2) {
      throw new Error('Se requieren al menos 2 diferencias no cero');
    }

    // Get absolute values and rank
    const absWithRanks = nonZeroDiffs
      .map(d => ({ abs: Math.abs(d), sign: d > 0 ? 1 : -1 }))
      .sort((a, b) => a.abs - b.abs);

    // Assign ranks (handling ties)
    const ranks = new Array(nNonZero);
    for (let i = 0; i < nNonZero; ) {
      let j = i;
      while (j < nNonZero && absWithRanks[j].abs === absWithRanks[i].abs) j++;
      const avgRank = (i + j + 1) / 2;
      for (let k = i; k < j; k++) {
        ranks[k] = avgRank;
      }
      i = j;
    }

    // Calculate T+ and T-
    let T_plus = 0;
    let T_minus = 0;
    for (let i = 0; i < nNonZero; i++) {
      if (absWithRanks[i].sign > 0) {
        T_plus += ranks[i];
      } else {
        T_minus += ranks[i];
      }
    }

    const T = Math.min(T_plus, T_minus);

    // Mean and variance of T
    const meanT = (nNonZero * (nNonZero + 1)) / 4;
    const sdT = Math.sqrt((nNonZero * (nNonZero + 1) * (2 * nNonZero + 1)) / 24);

    // Z statistic (continuity correction)
    const Z = (T - 0.5 - meanT) / sdT;
    const pValue = 2 * (1 - this.stats.normalCDF(Math.abs(Z)));

    return {
      test: 'Wilcoxon Signed-Rank',
      statistic: T,
      T_plus,
      T_minus,
      Z,
      pValue,
      n_pairs: n,
      n_non_zero: nNonZero,
      alpha: 0.05,
      significant: pValue < 0.05,
      conclusion: pValue < 0.05
        ? `T = ${T.toFixed(2)}, p = ${pValue.toFixed(6)} < 0.05. Hay cambio significativo.`
        : `T = ${T.toFixed(2)}, p = ${pValue.toFixed(6)} ≥ 0.05. No hay cambio significativo.`,
      interpretation: pValue < 0.05
        ? 'Se rechaza H₀: hay diferencia significativa pre-post'
        : 'No hay evidencia para rechazar H₀: no hay cambio significativo'
    };
  }

  // ==================== MULTI-SAMPLE TESTS ====================

  /**
   * Kruskal-Wallis H Test (K Independent Samples)
   * @param {Array<Array>} groups - Array of groups
   * @returns {Object} Test result
   */
  kruskalWallisTest(groups) {
    if (groups.length < 2) {
      throw new Error('Se requieren al menos 2 grupos');
    }

    groups.forEach((g, i) => {
      if (!Array.isArray(g) || g.length < 2) {
        throw new Error(`Grupo ${i + 1} debe tener al menos 2 datos`);
      }
    });

    const k = groups.length;
    const N = groups.reduce((sum, g) => sum + g.length, 0);

    // Combine all data with group labels
    const combined = [];
    groups.forEach((group, groupIdx) => {
      group.forEach(value => {
        combined.push({ value, group: groupIdx });
      });
    });

    // Sort and rank
    combined.sort((a, b) => a.value - b.value);

    const ranks = new Array(N);
    for (let i = 0; i < N; ) {
      let j = i;
      while (j < N && combined[j].value === combined[i].value) j++;
      const avgRank = (i + j + 1) / 2;
      for (let idx = i; idx < j; idx++) {
        ranks[idx] = avgRank;
      }
      i = j;
    }

    // Calculate R_i for each group
    const R = new Array(k).fill(0);
    const n = new Array(k);
    combined.forEach((item, idx) => {
      R[item.group] += ranks[idx];
      n[item.group] = (n[item.group] || 0) + 1;
    });

    // Calculate H statistic
    let H = 0;
    for (let i = 0; i < k; i++) {
      H += (R[i] * R[i]) / n[i];
    }
    H = (12 / (N * (N + 1))) * H - 3 * (N + 1);

    // Chi-square approximation
    const df = k - 1;
    const pValue = 1 - this.chiSquareCDF(H, df);

    return {
      test: 'Kruskal-Wallis H',
      statistic: H,
      df,
      pValue,
      k,
      N,
      groups: n,
      ranks: R,
      alpha: 0.05,
      significant: pValue < 0.05,
      conclusion: pValue < 0.05
        ? `H = ${H.toFixed(4)}, p = ${pValue.toFixed(6)} < 0.05. Hay diferencias significativas entre grupos.`
        : `H = ${H.toFixed(4)}, p = ${pValue.toFixed(6)} ≥ 0.05. No hay diferencias significativas.`,
      interpretation: pValue < 0.05
        ? 'Se rechaza H₀: al menos un grupo difiere significativamente'
        : 'No hay evidencia para rechazar H₀: todos los grupos son similares'
    };
  }

  /**
   * Friedman Test (Repeated Measures)
   * @param {Array<Array>} treatments - Array of treatments (each is a block)
   * @returns {Object} Test result
   */
  friedmanTest(treatments) {
    if (treatments.length < 2) {
      throw new Error('Se requieren al menos 2 tratamientos');
    }

    const k = treatments.length;
    const b = treatments[0].length;

    if (b < 2) {
      throw new Error('Se requieren al menos 2 bloques');
    }

    // Verify all treatments have same length
    treatments.forEach((t, i) => {
      if (t.length !== b) {
        throw new Error(`Tratamiento ${i + 1} tiene diferente número de bloques`);
      }
    });

    // Rank within each block
    const ranks = [];
    for (let blockIdx = 0; blockIdx < b; blockIdx++) {
      const blockValues = treatments.map((t, tIdx) => ({
        value: t[blockIdx],
        treatment: tIdx
      }));

      blockValues.sort((a, b) => a.value - b.value);

      const blockRanks = new Array(k).fill(0);
      for (let i = 0; i < k; ) {
        let j = i;
        while (j < k && blockValues[j].value === blockValues[i].value) j++;
        const avgRank = (i + j + 1) / 2;
        for (let idx = i; idx < j; idx++) {
          blockRanks[blockValues[idx].treatment] = avgRank;
        }
        i = j;
      }

      ranks.push(blockRanks);
    }

    // Sum ranks for each treatment
    const R = new Array(k).fill(0);
    ranks.forEach(blockRanks => {
      blockRanks.forEach((r, i) => {
        R[i] += r;
      });
    });

    // Calculate FR statistic
    let FR =
      (12 * R.reduce((sum, r) => sum + r * r, 0)) / (b * k * (k + 1)) -
      3 * b * (k + 1);

    // Chi-square approximation
    const df = k - 1;
    const pValue = 1 - this.chiSquareCDF(FR, df);

    return {
      test: 'Friedman',
      statistic: FR,
      df,
      pValue,
      k_treatments: k,
      b_blocks: b,
      ranks: R,
      alpha: 0.05,
      significant: pValue < 0.05,
      conclusion: pValue < 0.05
        ? `FR = ${FR.toFixed(4)}, p = ${pValue.toFixed(6)} < 0.05. Hay diferencias significativas entre tratamientos.`
        : `FR = ${FR.toFixed(4)}, p = ${pValue.toFixed(6)} ≥ 0.05. No hay diferencias significativas.`,
      interpretation: pValue < 0.05
        ? 'Se rechaza H₀: al menos un tratamiento difiere significativamente'
        : 'No hay evidencia para rechazar H₀: los tratamientos son similares'
    };
  }

  // ==================== HELPER FUNCTIONS ====================

  getShapiroWilkCoefficients(n) {
    // Approximate coefficients for Shapiro-Wilk test
    // For full implementation, use lookup tables
    const c = [
      [],
      [],
      [0.7071],
      [0.7071, 0.1677],
      [0.6646, 0.2413, 0.0000],
      [0.6431, 0.2806, 0.0875],
      [0.6233, 0.3031, 0.1401, 0.0000],
      [0.6052, 0.3164, 0.1743, 0.0561],
      [0.5888, 0.3244, 0.1976, 0.0947],
      [0.5739, 0.3291, 0.2141, 0.1224]
    ];

    if (n <= 10) {
      return c[n] || Array(Math.floor(n / 2)).fill(0);
    }

    // For larger n, use approximation
    return Array(Math.floor(n / 2)).fill(0).map((_, i) => {
      const m = (i + 1 - 0.375) / (n + 0.25);
      return (
        Math.sqrt(-2 * Math.log(1 - m)) *
        Math.cos(2 * Math.PI * m * 0.3989423)
      );
    });
  }

  approximateShapiroWilkPValue(W, n) {
    // Royston's approximation for p-value
    const logW = Math.log(W);
    const mu = -0.00427025 + 0.04696 / (n - 0.01);
    const sigma = Math.exp(-0.0006714 + 0.038 / (n - 0.02));
    const Z = (logW - mu) / sigma;
    return 1 - this.stats.normalCDF(Z);
  }

  chiSquareCDF(x, df) {
    // Approximate chi-square CDF
    if (x <= 0) return 0;
    if (x >= df * 10) return 1;

    try {
      return jStat.chisquare.cdf(x, df);
    } catch (e) {
      // Fallback approximation
      return 0.5;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HypothesisTests;
}
