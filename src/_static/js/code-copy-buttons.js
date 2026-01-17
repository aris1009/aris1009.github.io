/**
 * Code Copy Buttons
 * Adds Shoelace sl-copy-button components to all code blocks for easy copying
 * Integrates with Prism.js, Mermaid.js and handles dynamic content
 */

/**
 * Creates a copy button element with standard attributes
 */
function createCopyButton(textToCopy, label = 'Copy code snippet') {
  const copyButton = document.createElement('sl-copy-button');
  copyButton.value = textToCopy;
  copyButton.className = 'code-copy-button';

  // Accessibility attributes
  copyButton.setAttribute('aria-label', label);
  copyButton.setAttribute('copy-label', 'Copy');
  copyButton.setAttribute('success-label', 'Copied!');
  copyButton.setAttribute('error-label', 'Copy failed');
  copyButton.setAttribute('feedback-duration', '1500');
  copyButton.setAttribute('data-testid', 'code-copy-button');

  // Event listeners for feedback
  copyButton.addEventListener('sl-copy', () => {
    console.log('Code copied successfully');
  });

  copyButton.addEventListener('sl-error', (e) => {
    console.error('Copy failed:', e);
  });

  return copyButton;
}

/**
 * Wraps a pre element with a wrapper div and adds a copy button
 */
function wrapWithCopyButton(pre, textToCopy, label) {
  const wrapper = document.createElement('div');
  wrapper.className = 'code-block-wrapper';

  const copyButton = createCopyButton(textToCopy, label);

  pre.parentNode.insertBefore(wrapper, pre);
  wrapper.appendChild(pre);
  wrapper.appendChild(copyButton);

  pre.classList.add('has-copy-button');
}

/**
 * Adds copy buttons to mermaid diagram blocks
 * Must run BEFORE mermaid.js renders the diagrams
 */
function addCopyButtonsToMermaidBlocks() {
  document.querySelectorAll('pre.mermaid:not(.has-copy-button)').forEach(pre => {
    // Store original source before mermaid transforms it
    const mermaidSource = pre.textContent;
    pre.setAttribute('data-mermaid-source', mermaidSource);

    wrapWithCopyButton(pre, mermaidSource, 'Copy diagram source');
  });
}

function addCopyButtonsToCodeBlocks() {
  // Process only code blocks that don't already have copy buttons
  document.querySelectorAll('pre[class*="language-"]:not(.has-copy-button)').forEach(pre => {
    const codeElement = pre.querySelector('code');
    if (!codeElement) return;

    // Get the raw text content (unformatted)
    const codeText = codeElement.textContent;

    wrapWithCopyButton(pre, codeText, 'Copy code snippet');
  });
}

// Enhanced initialization with multiple fallbacks
function initializeCopyButtons() {
  // Process mermaid blocks FIRST, before mermaid.js renders them
  // This must happen early to capture the original source text
  addCopyButtonsToMermaidBlocks();

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
    let shouldProcessCode = false;
    let shouldProcessMermaid = false;

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check for code blocks
          if (node.matches && node.matches('pre[class*="language-"]')) {
            shouldProcessCode = true;
          } else if (node.querySelector && node.querySelector('pre[class*="language-"]')) {
            shouldProcessCode = true;
          }
          // Check for mermaid blocks
          if (node.matches && node.matches('pre.mermaid')) {
            shouldProcessMermaid = true;
          } else if (node.querySelector && node.querySelector('pre.mermaid')) {
            shouldProcessMermaid = true;
          }
        }
      });
    });

    if (shouldProcessCode || shouldProcessMermaid) {
      // Use requestIdleCallback for better performance
      if (window.requestIdleCallback) {
        requestIdleCallback(() => {
          if (shouldProcessMermaid) addCopyButtonsToMermaidBlocks();
          if (shouldProcessCode) addCopyButtonsToCodeBlocks();
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          if (shouldProcessMermaid) addCopyButtonsToMermaidBlocks();
          if (shouldProcessCode) addCopyButtonsToCodeBlocks();
        }, 0);
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
    addCopyButtonsToMermaidBlocks,
    initializeCopyButtons
  };
}