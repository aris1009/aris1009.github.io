/**
 * LanguageSelector Web Component
 *
 * Progressive enhancement over server-rendered anchor tags. Every option's
 * href is computed at build time (eleventy I18nPlugin + languageSwitcherOptions
 * filter), so the browser navigates through normal anchor semantics.
 */
class LanguageSelector extends HTMLElement {
  constructor() {
    super();
    this._onOptionClick = this._onOptionClick.bind(this);
  }

  connectedCallback() {
    this._container = this.querySelector('.language-selector-container') || this;
    this._options = this.querySelectorAll('.language-option');
    this._options.forEach(option => option.addEventListener('click', this._onOptionClick));
  }

  disconnectedCallback() {
    this._options?.forEach(option => option.removeEventListener('click', this._onOptionClick));
  }

  _onOptionClick(e) {
    const lang = e.currentTarget.getAttribute('data-lang');
    if (!lang) return;

    if (this._container) {
      this._container.style.pointerEvents = 'none';
      setTimeout(() => { this._container.style.pointerEvents = 'auto'; }, 300);
    }

    this.dispatchEvent(new CustomEvent('language-change', {
      bubbles: true,
      detail: { language: lang }
    }));
  }
}

customElements.define('language-selector', LanguageSelector);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LanguageSelector };
}
