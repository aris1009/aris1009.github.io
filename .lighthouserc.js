module.exports = {
  ci: {
    collect: {
      // Run Lighthouse against a local server
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Server running at',
      startServerReadyTimeout: 20000,

      // Test pages
      url: [
        'http://localhost:8080/',
        'http://localhost:8080/blog/',
        'http://localhost:8080/about/'
      ],

      // Number of runs per URL
      numberOfRuns: 3
    },

    upload: {
      // Upload results to temporary public storage
      target: 'temporary-public-storage'
    },

    assert: {
      // Performance assertions
      assertions: {
        // CSS-related performance metrics
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Specific performance audits
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-meaningful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // CSS-specific audits
        'unused-css-rules': 'warn',
        'unminified-css': 'error',
        'render-blocking-resources': ['error', { maxLength: 0 }],

        // Resource size audits
        'total-byte-weight': ['error', { maxNumericValue: 2048000 }], // 2MB
        'uses-webp-images': 'warn',

        // Critical rendering path
        'critical-request-chains': 'warn',
        'uses-rel-preload': 'warn'
      }
    }
  }
};