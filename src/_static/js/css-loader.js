/**
 * CSSLoader - Dynamic CSS component loader for performance optimization
 * Loads CSS components on-demand based on page content and user interactions
 */
class CSSLoader {
  constructor() {
    this.loadedComponents = new Set();
    this.scrollTimeout = null;
    this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  /**
   * Load a CSS component dynamically
   * @param {string} componentName - Name of the component (e.g., 'article', 'dictionary')
   * @param {string} priority - Loading priority ('critical', 'high', 'normal', 'low')
   */
  async loadComponent(componentName, priority = 'normal') {
    // Skip if already loaded
    if (this.loadedComponents.has(componentName)) {
      this.log(`Component '${componentName}' already loaded, skipping`);
      return;
    }

    // Since individual component files are not available yet,
    // load the main stylesheet and mark component as loaded
    // This will be updated when the component build script creates individual files
    if (!document.querySelector('link[href="/css/style.css"]')) {
      try {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/style.css';

        // Use media='print' to prevent render blocking, then switch to 'all'
        link.media = 'print';

        // Create a promise to track when the CSS is loaded
        const loadPromise = new Promise((resolve, reject) => {
          link.onload = () => {
            link.media = 'all';
            this.log(`Main stylesheet loaded, marking component '${componentName}' as available`);
            resolve();
          };

          link.onerror = () => {
            this.log(`Failed to load main stylesheet`, 'error');
            reject(new Error(`Failed to load main CSS stylesheet`));
          };
        });

        // Add to document head
        document.head.appendChild(link);

        // Wait for load based on priority
        if (priority === 'critical') {
          await loadPromise;
        } else {
          // Non-critical components load asynchronously
          loadPromise.catch(() => {
            // Silently handle errors for non-critical components
          });
        }

      } catch (error) {
        this.log(`Error loading stylesheet: ${error.message}`, 'error');
        return;
      }
    }

    // Mark component as loaded (since all styles are in the main stylesheet)
    this.loadedComponents.add(componentName);
    this.log(`Component '${componentName}' marked as loaded`);
  }

  /**
   * Load components on-demand based on page content detection
   */
  loadOnDemand() {
    // Check for article content
    if (document.querySelector('article')) {
      this.loadComponent('article', 'high');
    }

    // Check for dictionary links
    if (document.querySelector('.dictionary-link, [data-testid*="dictionary"]')) {
      this.loadComponent('dictionary', 'normal');
    }

    // Check for theme toggle
    if (document.querySelector('#theme-toggle, .theme-toggle')) {
      this.loadComponent('theme', 'high');
    }

    // Check for language selector
    if (document.querySelector('#language-selector, .language-selector')) {
      this.loadComponent('language', 'normal');
    }

    // Check for navigation/header
    if (document.querySelector('header, nav')) {
      this.loadComponent('header', 'high');
    }

    // Check for footer
    if (document.querySelector('footer')) {
      this.loadComponent('footer', 'normal');
    }

    // Always load utilities
    this.loadComponent('layout', 'high');
    this.loadComponent('typography', 'high');
  }

  /**
   * Initialize scroll-based loading with debouncing
   */
  initScrollLoading() {
    const scrollHandler = () => {
      // Clear existing timeout
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      // Set debounced timeout
      this.scrollTimeout = setTimeout(() => {
        this.handleScroll();
      }, 100);
    };

    // Add scroll event listener (passive for performance)
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Initial check in case user starts scrolled
    this.handleScroll();
  }

  /**
   * Handle scroll events for lazy loading
   */
  handleScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load low-priority components when user scrolls down
    if (scrollY > 100 && !this.loadedComponents.has('footer')) {
      this.loadComponent('footer', 'low');
    }

    // Load additional components based on scroll position
    const scrollPercent = (scrollY + windowHeight) / documentHeight;
    if (scrollPercent > 0.3) {
      // Load any remaining components that might be needed
      this.loadRemainingComponents();
    }
  }

  /**
   * Load any remaining components that haven't been loaded yet
   */
  loadRemainingComponents() {
    const allComponents = ['article', 'dictionary', 'theme', 'language', 'header', 'footer', 'layout', 'typography'];

    allComponents.forEach(component => {
      if (!this.loadedComponents.has(component)) {
        // Check if component is actually needed
        if (this.isComponentNeeded(component)) {
          this.loadComponent(component, 'low');
        }
      }
    });
  }

  /**
   * Check if a component is actually needed on the current page
   * @param {string} componentName - Name of the component to check
   * @returns {boolean} - Whether the component is needed
   */
  isComponentNeeded(componentName) {
    switch (componentName) {
      case 'article':
        return !!document.querySelector('article');
      case 'dictionary':
        return !!document.querySelector('.dictionary-link, [data-testid*="dictionary"]');
      case 'theme':
        return !!document.querySelector('#theme-toggle, .theme-toggle, [data-theme]');
      case 'language':
        return !!document.querySelector('#language-selector, .language-selector');
      case 'header':
        return !!document.querySelector('header, nav');
      case 'footer':
        return !!document.querySelector('footer');
      case 'layout':
      case 'typography':
        // Always needed
        return true;
      default:
        return false;
    }
  }

  /**
   * Initialize the CSS loader when DOM is ready
   */
  init() {
    this.log('Initializing CSS Loader');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDomReady());
    } else {
      this.onDomReady();
    }
  }

  /**
   * Called when DOM is ready
   */
  onDomReady() {
    this.log('DOM ready, starting component loading');

    // Load critical components first
    this.loadComponent('base', 'critical');

    // Load on-demand components
    this.loadOnDemand();

    // Initialize scroll-based loading
    this.initScrollLoading();

    // Set up mutation observer for dynamic content
    this.initMutationObserver();
  }

  /**
   * Initialize mutation observer to watch for dynamically added content
   */
  initMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldCheckComponents = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain elements that need CSS components
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches('article, .dictionary-link, [data-testid*="dictionary"]')) {
                shouldCheckComponents = true;
              }
            }
          });
        }
      });

      if (shouldCheckComponents) {
        this.log('Dynamic content detected, checking for needed components');
        this.loadOnDemand();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Log messages for debugging (only in development)
   * @param {string} message - Message to log
   * @param {string} level - Log level ('log', 'warn', 'error')
   */
  log(message, level = 'log') {
    if (this.isDevelopment) {
      const prefix = '[CSSLoader]';
      switch (level) {
        case 'warn':
          console.warn(`${prefix} ${message}`);
          break;
        case 'error':
          console.error(`${prefix} ${message}`);
          break;
        default:
          console.log(`${prefix} ${message}`);
      }
    }
  }
}

// Initialize the CSS loader when the script loads
const cssLoader = new CSSLoader();
cssLoader.init();

// Export for potential use by other modules
window.CSSLoader = CSSLoader;