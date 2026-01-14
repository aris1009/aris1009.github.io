/**
 * Prism.js Dynamic Language Loader
 * Loads only the language bundles needed for syntax highlighting on the current page
 */
(function() {
  'use strict';

  // Map of language names to their bundle files
  const languageBundles = {
    'markup': 'prism-markup.js',
    'html': 'prism-markup.js',
    'xml': 'prism-markup.js',
    'svg': 'prism-markup.js',
    'mathml': 'prism-markup.js',
    'ssml': 'prism-markup.js',
    'atom': 'prism-markup.js',
    'rss': 'prism-markup.js',
    'css': 'prism-css.js',
    'javascript': 'prism-javascript.js',
    'js': 'prism-javascript.js',
    'json': 'prism-javascript.js',
    'jsonp': 'prism-javascript.js',
    'bash': 'prism-bash.js',
    'shell': 'prism-bash.js',
    'sh': 'prism-bash.js',
    'markdown': 'prism-markdown.js',
    'md': 'prism-markdown.js'
  };

  // Track loaded bundles to avoid duplicate loading
  const loadedBundles = new Set();

  /**
   * Load a language bundle dynamically
   * @param {string} language - The language to load
   * @returns {Promise} Promise that resolves when the bundle is loaded
   */
  function loadLanguageBundle(language) {
    const bundleFile = languageBundles[language.toLowerCase()];
    if (!bundleFile) {
      return Promise.resolve(); // Language not supported, but don't fail
    }

    if (loadedBundles.has(bundleFile)) {
      return Promise.resolve(); // Already loaded
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/_static/js/${bundleFile}`;
      script.onload = () => {
        loadedBundles.add(bundleFile);
        resolve();
      };
      script.onerror = () => {
        console.warn(`Failed to load Prism.js language bundle: ${bundleFile}`);
        reject(new Error(`Failed to load ${bundleFile}`));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Find all code blocks on the page and collect unique languages
   * @returns {Set<string>} Set of languages found on the page
   */
  function findLanguagesOnPage() {
    const languages = new Set();
    const codeBlocks = document.querySelectorAll('code[class*="language-"]');

    codeBlocks.forEach(block => {
      const classList = block.className.split(' ');
      classList.forEach(cls => {
        if (cls.startsWith('language-')) {
          const language = cls.substring(9); // Remove 'language-' prefix
          if (language) {
            languages.add(language);
          }
        }
      });
    });

    return languages;
  }

  /**
   * Initialize dynamic loading when Prism is ready
   */
  function initDynamicLoading() {
    // Wait for Prism to be available
    if (typeof Prism === 'undefined') {
      setTimeout(initDynamicLoading, 10);
      return;
    }

    const languages = findLanguagesOnPage();

    if (languages.size === 0) {
      return; // No code blocks found
    }

    // Load all required language bundles
    const loadPromises = Array.from(languages).map(language => loadLanguageBundle(language));

    Promise.all(loadPromises).then(() => {
      // All bundles loaded, now highlight all code blocks
      Prism.highlightAll();
    }).catch(error => {
      console.warn('Some Prism.js language bundles failed to load:', error);
      // Still try to highlight with whatever is available
      Prism.highlightAll();
    });
  }

  // Start the process when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDynamicLoading);
  } else {
    initDynamicLoading();
  }

})();