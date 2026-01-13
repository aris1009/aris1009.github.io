/**
 * Media Optimization and Lazy Loading
 * Handles images, iframes, and responsive media optimization
 */

class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Initialize intersection observer for lazy loading
    this.setupIntersectionObserver();

    // Handle existing images on the page
    this.processExistingImages();

    // Listen for new images (for dynamic content)
    this.observeNewImages();
  }

  /**
   * Setup Intersection Observer for lazy loading
   */
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, options);
  }

  /**
   * Process existing images on page load
   */
  processExistingImages() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    lazyImages.forEach(img => {
      // Add to intersection observer
      if (this.observer) {
        this.observer.observe(img);
      }

      // Add load event listener for fade-in effect
      img.addEventListener('load', () => {
        this.handleImageLoad(img);
      });

      // Handle already loaded images
      if (img.complete && img.naturalHeight !== 0) {
        this.handleImageLoad(img);
      }
    });
  }

  /**
   * Observe new images added to the DOM
   */
  observeNewImages() {
    // Create a MutationObserver to watch for new images
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Check if the added node is an image or contains images
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IMG' && node.hasAttribute('loading')) {
              this.observer.observe(node);
              this.addImageEventListeners(node);
            }

            // Check child nodes for images
            const images = node.querySelectorAll && node.querySelectorAll('img[loading="lazy"]');
            if (images) {
              images.forEach(img => {
                this.observer.observe(img);
                this.addImageEventListeners(img);
              });
            }
          }
        });
      });
    });

    // Start observing the document body
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Add event listeners to an image
   */
  addImageEventListeners(img) {
    img.addEventListener('load', () => {
      this.handleImageLoad(img);
    });

    img.addEventListener('error', () => {
      this.handleImageError(img);
    });
  }

  /**
   * Load image when it enters viewport
   */
  loadImage(img) {
    // For browsers that don't support native lazy loading
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }

    // Handle srcset for responsive images
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
      img.removeAttribute('data-srcset');
    }

    // Add loading class for animation
    img.classList.add('loading');
  }

  /**
   * Handle successful image load
   */
  handleImageLoad(img) {
    // Remove loading class and add loaded class for fade-in effect
    img.classList.remove('loading');
    img.classList.add('loaded');

    // Emit custom event for other scripts
    img.dispatchEvent(new CustomEvent('imageLoaded', {
      detail: { img, src: img.src }
    }));
  }

  /**
   * Handle image load error
   */
  handleImageError(img) {
    img.classList.add('error');

    // Try to load fallback image if specified
    if (img.dataset.fallback) {
      img.src = img.dataset.fallback;
    } else {
      // Add error styling
      img.style.opacity = '0.5';
      img.title = 'Failed to load image';
    }

    // Emit custom event
    img.dispatchEvent(new CustomEvent('imageError', {
      detail: { img, src: img.src }
    }));
  }

  /**
   * Create low-quality image placeholder (LQIP)
   */
  static createLQIP(src, width = 32, quality = 20) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set small canvas size
        canvas.width = width;
        canvas.height = (img.height / img.width) * width;

        // Draw scaled down image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get low quality base64
        const lqip = canvas.toDataURL('image/jpeg', quality / 100);
        resolve(lqip);
      };

      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Add blur placeholder to image
   */
  static async addBlurPlaceholder(img, placeholder) {
    if (!placeholder) return;

    img.style.backgroundImage = `url('${placeholder}')`;
    img.style.backgroundSize = 'cover';
    img.style.backgroundPosition = 'center';
    img.classList.add('image-with-placeholder');
  }

  /**
   * Get dominant color from image for placeholder
   */
  static getDominantColor(img) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Small sample size
      canvas.width = 50;
      canvas.height = (img.height / img.width) * 50;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let r = 0, g = 0, b = 0;
      const pixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      r = Math.floor(r / pixels);
      g = Math.floor(g / pixels);
      b = Math.floor(b / pixels);

      resolve(`rgb(${r}, ${g}, ${b})`);
    });
  }

  /**
   * Optimize image for display
   */
  static optimizeForDisplay(img) {
    // Add proper loading attributes
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }

    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }

    // Add error handling
    if (!img.hasAttribute('onerror')) {
      img.setAttribute('onerror', 'this.classList.add("error"); this.style.opacity="0.5";');
    }
  }
}

/**
 * Lazy Loading for Iframes
 */
class IframeLazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.processExistingIframes();
    this.observeNewIframes();
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '100px 0px', // Start loading 100px before entering viewport
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadIframe(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, options);
  }

  processExistingIframes() {
    const lazyIframes = document.querySelectorAll('iframe[data-src]');

    lazyIframes.forEach(iframe => {
      if (this.observer) {
        this.observer.observe(iframe);
      }

      iframe.addEventListener('load', () => {
        this.handleIframeLoad(iframe);
      });
    });
  }

  observeNewIframes() {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IFRAME' && node.hasAttribute('data-src')) {
              this.observer.observe(node);
            }

            const iframes = node.querySelectorAll && node.querySelectorAll('iframe[data-src]');
            if (iframes) {
              iframes.forEach(iframe => {
                this.observer.observe(iframe);
              });
            }
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  loadIframe(iframe) {
    if (iframe.dataset.src) {
      iframe.src = iframe.dataset.src;
      iframe.removeAttribute('data-src');
      iframe.classList.add('loading');
    }
  }

  handleIframeLoad(iframe) {
    iframe.classList.remove('loading');
    iframe.classList.add('loaded');

    iframe.dispatchEvent(new CustomEvent('iframeLoaded', {
      detail: { iframe, src: iframe.src }
    }));
  }
}

