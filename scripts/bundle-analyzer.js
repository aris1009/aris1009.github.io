const fs = require('fs');
const path = require('path');

/**
 * Bundle Analyzer for measuring JavaScript bundle sizes and tracking performance
 */
class BundleAnalyzer {
  constructor(options = {}) {
    this.basePath = options.basePath || path.join(process.cwd(), '_site', 'js');
    this.baselinePath = options.baselinePath || path.join(process.cwd(), 'scripts', 'bundle-baselines.json');
    this.bundles = options.bundles || [
      'core.js',
      'article-features.js',
      'code-features.js',
      'media-features.js'
    ];
  }

  /**
   * Analyze all configured bundles and return their sizes
   * @returns {Promise<Object>} Bundle sizes in bytes
   */
  async analyzeBundles() {
    const sizes = {};

    for (const bundle of this.bundles) {
      try {
        const bundlePath = path.join(this.basePath, bundle);
        const stats = await this.getFileStats(bundlePath);
        sizes[bundle] = stats.size;
      } catch (error) {
        console.warn(`Warning: Could not analyze bundle ${bundle}:`, error.message);
        sizes[bundle] = 0;
      }
    }

    return sizes;
  }

  /**
   * Get sizes for specific bundles
   * @param {string[]} bundleNames - Array of bundle names to analyze
   * @returns {Promise<Object>} Bundle sizes in bytes
   */
  async getBundleSizes(bundleNames = this.bundles) {
    const sizes = {};

    for (const bundle of bundleNames) {
      try {
        const bundlePath = path.join(this.basePath, bundle);
        const stats = await this.getFileStats(bundlePath);
        sizes[bundle] = stats.size;
      } catch (error) {
        sizes[bundle] = 0;
      }
    }

    return sizes;
  }

  /**
   * Calculate total size of all bundles
   * @returns {Promise<number>} Total size in bytes
   */
  async getTotalSize() {
    const sizes = await this.analyzeBundles();
    return Object.values(sizes).reduce((total, size) => total + size, 0);
  }

  /**
   * Get formatted size information with human-readable units
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Compare current bundle sizes against baseline
   * @returns {Promise<Object>} Comparison results
   */
  async compareAgainstBaseline() {
    const currentSizes = await this.analyzeBundles();
    let baselineSizes = {};

    try {
      if (fs.existsSync(this.baselinePath)) {
        const baselineData = fs.readFileSync(this.baselinePath, 'utf8');
        baselineSizes = JSON.parse(baselineData);
      }
    } catch (error) {
      console.warn('Warning: Could not load baseline data:', error.message);
    }

    const comparison = {};

    for (const bundle of this.bundles) {
      const current = currentSizes[bundle] || 0;
      const baseline = baselineSizes[bundle] || 0;
      const difference = current - baseline;
      const percentChange = baseline > 0 ? (difference / baseline) * 100 : 0;

      comparison[bundle] = {
        current,
        baseline,
        difference,
        percentChange: Math.round(percentChange * 100) / 100,
        formattedCurrent: this.formatSize(current),
        formattedBaseline: this.formatSize(baseline),
        formattedDifference: `${difference >= 0 ? '+' : ''}${this.formatSize(Math.abs(difference))}`
      };
    }

    return comparison;
  }

  /**
   * Update baseline with current bundle sizes
   * @returns {Promise<void>}
   */
  async updateBaseline() {
    const currentSizes = await this.analyzeBundles();

    try {
      // Ensure directory exists
      const dir = path.dirname(this.baselinePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.baselinePath, JSON.stringify(currentSizes, null, 2));
      console.log('Baseline updated successfully');
    } catch (error) {
      throw new Error(`Failed to update baseline: ${error.message}`);
    }
  }

  /**
   * Generate a performance report
   * @returns {Promise<string>} Formatted report
   */
  async generateReport() {
    const sizes = await this.analyzeBundles();
    const totalSize = await this.getTotalSize();
    const comparison = await this.compareAgainstBaseline();

    let report = '=== JavaScript Bundle Performance Report ===\n\n';
    report += `Total Bundle Size: ${this.formatSize(totalSize)}\n\n`;
    report += 'Individual Bundle Sizes:\n';

    for (const [bundle, size] of Object.entries(sizes)) {
      const comp = comparison[bundle];
      const changeIndicator = comp.difference !== 0 ?
        ` (${comp.formattedDifference}, ${comp.percentChange >= 0 ? '+' : ''}${comp.percentChange}%)` : '';
      report += `  ${bundle}: ${this.formatSize(size)}${changeIndicator}\n`;
    }

    report += '\nRecommendations:\n';
    if (totalSize > 50000) { // 50KB
      report += '  ⚠️  Total bundle size exceeds 50KB - consider code splitting\n';
    }

    for (const [bundle, comp] of Object.entries(comparison)) {
      if (comp.percentChange > 10) {
        report += `  ⚠️  ${bundle} increased by ${comp.percentChange}% - review recent changes\n`;
      }
    }

    return report;
  }

  /**
   * Get file stats for a given path
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} File stats
   */
  async getFileStats(filePath) {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (error, stats) => {
        if (error) {
          reject(error);
        } else {
          resolve(stats);
        }
      });
    });
  }
}

// Export for use in other modules
module.exports = BundleAnalyzer;

// CLI usage
if (require.main === module) {
  const analyzer = new BundleAnalyzer();

  const command = process.argv[2];

  switch (command) {
    case 'analyze':
      analyzer.analyzeBundles().then(sizes => {
        console.log('Bundle sizes:');
        Object.entries(sizes).forEach(([bundle, size]) => {
          console.log(`  ${bundle}: ${analyzer.formatSize(size)}`);
        });
      }).catch(console.error);
      break;

    case 'report':
      analyzer.generateReport().then(console.log).catch(console.error);
      break;

    case 'baseline':
      analyzer.updateBaseline().catch(console.error);
      break;

    default:
      console.log('Usage: node bundle-analyzer.js <analyze|report|baseline>');
      console.log('  analyze: Show current bundle sizes');
      console.log('  report: Generate full performance report');
      console.log('  baseline: Update baseline with current sizes');
  }
}