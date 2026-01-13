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

    // Switch Prism theme
    const prismLink = document.getElementById('prism-theme');
    if (prismLink) {
      prismLink.href = theme === 'dark' ? '/_css/prism-dark.css' : '/_css/prism-light.css';
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