/**
 * Media Responsiveness Utilities
 */
class MediaUtils {
  /**
   * Get current viewport dimensions
   */
  static getViewportSize() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }

  /**
   * Check if device is mobile
   */
  static isMobile() {
    return window.innerWidth < 768;
  }

  /**
   * Check if device is tablet
   */
  static isTablet() {
    const width = window.innerWidth;
    return width >= 768 && width < 1024;
  }

  /**
   * Check if device is desktop
   */
  static isDesktop() {
    return window.innerWidth >= 1024;
  }

  /**
   * Get responsive image size based on viewport
   */
  static getResponsiveImageSize(baseSize = 800) {
    const viewport = this.getViewportSize();
    const dpr = window.devicePixelRatio || 1;

    // Calculate optimal size based on viewport and device pixel ratio
    let optimalSize = Math.min(baseSize, viewport.width * dpr);

    // Round to nearest 100px for caching efficiency
    return Math.ceil(optimalSize / 100) * 100;
  }

  /**
   * Generate responsive srcset
   */
  static generateSrcSet(baseSrc, sizes = [400, 800, 1200, 1600]) {
    return sizes.map(size => `${baseSrc}?w=${size} ${size}w`).join(', ');
  }

  /**
   * Get appropriate sizes attribute for responsive images
   */
  static getSizesAttribute(breakpoints = { sm: 640, md: 768, lg: 1024 }) {
    const sizes = [
      `(max-width: ${breakpoints.sm - 1}px) 100vw`,
      `(max-width: ${breakpoints.md - 1}px) 100vw`,
      `(max-width: ${breakpoints.lg - 1}px) 100vw`,
      '50vw'
    ];

    return sizes.join(', ');
  }

  /**
   * Check if media queries match
   */
  static matchesMediaQuery(query) {
    return window.matchMedia(query).matches;
  }

  /**
   * Listen for media query changes
   */
  static onMediaQueryChange(query, callback) {
    const mediaQuery = window.matchMedia(query);
    const handler = (e) => callback(e.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    // Return cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }
}

/**
 * Main Media Manager - Conditional Loading
 */
class MediaManager {
  constructor() {
    this.imageOptimizer = null;
    this.iframeLazyLoader = null;
  }

  /**
   * Initialize media features only if media elements are present
   */
  init() {
    if (this.needsMediaOptimization()) {
      this.initializeImageOptimization();
    }

    if (this.needsIframeLazyLoading()) {
      this.initializeIframeLazyLoading();
    }
  }

  /**
   * Check if page has images that need optimization
   */
  needsMediaOptimization() {
    return document.querySelectorAll('img').length > 0;
  }

  /**
   * Check if page has iframes that need lazy loading
   */
  needsIframeLazyLoading() {
    return document.querySelectorAll('iframe[data-src]').length > 0;
  }

  /**
   * Initialize image optimization
   */
  initializeImageOptimization() {
    this.imageOptimizer = new ImageOptimizer();

    // Optimize existing images
    document.querySelectorAll('img').forEach(img => {
      ImageOptimizer.optimizeForDisplay(img);
    });
  }

  /**
   * Initialize iframe lazy loading
   */
  initializeIframeLazyLoading() {
    this.iframeLazyLoader = new IframeLazyLoader();
  }

  /**
   * Get media statistics for debugging
   */
  getStats() {
    return {
      images: {
        total: document.querySelectorAll('img').length,
        lazy: document.querySelectorAll('img[loading="lazy"]').length,
        optimized: document.querySelectorAll('img.loaded').length
      },
      iframes: {
        total: document.querySelectorAll('iframe').length,
        lazy: document.querySelectorAll('iframe[data-src]').length,
        loaded: document.querySelectorAll('iframe.loaded').length
      },
      viewport: MediaUtils.getViewportSize(),
      device: {
        isMobile: MediaUtils.isMobile(),
        isTablet: MediaUtils.isTablet(),
        isDesktop: MediaUtils.isDesktop()
      }
    };
  }
}

// Conditional initialization - only load if media elements are present
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const mediaManager = new MediaManager();
    mediaManager.init();

    // Export for global access
    window.MediaManager = mediaManager;
    window.ImageOptimizer = ImageOptimizer;
    window.IframeLazyLoader = IframeLazyLoader;
    window.MediaUtils = MediaUtils;
  });
} else {
  const mediaManager = new MediaManager();
  mediaManager.init();

  // Export for global access
  window.MediaManager = mediaManager;
  window.ImageOptimizer = ImageOptimizer;
  window.IframeLazyLoader = IframeLazyLoader;
  window.MediaUtils = MediaUtils;
}

// Export as ES modules
export { MediaManager, ImageOptimizer, IframeLazyLoader, MediaUtils };