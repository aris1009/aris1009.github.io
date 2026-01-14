/**
 * Performance Monitor for JavaScript loading times and bundle performance
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.bundleTimings = new Map();
    this.initializationTime = Date.now();

    this.init();
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    // Monitor script loading performance
    this.observeResourceTiming();

    // Monitor bundle loading
    this.monitorBundleLoading();

    // Track page load metrics
    this.trackPageLoadMetrics();

    // Set up performance observer for additional metrics
    this.setupPerformanceObserver();
  }

  /**
   * Observe resource timing for scripts and bundles
   */
  observeResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) {
      console.warn('Performance API not supported');
      return;
    }

    // Get initial resource timings
    const resources = window.performance.getEntriesByType('resource');
    this.processResourceTimings(resources);

    // Observe future resource loads
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.processResourceTimings(entries);
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      console.warn('Resource timing observation not supported:', error);
    }
  }

  /**
   * Process resource timing entries
   * @param {PerformanceEntry[]} entries - Resource timing entries
   */
  processResourceTimings(entries) {
    entries.forEach(entry => {
      if (entry.name.includes('.js') || entry.initiatorType === 'script') {
        const timing = {
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          fetchStart: entry.fetchStart,
          responseEnd: entry.responseEnd,
          transferSize: entry.transferSize || 0,
          decodedBodySize: entry.decodedBodySize || 0
        };

        this.metrics.set(`resource:${entry.name}`, timing);

        // Track bundle-specific metrics
        if (entry.name.includes('/js/')) {
          this.bundleTimings.set(entry.name, timing);
        }
      }
    });
  }

  /**
   * Monitor dynamic bundle loading
   */
  monitorBundleLoading() {
    // Hook into dynamic imports if supported
    const originalImport = window.import;

    if (originalImport) {
      window.import = async (url) => {
        const startTime = performance.now();
        try {
          const result = await originalImport(url);
          const endTime = performance.now();
          const loadTime = endTime - startTime;

          this.metrics.set(`dynamic-import:${url}`, {
            url,
            loadTime,
            startTime: this.initializationTime + startTime,
            endTime: this.initializationTime + endTime,
            success: true
          });

          return result;
        } catch (error) {
          const endTime = performance.now();
          const loadTime = endTime - startTime;

          this.metrics.set(`dynamic-import:${url}`, {
            url,
            loadTime,
            startTime: this.initializationTime + startTime,
            endTime: this.initializationTime + endTime,
            success: false,
            error: error.message
          });

          throw error;
        }
      };
    }
  }

  /**
   * Track page load metrics
   */
  trackPageLoadMetrics() {
    // Track when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const domReadyTime = Date.now() - this.initializationTime;
        this.metrics.set('dom-ready', { time: domReadyTime });
      });
    } else {
      const domReadyTime = Date.now() - this.initializationTime;
      this.metrics.set('dom-ready', { time: domReadyTime });
    }

    // Track when page is fully loaded
    window.addEventListener('load', () => {
      const loadTime = Date.now() - this.initializationTime;
      this.metrics.set('page-load', { time: loadTime });
    });
  }

  /**
   * Set up performance observer for additional metrics
   */
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) {
      return;
    }

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.metrics.set('navigation', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadEvent: entry.loadEventEnd - entry.loadEventStart,
              totalTime: entry.loadEventEnd - entry.fetchStart
            });
          }
        });
      });

      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);
    } catch (error) {
      console.warn('Navigation timing observation failed:', error);
    }

    try {
      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.metrics.set(`paint:${entry.name}`, {
            startTime: entry.startTime,
            duration: 0 // Paint events don't have duration
          });
        });
      });

      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', paintObserver);
    } catch (error) {
      console.warn('Paint timing observation failed:', error);
    }
  }

  /**
   * Get loading time for a specific bundle
   * @param {string} bundleName - Name of the bundle
   * @returns {number|null} Loading time in milliseconds or null if not found
   */
  getBundleLoadTime(bundleName) {
    const timing = this.bundleTimings.get(bundleName);
    return timing ? timing.duration : null;
  }

  /**
   * Get all bundle loading times
   * @returns {Object} Bundle loading times
   */
  getAllBundleLoadTimes() {
    const result = {};
    this.bundleTimings.forEach((timing, name) => {
      result[name] = timing.duration;
    });
    return result;
  }

  /**
   * Get performance metrics summary
   * @returns {Object} Performance metrics
   */
  getMetricsSummary() {
    const summary = {
      bundles: this.getAllBundleLoadTimes(),
      page: {},
      resources: {}
    };

    // Page metrics
    const domReady = this.metrics.get('dom-ready');
    const pageLoad = this.metrics.get('page-load');
    const navigation = this.metrics.get('navigation');

    if (domReady) summary.page.domReady = domReady.time;
    if (pageLoad) summary.page.load = pageLoad.time;
    if (navigation) summary.page.navigation = navigation;

    // Resource metrics (scripts only)
    this.metrics.forEach((metric, key) => {
      if (key.startsWith('resource:') && (key.includes('.js') || metric.initiatorType === 'script')) {
        summary.resources[key.replace('resource:', '')] = {
          duration: metric.duration,
          size: metric.decodedBodySize || 0
        };
      }
    });

    return summary;
  }

  /**
   * Report performance metrics to console
   */
  report() {
    const summary = this.getMetricsSummary();

    console.group('🚀 JavaScript Performance Report');

    if (Object.keys(summary.bundles).length > 0) {
      console.group('📦 Bundle Loading Times');
      Object.entries(summary.bundles).forEach(([bundle, time]) => {
        console.log(`${bundle}: ${time.toFixed(2)}ms`);
      });
      console.groupEnd();
    }

    if (Object.keys(summary.page).length > 0) {
      console.group('📄 Page Metrics');
      if (summary.page.domReady) {
        console.log(`DOM Ready: ${summary.page.domReady}ms`);
      }
      if (summary.page.load) {
        console.log(`Page Load: ${summary.page.load}ms`);
      }
      if (summary.page.navigation) {
        console.log(`Navigation Total: ${summary.page.navigation.totalTime.toFixed(2)}ms`);
      }
      console.groupEnd();
    }

    if (Object.keys(summary.resources).length > 0) {
      console.group('🔗 Script Resources');
      Object.entries(summary.resources).forEach(([resource, data]) => {
        const size = data.size > 0 ? ` (${this.formatBytes(data.size)})` : '';
        console.log(`${resource}: ${data.duration.toFixed(2)}ms${size}`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted size
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clean up observers
   */
  destroy() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        // Observer might already be disconnected
      }
    });
    this.observers.clear();
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  window.performanceMonitor = new PerformanceMonitor();
}

export default PerformanceMonitor;