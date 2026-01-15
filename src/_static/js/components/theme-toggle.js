/**
 * ThemeToggle Web Component
 * Light DOM component for dark/light mode switching
 */
class ThemeToggle extends HTMLElement {
  constructor() {
    super();
    this._boundToggle = this.toggle.bind(this);
    this._boundOnSystemChange = this._onSystemChange.bind(this);
  }

  connectedCallback() {
    this._trigger = this.querySelector('[data-trigger]');

    if (!this._trigger) {
      console.warn('ThemeToggle: Missing [data-trigger] element');
      return;
    }

    // Set up toggle button listener
    this._trigger.addEventListener('click', this._boundToggle);

    // Listen for system theme changes
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaQuery.addEventListener('change', this._boundOnSystemChange);

    // Expose for external access
    window.themeManager = this;
  }

  disconnectedCallback() {
    this._trigger?.removeEventListener('click', this._boundToggle);
    this._mediaQuery?.removeEventListener('change', this._boundOnSystemChange);

    if (window.themeManager === this) {
      window.themeManager = null;
    }
  }

  _onSystemChange(e) {
    // Only follow system preference if user hasn't set explicit preference
    if (!localStorage.getItem('theme')) {
      this.setTheme(e.matches ? 'dark' : 'light');
    }
  }

  setTheme(theme) {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.add('sl-theme-dark');
    } else {
      html.classList.remove('dark');
      html.classList.remove('sl-theme-dark');
    }

    localStorage.setItem('theme', theme);

    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme }
    }));
  }

  toggle() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
}

// Register component
customElements.define('theme-toggle', ThemeToggle);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeToggle };
}
