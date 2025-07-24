import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * @vitest-environment jsdom
 */

// Mock ThemeManager class for testing
class ThemeManager {
  constructor() {
    this.init();
  }

  init() {
    this.initializeTheme();
    this.setupToggleButton();
    
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

describe('Theme Management', () => {
  let themeManager;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '<button id="theme-toggle"></button>';
    
    // Mock localStorage
    const localStorageMock = {
      data: {},
      getItem: vi.fn((key) => localStorageMock.data[key] || null),
      setItem: vi.fn((key, value) => { localStorageMock.data[key] = value; }),
      removeItem: vi.fn((key) => { delete localStorageMock.data[key]; }),
      clear: vi.fn(() => { localStorageMock.data = {}; })
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock matchMedia
    window.matchMedia = vi.fn((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Theme Initialization', () => {
    it('should default to light theme when no localStorage or system preference', () => {
      window.matchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn()
      }));

      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme()).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('sl-theme-dark')).toBe(false);
    });

    it('should default to dark theme when system prefers dark', () => {
      window.matchMedia = vi.fn((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        addEventListener: vi.fn()
      }));

      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('sl-theme-dark')).toBe(true);
    });

    it('should use localStorage preference over system preference', () => {
      window.matchMedia = vi.fn((query) => ({
        matches: query === '(prefers-color-scheme: dark)', // System prefers dark
        addEventListener: vi.fn()
      }));
      localStorage.setItem('theme', 'light'); // But user chose light

      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme()).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should respect dark theme from localStorage', () => {
      window.matchMedia = vi.fn(() => ({
        matches: false, // System prefers light
        addEventListener: vi.fn()
      }));
      localStorage.setItem('theme', 'dark'); // But user chose dark

      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('sl-theme-dark')).toBe(true);
    });
  });

  describe('Theme Toggle', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn()
      }));
      themeManager = new ThemeManager();
    });

    it('should toggle from light to dark', () => {
      // Start with light theme
      expect(themeManager.getCurrentTheme()).toBe('light');
      
      // Toggle to dark
      const newTheme = themeManager.toggle();
      
      expect(newTheme).toBe('dark');
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('sl-theme-dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      // Start with dark theme
      themeManager.setTheme('dark');
      expect(themeManager.getCurrentTheme()).toBe('dark');
      
      // Toggle to light
      const newTheme = themeManager.toggle();
      
      expect(newTheme).toBe('light');
      expect(themeManager.getCurrentTheme()).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('sl-theme-dark')).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should persist theme changes to localStorage', () => {
      themeManager.setTheme('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
      
      themeManager.setTheme('light');
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });

  describe('Theme Event Dispatching', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn()
      }));
      themeManager = new ThemeManager();
    });

    it('should dispatch themeChanged event when theme changes', () => {
      const eventSpy = vi.fn();
      document.addEventListener('themeChanged', eventSpy);
      
      themeManager.setTheme('dark');
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { theme: 'dark' }
        })
      );
    });
  });

  describe('System Theme Change Handling', () => {
    it('should set up system theme change listener', () => {
      const mockMatchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn()
      }));
      window.matchMedia = mockMatchMedia;

      themeManager = new ThemeManager();
      
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should handle system theme change when no saved preference', () => {
      let systemChangeCallback;
      const mockMatchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn((event, callback) => {
          systemChangeCallback = callback;
        })
      }));
      window.matchMedia = mockMatchMedia;

      themeManager = new ThemeManager();
      expect(themeManager.getCurrentTheme()).toBe('light');

      // Simulate system theme change to dark when no saved preference
      if (systemChangeCallback) {
        systemChangeCallback({ matches: true });
        expect(themeManager.getCurrentTheme()).toBe('dark');
      }
    });

    it('should not change theme for system preference when user has saved preference', () => {
      localStorage.setItem('theme', 'light');
      
      let systemChangeCallback;
      const mockMatchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn((event, callback) => {
          systemChangeCallback = callback;
        })
      }));
      window.matchMedia = mockMatchMedia;

      themeManager = new ThemeManager();
      expect(themeManager.getCurrentTheme()).toBe('light');

      // Simulate system theme change when user has preference
      if (systemChangeCallback) {
        systemChangeCallback({ matches: true });
        // Should remain light because user explicitly chose light
        expect(themeManager.getCurrentTheme()).toBe('light');
      }
    });
  });

  describe('CSS Class Management', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn()
      }));
      themeManager = new ThemeManager();
    });

    it('should add both dark and sl-theme-dark classes for dark theme', () => {
      themeManager.setTheme('dark');
      
      const html = document.documentElement;
      expect(html.classList.contains('dark')).toBe(true);
      expect(html.classList.contains('sl-theme-dark')).toBe(true);
    });

    it('should remove both dark and sl-theme-dark classes for light theme', () => {
      // First set dark theme
      themeManager.setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('sl-theme-dark')).toBe(true);
      
      // Then set light theme
      themeManager.setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('sl-theme-dark')).toBe(false);
    });
  });

  describe('Toggle Button Integration', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn()
      }));
    });

    it('should set up click listener for theme toggle button', () => {
      const toggleButton = document.getElementById('theme-toggle');
      const clickSpy = vi.fn();
      toggleButton.addEventListener = vi.fn((event, callback) => {
        if (event === 'click') clickSpy.mockImplementation(callback);
      });

      themeManager = new ThemeManager();
      
      expect(toggleButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should handle missing toggle button gracefully', () => {
      // Remove the toggle button
      document.getElementById('theme-toggle').remove();
      
      // Should not throw an error
      expect(() => {
        themeManager = new ThemeManager();
      }).not.toThrow();
    });
  });
});