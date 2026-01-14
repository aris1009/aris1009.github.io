/**
 * Image Optimization Utilities
 * Handles progressive loading, lazy loading, and intersection observer
 */

export class ImageOptimizer {
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

// Initialize image optimizer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ImageOptimizer();
  });
} else {
  new ImageOptimizer();
}

// Export for global access
window.ImageOptimizer = ImageOptimizer;
