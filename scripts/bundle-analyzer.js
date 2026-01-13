#!/usr/bin/env node

/**
 * CSS Bundle Analyzer
 *
 * Measures CSS bundle sizes and tracks reductions over time.
 * Provides warnings for size regressions and performance recommendations.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Configuration constants
 */
const CONFIG = {
  MAX_BUNDLE_SIZE: 200 * 1024, // 200KB max recommended
  WARNING_SIZE: 150 * 1024,    // 150KB warning threshold
  CRITICAL_SIZE: 250 * 1024,   // 250KB critical threshold
  BASELINE_FILE: '.css-baseline.json'
};

/**
 * Get file size in bytes
 * @param {string} filePath - Path to the file
 * @returns {number} File size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Calculate gzip compressed size
 * @param {string} content - File content
 * @returns {Promise<number>} Compressed size in bytes
 */
function getCompressedSize(content) {
  return new Promise((resolve, reject) => {
    zlib.gzip(content, (error, compressed) => {
      if (error) {
        reject(error);
      } else {
        resolve(compressed.length);
      }
    });
  });
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted size string
 */
function formatBytes(bytes) {
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
 * Load baseline data from file
 * @returns {Object} Baseline data or empty object
 */
function loadBaseline() {
  try {
    if (fs.existsSync(CONFIG.BASELINE_FILE)) {
      const data = fs.readFileSync(CONFIG.BASELINE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`Warning: Could not load baseline data: ${error.message}`);
  }
  return {};
}

/**
 * Save baseline data to file
 * @param {Object} baseline - Baseline data to save
 */
function saveBaseline(baseline) {
  try {
    fs.writeFileSync(CONFIG.BASELINE_FILE, JSON.stringify(baseline, null, 2));
  } catch (error) {
    console.error(`Error saving baseline data: ${error.message}`);
  }
}

/**
 * Analyze CSS bundle
 * @param {string} filePath - Path to CSS bundle
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeBundle(filePath, options = {}) {
  const {
    updateBaseline = false,
    warnOnRegression = true,
    outputFormat = 'human' // 'human' or 'json'
  } = options;

  if (!fs.existsSync(filePath)) {
    throw new Error(`CSS bundle not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const rawSize = getFileSize(filePath);
  const compressedSize = await getCompressedSize(content);

  const analysis = {
    filePath,
    timestamp: new Date().toISOString(),
    rawSize,
    compressedSize,
    compressionRatio: compressedSize / rawSize,
    formattedSize: formatBytes(rawSize),
    formattedCompressed: formatBytes(compressedSize)
  };

  // Load baseline for comparison
  const baseline = loadBaseline();
  const baselineEntry = baseline[filePath];

  if (baselineEntry) {
    const sizeDiff = rawSize - baselineEntry.rawSize;
    const sizeDiffPercent = ((sizeDiff / baselineEntry.rawSize) * 100);

    analysis.baseline = {
      previousSize: baselineEntry.rawSize,
      sizeDifference: sizeDiff,
      sizeDifferencePercent: sizeDiffPercent,
      previousTimestamp: baselineEntry.timestamp
    };
  }

  // Update baseline if requested
  if (updateBaseline) {
    baseline[filePath] = {
      rawSize: analysis.rawSize,
      compressedSize: analysis.compressedSize,
      timestamp: analysis.timestamp
    };
    saveBaseline(baseline);
  }

  // Generate output
  if (outputFormat === 'json') {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    outputHumanReadable(analysis, { warnOnRegression });
  }

  return analysis;
}

/**
 * Output human-readable analysis results
 * @param {Object} analysis - Analysis results
 * @param {Object} options - Output options
 */
function outputHumanReadable(analysis, options = {}) {
  const { warnOnRegression = true } = options;

  console.log(`\n📊 CSS Bundle Analysis: ${path.basename(analysis.filePath)}`);
  console.log('='.repeat(50));
  console.log(`📁 File: ${analysis.filePath}`);
  console.log(`📅 Analyzed: ${new Date(analysis.timestamp).toLocaleString()}`);
  console.log(`📏 Raw Size: ${analysis.formattedSize}`);
  console.log(`🗜️  Compressed: ${analysis.formattedCompressed}`);
  console.log(`📈 Compression Ratio: ${(analysis.compressionRatio * 100).toFixed(2)}%`);

  // Baseline comparison
  if (analysis.baseline) {
    const { sizeDifference, sizeDifferencePercent, previousTimestamp } = analysis.baseline;
    const diffSymbol = sizeDifference > 0 ? '📈' : '📉';
    const diffColor = sizeDifference > 0 ? '🔴' : '🟢';

    console.log(`\n📊 Baseline Comparison:`);
    console.log(`⏰ Previous: ${new Date(previousTimestamp).toLocaleString()}`);
    console.log(`${diffSymbol} Size Change: ${formatBytes(Math.abs(sizeDifference))} (${sizeDifferencePercent.toFixed(2)}%)`);

    if (warnOnRegression && sizeDifference > 0) {
      console.log(`${diffColor} ⚠️  WARNING: Bundle size increased!`);
    }
  }

  // Size warnings
  console.log(`\n🚨 Size Status:`);
  if (analysis.rawSize > CONFIG.CRITICAL_SIZE) {
    console.log(`🔴 CRITICAL: Bundle exceeds ${formatBytes(CONFIG.CRITICAL_SIZE)}`);
    console.log(`   Consider code splitting or tree shaking`);
  } else if (analysis.rawSize > CONFIG.WARNING_SIZE) {
    console.log(`🟡 WARNING: Bundle exceeds ${formatBytes(CONFIG.WARNING_SIZE)}`);
    console.log(`   Monitor for further growth`);
  } else if (analysis.rawSize <= CONFIG.MAX_BUNDLE_SIZE) {
    console.log(`🟢 OK: Bundle size within recommended limits`);
  }

  // Performance recommendations
  if (analysis.compressionRatio > 0.8) {
    console.log(`\n💡 Recommendation: High compression ratio detected.`);
    console.log(`   Consider enabling gzip/brotli compression on server.`);
  }

  if (analysis.rawSize > 100 * 1024) { // > 100KB
    console.log(`\n💡 Recommendation: Large bundle detected.`);
    console.log(`   Consider implementing critical CSS extraction.`);
  }
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node scripts/bundle-analyzer.js <css-file> [options]

Options:
  --update-baseline    Update baseline with current measurements
  --json              Output results in JSON format
  --quiet             Suppress warnings and recommendations
  --help              Show this help message

Examples:
  node scripts/bundle-analyzer.js _site/css/style.css
  node scripts/bundle-analyzer.js _site/css/style.css --update-baseline
  node scripts/bundle-analyzer.js _site/css/style.css --json
    `);
    process.exit(1);
  }

  const filePath = args[0];
  const updateBaseline = args.includes('--update-baseline');
  const jsonOutput = args.includes('--json');
  const quiet = args.includes('--quiet');

  try {
    await analyzeBundle(filePath, {
      updateBaseline,
      warnOnRegression: !quiet,
      outputFormat: jsonOutput ? 'json' : 'human'
    });

    // Exit with error code if bundle is too large
    const analysis = await analyzeBundle(filePath, { outputFormat: 'json' });
    if (analysis.rawSize > CONFIG.CRITICAL_SIZE) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error analyzing bundle: ${error.message}`);
    process.exit(1);
  }
}

// Export functions for testing
module.exports = {
  analyzeBundle,
  getFileSize,
  getCompressedSize,
  formatBytes,
  CONFIG
};

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}