/**
 * LanguageSelector Web Component
 * Light DOM component for language switching dropdown
 */
class LanguageSelector extends HTMLElement {
  constructor() {
    super();
    this._boundOnOptionClick = this._onOptionClick.bind(this);
  }

  static get LANGUAGES() {
    return {
      'en-us': { flag: '🇺🇸' },
      'el': { flag: '🇬🇷' },
      'tr': { flag: '🇹🇷' }
    };
  }

  static get LANG_PREFIXES() {
    return ['/en-us/', '/el/', '/tr/', '/blog/en-us/', '/blog/el/', '/blog/tr/'];
  }

  connectedCallback() {
    this._container = this.querySelector('.language-selector-container') || this;
    this._display = this.querySelector('#current-language');
    this._options = this.querySelectorAll('.language-option');

    if (!this._display) {
      console.warn('LanguageSelector: Missing #current-language element');
      return;
    }

    // Generate hrefs for options based on current URL
    this._generateLinks();

    // Bind click handlers to options
    this._options.forEach(option => {
      option.addEventListener('click', this._boundOnOptionClick);
    });
  }

  _generateLinks() {
    const path = window.location.pathname;
    const { basePath, isBlog } = this._parsePath(path);

    this._options.forEach(option => {
      const lang = option.getAttribute('data-lang');
      if (lang) {
        option.href = this._buildUrl(lang, basePath, isBlog);
      }
    });
  }

  _parsePath(path) {
    // Check if it's a blog post
    const isBlog = path.startsWith('/blog/');

    // Strip language prefix to get base path
    let basePath = path;
    for (const prefix of LanguageSelector.LANG_PREFIXES) {
      if (path.startsWith(prefix)) {
        basePath = path.slice(prefix.length - 1); // Keep leading slash
        break;
      }
    }

    // Handle root paths
    if (basePath === '/' || basePath === '') {
      basePath = '/';
    }

    return { basePath, isBlog };
  }

  _buildUrl(lang, basePath, isBlog) {
    if (isBlog) {
      return `/blog/${lang}${basePath}`;
    }

    // Home page special case
    if (basePath === '/') {
      return lang === 'en-us' ? '/' : `/${lang}/`;
    }

    return `/${lang}${basePath}`;
  }

  disconnectedCallback() {
    this._options?.forEach(option => {
      option.removeEventListener('click', this._boundOnOptionClick);
    });
  }

  _onOptionClick(e) {
    e.preventDefault(); // Prevent immediate navigation

    const selectedLang = e.currentTarget.getAttribute('data-lang');
    const targetUrl = e.currentTarget.href;

    if (selectedLang && LanguageSelector.LANGUAGES[selectedLang]) {
      // Save to localStorage
      localStorage.setItem('language', selectedLang);

      // Update display
      this._updateDisplay(selectedLang);

      // Force dropdown close by temporarily disabling pointer events
      this._container.style.pointerEvents = 'none';
      setTimeout(() => {
        this._container.style.pointerEvents = 'auto';
      }, 300);

      // Dispatch event for external listeners
      this.dispatchEvent(new CustomEvent('language-change', {
        bubbles: true,
        detail: { language: selectedLang }
      }));

      // Check if target URL exists before navigating
      this._checkAndNavigate(targetUrl, selectedLang);
    }
  }

  async _checkAndNavigate(targetUrl, lang) {
    try {
      const response = await fetch(targetUrl, { method: 'HEAD' });

      if (response.ok) {
        // Page exists, navigate normally
        window.location.href = targetUrl;
      } else {
        // Page doesn't exist, redirect to post-not-translated
        window.location.href = `/${lang}/post-not-translated/`;
      }
    } catch (error) {
      // Network error, try to navigate anyway
      window.location.href = targetUrl;
    }
  }

  _updateDisplay(langCode) {
    const lang = LanguageSelector.LANGUAGES[langCode];
    if (lang && this._display) {
      // Clear existing content safely
      while (this._display.firstChild) {
        this._display.removeChild(this._display.firstChild);
      }
      // Create flag span safely
      const flagSpan = document.createElement('span');
      flagSpan.className = 'flag';
      flagSpan.textContent = lang.flag;
      this._display.appendChild(flagSpan);
    }
  }

  get currentLanguage() {
    return localStorage.getItem('language') || 'en-us';
  }
}

// Register component
customElements.define('language-selector', LanguageSelector);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LanguageSelector };
}
