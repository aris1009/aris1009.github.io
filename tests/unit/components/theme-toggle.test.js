import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for theme-toggle web component
 */

describe('ThemeToggle Web Component', () => {
  let ThemeToggle;
  let mockTrigger;
  let mockHtml;
  let mockLocalStorage;
  let mockMediaQuery;

  beforeEach(async () => {
    vi.resetModules();

    // Mock localStorage
    mockLocalStorage = {
      store: {},
      getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage.store[key] = value; })
    };
    vi.stubGlobal('localStorage', mockLocalStorage);

    // Mock trigger element
    mockTrigger = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock documentElement (html)
    mockHtml = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false)
      }
    };

    // Mock media query
    mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock window
    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => mockMediaQuery),
      themeManager: null
    });

    // Mock document
    vi.stubGlobal('document', {
      documentElement: mockHtml,
      dispatchEvent: vi.fn()
    });

    // Mock console
    vi.stubGlobal('console', { warn: vi.fn() });

    // Mock HTMLElement
    class MockHTMLElement {
      constructor() {
        this._trigger = null;
        this._mediaQuery = null;
      }
      querySelector(selector) {
        if (selector === '[data-trigger]') return mockTrigger;
        return null;
      }
    }

    vi.stubGlobal('HTMLElement', MockHTMLElement);
    vi.stubGlobal('CustomEvent', class {
      constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
      }
    });
    vi.stubGlobal('customElements', { define: vi.fn() });

    // Import the module
    const module = await import('src/_static/js/components/theme-toggle.js');
    ThemeToggle = module.ThemeToggle;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('connectedCallback', () => {
    it('should find trigger element', () => {
      const toggle = new ThemeToggle();
      toggle.connectedCallback();

      expect(toggle._trigger).toBe(mockTrigger);
    });

    it('should add click listener to trigger', () => {
      const toggle = new ThemeToggle();
      toggle.connectedCallback();

      expect(mockTrigger.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should set up system theme change listener', () => {
      const toggle = new ThemeToggle();
      toggle.connectedCallback();

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should expose as window.themeManager', () => {
      const toggle = new ThemeToggle();
      toggle.connectedCallback();

      expect(window.themeManager).toBe(toggle);
    });

    it('should warn if trigger element is missing', () => {
      const toggle = new ThemeToggle();
      toggle.querySelector = () => null;
      toggle.connectedCallback();

      expect(console.warn).toHaveBeenCalledWith('ThemeToggle: Missing [data-trigger] element');
    });
  });

  describe('disconnectedCallback', () => {
    it('should remove event listeners', () => {
      const toggle = new ThemeToggle();
      toggle.connectedCallback();
      toggle.disconnectedCallback();

      expect(mockTrigger.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should clear window.themeManager', () => {
      const toggle = new ThemeToggle();
      toggle.connectedCallback();
      expect(window.themeManager).toBe(toggle);

      toggle.disconnectedCallback();
      expect(window.themeManager).toBeNull();
    });
  });

  describe('setTheme', () => {
    it('should add dark classes for dark theme', () => {
      const toggle = new ThemeToggle();
      toggle.setTheme('dark');

      expect(mockHtml.classList.add).toHaveBeenCalledWith('dark');
      expect(mockHtml.classList.add).toHaveBeenCalledWith('sl-theme-dark');
    });

    it('should remove dark classes for light theme', () => {
      const toggle = new ThemeToggle();
      toggle.setTheme('light');

      expect(mockHtml.classList.remove).toHaveBeenCalledWith('dark');
      expect(mockHtml.classList.remove).toHaveBeenCalledWith('sl-theme-dark');
    });

    it('should save theme to localStorage', () => {
      const toggle = new ThemeToggle();
      toggle.setTheme('dark');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should dispatch themeChanged event', () => {
      const toggle = new ThemeToggle();
      toggle.setTheme('dark');

      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'themeChanged',
          detail: { theme: 'dark' }
        })
      );
    });
  });

  describe('toggle', () => {
    it('should toggle from light to dark', () => {
      mockHtml.classList.contains.mockReturnValue(false); // Currently light

      const toggle = new ThemeToggle();
      const newTheme = toggle.toggle();

      expect(newTheme).toBe('dark');
      expect(mockHtml.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should toggle from dark to light', () => {
      mockHtml.classList.contains.mockReturnValue(true); // Currently dark

      const toggle = new ThemeToggle();
      const newTheme = toggle.toggle();

      expect(newTheme).toBe('light');
      expect(mockHtml.classList.remove).toHaveBeenCalledWith('dark');
    });
  });

  describe('getCurrentTheme', () => {
    it('should return dark when dark class is present', () => {
      mockHtml.classList.contains.mockReturnValue(true);

      const toggle = new ThemeToggle();
      expect(toggle.getCurrentTheme()).toBe('dark');
    });

    it('should return light when dark class is absent', () => {
      mockHtml.classList.contains.mockReturnValue(false);

      const toggle = new ThemeToggle();
      expect(toggle.getCurrentTheme()).toBe('light');
    });
  });

  describe('system theme change handling', () => {
    it('should follow system preference when no saved preference', () => {
      const toggle = new ThemeToggle();
      toggle.connectedCallback();

      // Get the change handler
      const changeHandler = mockMediaQuery.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];

      // Simulate system change to dark
      changeHandler({ matches: true });

      expect(mockHtml.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should ignore system preference when user has saved preference', () => {
      mockLocalStorage.store['theme'] = 'light';

      const toggle = new ThemeToggle();
      toggle.connectedCallback();

      const changeHandler = mockMediaQuery.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];

      // Simulate system change to dark
      changeHandler({ matches: true });

      // Should not change theme because user explicitly chose light
      expect(mockHtml.classList.add).not.toHaveBeenCalledWith('dark');
    });
  });

  describe('component registration', () => {
    it('should register custom element', () => {
      expect(customElements.define).toHaveBeenCalledWith('theme-toggle', ThemeToggle);
    });
  });
});
