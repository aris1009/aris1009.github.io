/**
 * Mermaid Theme Synchronization
 * 
 * This script synchronizes Mermaid diagram themes with the site's theme toggle.
 * When the user switches between light and dark mode, diagrams are re-rendered
 * with the appropriate Mermaid theme.
 */

(function() {
  'use strict';

  // Theme mapping: site theme -> Mermaid theme
  const MERMAID_THEMES = {
    light: 'default',
    dark: 'dark'
  };

  /**
   * Get current site theme
   */
  function getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  /**
   * Re-render all Mermaid diagrams with the specified theme
   */
  async function updateMermaidTheme(theme) {
    // Check if Mermaid is loaded
    if (typeof mermaid === 'undefined') {
      return;
    }

    const mermaidTheme = MERMAID_THEMES[theme] || MERMAID_THEMES.light;

    // Re-initialize Mermaid with new theme
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'loose'
    });

    // Find all mermaid containers
    const mermaidContainers = document.querySelectorAll('pre.mermaid');
    
    if (mermaidContainers.length === 0) {
      return;
    }

    // Re-render each diagram
    for (const container of mermaidContainers) {
      // Get original diagram source (stored in data attribute or use current text)
      let source = container.getAttribute('data-mermaid-source');
      
      if (!source) {
        // First render - store the original source
        source = container.textContent;
        container.setAttribute('data-mermaid-source', source);
      }

      // Clear existing rendered content
      container.innerHTML = source;
      
      // Remove processed markers so Mermaid will re-render
      container.removeAttribute('data-processed');
    }

    // Re-run Mermaid rendering
    try {
      await mermaid.run({
        nodes: mermaidContainers
      });
    } catch (error) {
      console.error('Mermaid re-render failed:', error);
    }
  }

  /**
   * Initialize theme sync
   */
  function init() {
    // Listen for theme change events from the theme toggle
    document.addEventListener('themeChanged', function(event) {
      const newTheme = event.detail?.theme || getCurrentTheme();
      updateMermaidTheme(newTheme);
    });

    // Also handle direct class changes (for initial load)
    const observer = new MutationObserver(function(mutations) {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          const theme = getCurrentTheme();
          updateMermaidTheme(theme);
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Set initial theme after Mermaid has loaded
    if (document.readyState === 'complete') {
      setTimeout(() => updateMermaidTheme(getCurrentTheme()), 100);
    } else {
      window.addEventListener('load', function() {
        setTimeout(() => updateMermaidTheme(getCurrentTheme()), 100);
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
