/**
 * BurgerMenu Web Component
 * Light DOM component for mobile navigation toggle
 */
class BurgerMenu extends HTMLElement {
  constructor() {
    super();
    this._boundToggle = this.toggle.bind(this);
    this._boundOnOverlayClick = this._onOverlayClick.bind(this);
    this._boundOnKeydown = this._onKeydown.bind(this);
    this._boundOnNavLinkClick = this._onNavLinkClick.bind(this);
    this._boundOnMouseEnter = this._onMouseEnter.bind(this);
    this._boundOnMouseLeave = this._onMouseLeave.bind(this);
  }

  connectedCallback() {
    this._trigger = this.querySelector('[data-trigger]');
    this._button = this.querySelector('.burger-button');

    // Find overlay by ID attribute or within component
    const overlayId = this.getAttribute('overlay-id');
    this._overlay = overlayId
      ? document.getElementById(overlayId)
      : this.querySelector('[data-overlay]');

    if (!this._trigger || !this._overlay) {
      console.warn('BurgerMenu: Missing required [data-trigger] or overlay element');
      return;
    }

    this._trigger.addEventListener('click', this._boundToggle);
    this._overlay.addEventListener('click', this._boundOnOverlayClick);
    document.addEventListener('keydown', this._boundOnKeydown);

    // Close menu when nav links clicked
    this._navLinks = this.querySelectorAll('.burger-nav-link');
    this._navLinks.forEach(link => {
      link.addEventListener('click', this._boundOnNavLinkClick);
    });

    // Hover effect
    this._trigger.addEventListener('mouseenter', this._boundOnMouseEnter);
    this._trigger.addEventListener('mouseleave', this._boundOnMouseLeave);
  }

  disconnectedCallback() {
    this._trigger?.removeEventListener('click', this._boundToggle);
    this._overlay?.removeEventListener('click', this._boundOnOverlayClick);
    document.removeEventListener('keydown', this._boundOnKeydown);

    this._navLinks?.forEach(link => {
      link.removeEventListener('click', this._boundOnNavLinkClick);
    });

    this._trigger?.removeEventListener('mouseenter', this._boundOnMouseEnter);
    this._trigger?.removeEventListener('mouseleave', this._boundOnMouseLeave);
  }

  get isOpen() {
    return this._button?.classList.contains('active') ?? false;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this._button?.classList.add('active');
    this._overlay?.classList.add('active');
    this._trigger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    this.dispatchEvent(new CustomEvent('burger-open', { bubbles: true }));
  }

  close() {
    this._button?.classList.remove('active');
    this._overlay?.classList.remove('active');
    this._trigger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    this.dispatchEvent(new CustomEvent('burger-close', { bubbles: true }));
  }

  _onOverlayClick(e) {
    // Only close if clicking overlay background, not menu content
    if (e.target === this._overlay) {
      this.toggle();
    }
  }

  _onKeydown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  _onNavLinkClick() {
    setTimeout(() => this.close(), 150);
  }

  _onMouseEnter() {
    if (!this.isOpen && this._button) {
      this._button.style.transform = 'scale(1.05)';
    }
  }

  _onMouseLeave() {
    if (!this.isOpen && this._button) {
      this._button.style.transform = 'scale(1)';
    }
  }
}

// Register component
customElements.define('burger-menu', BurgerMenu);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BurgerMenu };
}
