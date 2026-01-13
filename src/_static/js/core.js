// Core functionality bundle - critical features that load immediately
// Combines ThemeManager, LanguageSelector, BurgerMenu, and common utilities

// Common utility functions
class Utils {
  static ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      timeout = setTimeout(later, wait);
    };
  }
}

// Theme Manager - handles light/dark mode switching
class ThemeManager {
  constructor() {
    this.init();
  }

  init() {
    // Set initial theme based on saved preference or system preference
    this.initializeTheme();

    // Set up theme toggle button listener
    this.setupToggleButton();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let theme;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      theme = savedTheme;
    } else {
      theme = systemPrefersDark ? 'dark' : 'light';
    }

    // Only set if different from current state to avoid unnecessary DOM manipulation
    const currentTheme = this.getCurrentTheme();
    if (currentTheme !== theme) {
      this.setTheme(theme);
    }
  }

  setupToggleButton() {
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        this.toggle();
      });
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
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
}

// Language Selector - handles language switching
class LanguageSelector {
  constructor() {
    this.languages = {
      'en-us': { flag: '🇺🇸' },
      'el': { flag: '🇬🇷' },
      'tr': { flag: '🇹🇷' }
    };
    this.init();
  }

  init() {
    const languageContainer = document.querySelector('.language-selector-container');
    const currentLanguageDisplay = document.getElementById('current-language');
    const languageOptions = document.querySelectorAll('.language-option');

    if (!languageContainer || !currentLanguageDisplay) {
      return;
    }

    // Get saved language or default to English
    this.currentLanguage = localStorage.getItem('language') || 'en-us';

    // Initialize display with current language
    this.updateLanguageDisplay(this.currentLanguage);

    // Handle language option clicks
    languageOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = option.getAttribute('data-lang');

        if (selectedLang && this.languages[selectedLang]) {
          this.currentLanguage = selectedLang;
          this.updateLanguageDisplay(selectedLang);
          localStorage.setItem('language', selectedLang);

          // Force dropdown to close immediately after selection
          languageContainer.style.pointerEvents = 'none';
          setTimeout(() => {
            languageContainer.style.pointerEvents = 'auto';
          }, 300);

          // Optional: Trigger page reload or language change event
          console.log('Language changed to:', selectedLang);
        }
      });
    });
  }

  updateLanguageDisplay(langCode) {
    const currentLanguageDisplay = document.getElementById('current-language');
    const lang = this.languages[langCode];
    if (lang && currentLanguageDisplay) {
      currentLanguageDisplay.innerHTML = `<span class="flag">${lang.flag}</span>`;
    }
  }
}

// Burger Menu - handles mobile navigation
class BurgerMenu {
  constructor() {
    this.init();
  }

  init() {
    const burgerToggle = document.getElementById('burger-toggle');
    const burgerOverlay = document.getElementById('burger-overlay');
    const burgerButton = document.querySelector('.burger-button');

    if (!burgerToggle || !burgerOverlay) {
      return;
    }

    // Function to toggle burger menu
    const toggleBurgerMenu = () => {
      const isActive = burgerButton.classList.contains('active');

      if (isActive) {
        // Close menu
        burgerButton.classList.remove('active');
        burgerOverlay.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        // Open menu
        burgerButton.classList.add('active');
        burgerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    };

    // Burger button click handler
    burgerToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBurgerMenu();
    });

    // Close menu when clicking on overlay background (not on menu content)
    burgerOverlay.addEventListener('click', (e) => {
      if (e.target === burgerOverlay) {
        toggleBurgerMenu();
      }
    });

    // Close menu when clicking on navigation links
    const navLinks = document.querySelectorAll('.burger-nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Small delay to allow navigation to start
        setTimeout(() => {
          toggleBurgerMenu();
        }, 150);
      });
    });

    // Close menu with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burgerButton.classList.contains('active')) {
        toggleBurgerMenu();
      }
    });

    // Handle hover effect for burger button
    burgerToggle.addEventListener('mouseenter', () => {
      if (!burgerButton.classList.contains('active')) {
        burgerButton.style.transform = 'scale(1.05)';
      }
    });

    burgerToggle.addEventListener('mouseleave', () => {
      if (!burgerButton.classList.contains('active')) {
        burgerButton.style.transform = 'scale(1)';
      }
    });
  }
}

// Initialize all core components when DOM is ready
Utils.ready(() => {
  const themeManager = new ThemeManager();
  window.themeManager = themeManager;

  const languageSelector = new LanguageSelector();
  window.languageSelector = languageSelector;

  const burgerMenu = new BurgerMenu();
  window.burgerMenu = burgerMenu;
});