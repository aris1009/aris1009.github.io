/**
 * Code Copy Buttons
 * Adds Shoelace sl-copy-button components to all code blocks for easy copying
 * Integrates with Prism.js and handles dynamic content
 */

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

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCopyButtons);
  } else {
    // DOM is already ready
    initializeCopyButtons();
  }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addCopyButtonsToCodeBlocks,
    initializeCopyButtons
  };
}