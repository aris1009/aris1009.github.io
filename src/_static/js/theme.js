class ThemeManager {
  constructor() {
    this.init();
  }

  init() {
    // Set up theme toggle button listener
    this.setupToggleButton();
    
    // Sync button state with current theme
    this.syncButtonState();
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  setupToggleButton() {
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        this.toggle();
      });
    }
  }

  syncButtonState() {
    const toggleButton = document.getElementById('theme-toggle');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (toggleButton) {
      if (isDark) {
        toggleButton.classList.add('dark');
      } else {
        toggleButton.classList.remove('dark');
      }
    }
  }

  setTheme(theme) {
    const html = document.documentElement;
    const toggleButton = document.getElementById('theme-toggle');
    
    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.add('sl-theme-dark');
      if (toggleButton) toggleButton.classList.add('dark');
    } else {
      html.classList.remove('dark');
      html.classList.remove('sl-theme-dark');
      if (toggleButton) toggleButton.classList.remove('dark');
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

// Initialize when DOM is ready
function initThemeManager() {
  const themeManager = new ThemeManager();
  window.themeManager = themeManager;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeManager);
} else {
  initThemeManager();
}