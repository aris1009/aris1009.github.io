class ReadingProgressBar {
  constructor() {
    this.progressBar = null;
    this.progressFill = null;
    this.article = null;
    this.isVisible = false;
    this.rafId = null;
    this.pendingUpdate = false;
    this.intersectionObserver = null;
    this.init();
  }

  init() {
    // Only initialize on article pages
    this.article = document.querySelector('article[data-blog-post]');
    if (!this.article) {
      return;
    }

    this.createProgressBar();
    this.setupIntersectionObserver();
    this.setupEventListeners();
    this.updateProgress();
  }

  createProgressBar() {
    // Create progress bar container
    this.progressBar = document.createElement('div');
    this.progressBar.id = 'reading-progress-bar';
    this.progressBar.className = 'reading-progress-bar';
    this.progressBar.setAttribute('aria-hidden', 'true'); // Decorative element
    
    // Create inner progress fill
    this.progressFill = document.createElement('div');
    this.progressFill.className = 'reading-progress-fill';
    this.progressBar.appendChild(this.progressFill);
    
    // Insert at the beginning of body
    document.body.insertBefore(this.progressBar, document.body.firstChild);
  }

  setupIntersectionObserver() {
    // Observe when article enters/exits viewport to show/hide progress bar
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const articleEntry = entries[0];
        const shouldShow = articleEntry.isIntersecting && window.pageYOffset > 50;
        
        if (shouldShow && !this.isVisible) {
          this.show();
        } else if (!shouldShow && this.isVisible && window.pageYOffset <= 50) {
          this.hide();
        }
      },
      {
        threshold: 0,
        rootMargin: '0px'
      }
    );
    
    this.intersectionObserver.observe(this.article);
  }

  setupEventListeners() {
    // Use passive scroll listener with RAF for smooth updates
    window.addEventListener('scroll', () => {
      if (!this.pendingUpdate) {
        this.pendingUpdate = true;
        this.rafId = requestAnimationFrame(() => {
          this.updateProgress();
          this.pendingUpdate = false;
        });
      }
    }, { passive: true });

    // Update on resize and orientation change
    window.addEventListener('resize', () => {
      this.updateProgress();
    }, { passive: true });

    window.addEventListener('orientationchange', () => {
      // Delay to account for viewport changes
      setTimeout(() => this.updateProgress(), 100);
    });

    // Recalculate when images load (dynamic content)
    window.addEventListener('load', () => {
      this.updateProgress();
    });

    // Handle font loading
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        this.updateProgress();
      });
    }
  }

  updateProgress() {
    if (!this.article) return;

    // Get article boundaries
    const articleRect = this.article.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate scroll progress relative to article
    const articleTop = articleRect.top + window.pageYOffset;
    const articleHeight = articleRect.height;
    const scrollTop = window.pageYOffset;
    const viewportTop = scrollTop + viewportHeight;
    
    // Progress is how much of the article has been scrolled past the top of viewport
    let progress = 0;
    
    if (scrollTop >= articleTop) {
      // Calculate reading progress
      const readableHeight = Math.max(articleHeight - viewportHeight, 0);
      if (readableHeight > 0) {
        progress = Math.min((scrollTop - articleTop) / readableHeight, 1);
      } else {
        // Article is shorter than viewport, consider it fully read when visible
        progress = articleRect.top <= 0 ? 1 : 0;
      }
    }
    
    // Ensure progress is between 0 and 1
    progress = Math.max(0, Math.min(1, progress));
    
    // Update progress bar width
    const percentage = Math.round(progress * 100);
    this.progressFill.style.width = `${percentage}%`;
    try { console.log('[reading-progress] update', { percentage, scrollTop, articleTop, articleHeight, viewportHeight }); } catch (e) {}
    
    // Show/hide based on scroll position
    const shouldShow = scrollTop > 50 || progress > 0;
    
    if (shouldShow && !this.isVisible) {
      this.show();
    } else if (!shouldShow && this.isVisible) {
      this.hide();
    }
  }

  show() {
    if (!this.progressBar.classList.contains('visible')) {
      this.progressBar.classList.add('visible');
      this.isVisible = true;
      try { console.log('[reading-progress] show'); } catch (e) {}
    }
  }

  hide() {
    if (this.progressBar.classList.contains('visible')) {
      this.progressBar.classList.remove('visible');
      this.isVisible = false;
      try { console.log('[reading-progress] hide'); } catch (e) {}
    }
  }

  destroy() {
    // Cleanup for SPA-like behavior
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.progressBar && this.progressBar.parentNode) {
      this.progressBar.parentNode.removeChild(this.progressBar);
    }
  }
}
 
// Script load marker
try { console.log('[reading-progress] script loaded'); } catch (e) {}
 
// Initialize when DOM is ready
function initReadingProgressBar() {
  // Always initialize; reduced motion is handled via CSS (no transitions)
  const progressBar = new ReadingProgressBar();
  window.readingProgressBar = progressBar;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReadingProgressBar);
} else {
  initReadingProgressBar();
}
