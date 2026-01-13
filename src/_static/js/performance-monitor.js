/**
 * CSS Performance Monitor
 *
 * Tracks CSS loading times, critical rendering path metrics,
 * and provides performance insights for optimization.
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    CSS_LOAD_TIMEOUT: 30000, // 30 seconds
    SLOW_LOAD_THRESHOLD: 1000, // 1 second
    CRITICAL_CSS_THRESHOLD: 14000, // 14KB (typical TCP window)
    PERFORMANCE_OBSERVER: true
  };

  // Performance metrics storage
  const metrics = {
    cssLoadTimes: new Map(),
    criticalCSS: null,
    totalCSSSize: 0,
    cssRequests: [],
    firstPaint: null,
    firstContentfulPaint: null,
    largestContentfulPaint: null,
    cumulativeLayoutShift: 0
  };

  // CSS loading states
  const cssStates = new Map();

  /**
   * Initialize CSS performance monitoring
   */
  function init() {
    // Monitor CSS link elements
    monitorCSSLinks();

    // Set up Performance Observer for resource timing
    if (CONFIG.PERFORMANCE_OBSERVER && 'PerformanceObserver' in window) {
      setupPerformanceObserver();
    }

    // Monitor paint metrics
    monitorPaintMetrics();

    // Monitor layout shifts
    monitorLayoutShift();

    // Expose API globally for testing
    window.CSSPerformanceMonitor = {
      getMetrics,
      measureCSSLoadTime,
      getCriticalCSSMetrics,
      logPerformanceData
    };
  }

  /**
   * Monitor all CSS link elements for loading performance
   */
  function monitorCSSLinks() {
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');

    cssLinks.forEach((link, index) => {
      const href = link.href || link.getAttribute('data-href');
      if (!href) return;

      const startTime = performance.now();
      cssStates.set(href, {
        startTime,
        loaded: false,
        size: null
      });

      // Monitor load events
      link.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        cssStates.set(href, {
          ...cssStates.get(href),
          loaded: true,
          loadTime
        });

        metrics.cssLoadTimes.set(href, loadTime);
        metrics.cssRequests.push({
          url: href,
          loadTime,
          timestamp: Date.now()
        });

        // Check for slow loading
        if (loadTime > CONFIG.SLOW_LOAD_THRESHOLD) {
          console.warn(`⚠️ Slow CSS load detected: ${href} took ${loadTime.toFixed(2)}ms`);
        }
      });

      // Monitor error events
      link.addEventListener('error', () => {
        console.error(`❌ CSS load failed: ${href}`);
        cssStates.set(href, {
          ...cssStates.get(href),
          error: true,
          loadTime: performance.now() - startTime
        });
      });

      // Estimate CSS size if possible
      estimateCSSSize(link, href);
    });
  }

  /**
   * Estimate CSS file size using various methods
   */
  function estimateCSSSize(link, href) {
    // Method 1: Use resource timing if available
    if ('performance' in window && performance.getEntriesByType) {
      const entries = performance.getEntriesByType('resource');
      const cssEntry = entries.find(entry => entry.name === href);

      if (cssEntry && cssEntry.transferSize) {
        metrics.totalCSSSize += cssEntry.transferSize;
        cssStates.set(href, {
          ...cssStates.get(href),
          size: cssEntry.transferSize
        });
      }
    }

    // Method 2: Fallback - check for size in link attributes
    const sizeAttr = link.getAttribute('data-size');
    if (sizeAttr) {
      const size = parseInt(sizeAttr, 10);
      if (!isNaN(size)) {
        metrics.totalCSSSize += size;
        cssStates.set(href, {
          ...cssStates.get(href),
          size
        });
      }
    }
  }

  /**
   * Set up Performance Observer for detailed resource monitoring
   */
  function setupPerformanceObserver() {
    try {
      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.initiatorType === 'link' && entry.name.includes('.css')) {
            const cssEntry = {
              url: entry.name,
              loadTime: entry.responseEnd - entry.requestStart,
              size: entry.transferSize || 0,
              timestamp: entry.responseEnd
            };

            // Update metrics
            if (!metrics.cssLoadTimes.has(entry.name)) {
              metrics.cssLoadTimes.set(entry.name, cssEntry.loadTime);
              metrics.cssRequests.push(cssEntry);
              metrics.totalCSSSize += cssEntry.size || 0;
            }
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });

      // Observe navigation timing for critical rendering
      const navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.type === 'navigate') {
            metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
            metrics.loadComplete = entry.loadEventEnd - entry.loadEventStart;
          }
        });
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });

    } catch (error) {
      console.warn('Performance Observer setup failed:', error);
    }
  }

  /**
   * Monitor paint metrics (First Paint, First Contentful Paint, etc.)
   */
  function monitorPaintMetrics() {
    try {
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.name) {
            case 'first-paint':
              metrics.firstPaint = entry.startTime;
              break;
            case 'first-contentful-paint':
              metrics.firstContentfulPaint = entry.startTime;
              break;
          }
        });
      });

      paintObserver.observe({ entryTypes: ['paint'] });

      // Also observe Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.startTime > (metrics.largestContentfulPaint || 0)) {
            metrics.largestContentfulPaint = entry.startTime;
          }
        });
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    } catch (error) {
      console.warn('Paint metrics monitoring failed:', error);
    }
  }

  /**
   * Monitor Cumulative Layout Shift
   */
  function monitorLayoutShift() {
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            metrics.cumulativeLayoutShift += entry.value;
          }
        });
      });

      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Layout shift monitoring failed:', error);
    }
  }

  /**
   * Measure load time for a specific CSS file
   * @param {string} url - CSS file URL
   * @returns {number|null} Load time in milliseconds or null if not loaded
   */
  function measureCSSLoadTime(url) {
    return metrics.cssLoadTimes.get(url) || null;
  }

  /**
   * Get critical CSS performance metrics
   * @returns {Object} Critical CSS metrics
   */
  function getCriticalCSSMetrics() {
    const criticalCSS = document.querySelector('style[data-critical-css]');
    const criticalSize = criticalCSS ? criticalCSS.textContent.length : 0;

    return {
      hasCriticalCSS: !!criticalCSS,
      criticalCSSSize: criticalSize,
      isOverThreshold: criticalSize > CONFIG.CRITICAL_CSS_THRESHOLD,
      inlineEfficiency: criticalSize / metrics.totalCSSSize
    };
  }

  /**
   * Get all CSS performance metrics
   * @returns {Object} Complete metrics object
   */
  function getMetrics() {
    return {
      ...metrics,
      cssLoadTimes: Object.fromEntries(metrics.cssLoadTimes),
      criticalCSSMetrics: getCriticalCSSMetrics(),
      summary: {
        totalCSSFiles: metrics.cssRequests.length,
        averageLoadTime: calculateAverageLoadTime(),
        totalCSSSize: metrics.totalCSSSize,
        slowestCSSFile: findSlowestCSSFile(),
        allCSSLoaded: areAllCSSFilesLoaded()
      }
    };
  }

  /**
   * Calculate average CSS load time
   * @returns {number} Average load time in milliseconds
   */
  function calculateAverageLoadTime() {
    const times = Array.from(metrics.cssLoadTimes.values());
    if (times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  /**
   * Find the slowest loading CSS file
   * @returns {Object|null} Slowest CSS file info or null
   */
  function findSlowestCSSFile() {
    let slowest = null;
    let maxTime = 0;

    metrics.cssLoadTimes.forEach((time, url) => {
      if (time > maxTime) {
        maxTime = time;
        slowest = { url, loadTime: time };
      }
    });

    return slowest;
  }

  /**
   * Check if all CSS files have loaded
   * @returns {boolean} True if all CSS files are loaded
   */
  function areAllCSSFilesLoaded() {
    return Array.from(cssStates.values()).every(state => state.loaded || state.error);
  }

  /**
   * Log performance data to console
   */
  function logPerformanceData() {
    const data = getMetrics();

    console.group('📊 CSS Performance Report');
    console.log(`Total CSS Files: ${data.summary.totalCSSFiles}`);
    console.log(`Total CSS Size: ${(data.summary.totalCSSSize / 1024).toFixed(2)} KB`);
    console.log(`Average Load Time: ${data.summary.averageLoadTime.toFixed(2)} ms`);

    if (data.summary.slowestCSSFile) {
      console.log(`Slowest File: ${data.summary.slowestCSSFile.url} (${data.summary.slowestCSSFile.loadTime.toFixed(2)} ms)`);
    }

    if (data.firstContentfulPaint) {
      console.log(`First Contentful Paint: ${data.firstContentfulPaint.toFixed(2)} ms`);
    }

    if (data.largestContentfulPaint) {
      console.log(`Largest Contentful Paint: ${data.largestContentfulPaint.toFixed(2)} ms`);
    }

    if (data.cumulativeLayoutShift > 0) {
      console.log(`Cumulative Layout Shift: ${data.cumulativeLayoutShift.toFixed(4)}`);
    }

    const criticalMetrics = data.criticalCSSMetrics;
    if (criticalMetrics.hasCriticalCSS) {
      console.log(`Critical CSS Size: ${(criticalMetrics.criticalCSSSize / 1024).toFixed(2)} KB`);
      if (criticalMetrics.isOverThreshold) {
        console.warn('⚠️ Critical CSS size exceeds recommended threshold');
      }
    } else {
      console.warn('⚠️ No critical CSS detected - consider implementing critical CSS extraction');
    }

    if (!data.summary.allCSSLoaded) {
      console.warn('⚠️ Some CSS files are still loading');
    }

    console.groupEnd();
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for testing (if in Node.js environment)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      init,
      getMetrics,
      measureCSSLoadTime,
      getCriticalCSSMetrics,
      CONFIG
    };
  }

})();