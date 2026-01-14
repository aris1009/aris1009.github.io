// Prism.js Code Features Bundle
// Initializes Prism syntax highlighting and language support

// Initialize Prism.js when DOM is ready
function initPrism() {
  if (window.Prism) {
    console.log('Prism.js code features initialized');

    // Trigger highlighting on existing code blocks
    if (typeof Prism.highlightAll === 'function') {
      Prism.highlightAll();
    }

    // Hook into Prism after highlighting for any additional processing
    if (Prism.hooks) {
      Prism.hooks.add('after-highlight', (env) => {
        // Any post-highlighting processing can go here
        console.log('Prism highlighted:', env.language);
      });
    }
  } else {
    console.warn('Prism.js not found - code highlighting may not work');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrism);
} else {
  initPrism();
}

// Export default for dynamic import
export default initPrism;