/**
 * Article-specific features
 * Combines ReadingProgressBar and CodeCopyButtons functionality
 * Only loads on pages with article elements
 */

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
    this.article = document.querySelector('article');
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

function addCopyButtonsToCodeBlocks() {
  // Process only code blocks that don't already have copy buttons
  document.querySelectorAll('pre[class*="language-"]:not(.has-copy-button)').forEach(pre => {
    const codeElement = pre.querySelector('code');
    if (!codeElement) return;

    // Get the raw text content (unformatted)
    const codeText = codeElement.textContent;

    // Create wrapper for positioning
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    // Create Shoelace copy button with enhanced accessibility
    const copyButton = document.createElement('sl-copy-button');
    copyButton.value = codeText;
    copyButton.className = 'code-copy-button';

    // Accessibility attributes
    copyButton.setAttribute('aria-label', 'Copy code snippet');
    copyButton.setAttribute('copy-label', 'Copy');
    copyButton.setAttribute('success-label', 'Copied!');
    copyButton.setAttribute('error-label', 'Copy failed');
    copyButton.setAttribute('feedback-duration', '1500');
    copyButton.setAttribute('data-testid', 'code-copy-button');

    // Event listeners for feedback and analytics
    copyButton.addEventListener('sl-copy', () => {
      console.log('Code copied successfully');
    });

    copyButton.addEventListener('sl-error', (e) => {
      console.error('Copy failed:', e);
      // Shoelace automatically shows error-label in tooltip
    });

    // Insert wrapper and copy button
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    wrapper.appendChild(copyButton);

    // Mark as processed to prevent duplicate processing
    pre.classList.add('has-copy-button');
  });
}

// Enhanced initialization with multiple fallbacks
function initializeCopyButtons() {
  // Primary integration: Hook into Prism after highlighting
  if (window.Prism) {
    // Hook for when Prism highlights elements
    window.Prism.hooks.add('after-highlight', addCopyButtonsToCodeBlocks);

    // Handle Prism re-highlighting edge case
    window.Prism.hooks.add('before-highlight', env => {
      if (env.element && env.element.classList.contains('has-copy-button')) {
        env.element.dataset.preserveCopyButton = 'true';
      }
    });

    window.Prism.hooks.add('after-highlight', env => {
      if (env.element && env.element.dataset.preserveCopyButton) {
        env.element.classList.add('has-copy-button');
        delete env.element.dataset.preserveCopyButton;
      }
    });

    // Process existing highlighted code blocks
    addCopyButtonsToCodeBlocks();
  } else {
    // Fallback: Process immediately if Prism not available
    addCopyButtonsToCodeBlocks();
  }

  // Safety net: MutationObserver for dynamic content
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node is a code block or contains code blocks
          if (node.matches && node.matches('pre[class*="language-"]')) {
            shouldProcess = true;
          } else if (node.querySelector && node.querySelector('pre[class*="language-"]')) {
            shouldProcess = true;
          }
        }
      });
    });

    if (shouldProcess) {
      // Use requestIdleCallback for better performance
      if (window.requestIdleCallback) {
        requestIdleCallback(addCopyButtonsToCodeBlocks, { timeout: 2000 });
      } else {
        setTimeout(addCopyButtonsToCodeBlocks, 0);
      }
    }
  });

  // Start observing for dynamic content changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize article-specific features
function initializeArticleFeatures() {
  // Only initialize if we're on an article page
  const article = document.querySelector('article');
  if (!article) {
    try { console.log('[article] no article element found, skipping initialization'); } catch (e) {}
    return;
  }

  try { console.log('[article] initializing article features'); } catch (e) {}

  // Initialize reading progress bar
  const progressBar = new ReadingProgressBar();
  window.readingProgressBar = progressBar;

  // Initialize copy buttons
  initializeCopyButtons();

  // Check for dictionary links and ensure tooltip functionality is loaded
  const dictionaryLinks = document.querySelectorAll('.dictionary-link');
  if (dictionaryLinks.length > 0) {
    try { console.log('[article] dictionary links found, ensuring tooltip functionality'); } catch (e) {}
    // Dictionary tooltips are automatically handled by Shoelace autoloader
    // when sl-tooltip elements are present
  }
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeArticleFeatures);
  } else {
    // DOM is already ready
    initializeArticleFeatures();
  }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ReadingProgressBar,
    addCopyButtonsToCodeBlocks,
    initializeCopyButtons,
    initializeArticleFeatures
  };
}