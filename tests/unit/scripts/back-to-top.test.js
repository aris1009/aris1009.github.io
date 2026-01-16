import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for back-to-top.js functionality
 * Tests the core logic without requiring browser DOM manipulation
 */

describe('Back to Top Button', () => {
  let mockButton;
  let mockConsole;
  let mockDocument;
  let mockWindow;

  beforeEach(() => {
    // Mock console methods
    mockConsole = {
      warn: vi.fn()
    };

    // Mock button element with proper classList behavior
    mockButton = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false)
      },
      addEventListener: vi.fn(),
      style: {}
    };

    // Mock article element
    const mockArticle = { dataset: { blogPost: '' } };

    // Mock document
    mockDocument = {
      getElementById: vi.fn((id) => {
        if (id === 'back-to-top') return mockButton;
        return null;
      }),
      querySelector: vi.fn((selector) => {
        if (selector === 'article[data-blog-post]') return mockArticle;
        return null;
      })
    };

    // Mock window
    mockWindow = {
      scrollY: 0,
      scrollTo: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock global objects using Object.defineProperty to avoid direct assignment
    vi.stubGlobal('console', mockConsole);
    vi.stubGlobal('document', mockDocument);
    vi.stubGlobal('window', mockWindow);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules(); // Clear module cache to ensure fresh imports
    vi.unstubAllGlobals();
  });

  describe('Initialization', () => {
    it('should initialize successfully when button exists', async () => {
      await import('src/_static/js/back-to-top.js');

      expect(mockDocument.getElementById).toHaveBeenCalledWith('back-to-top');
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
      expect(mockButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should not initialize on non-article pages', async () => {
      mockDocument.querySelector.mockReturnValue(null);

      await import('src/_static/js/back-to-top.js');

      expect(mockDocument.getElementById).not.toHaveBeenCalled();
      expect(mockWindow.addEventListener).not.toHaveBeenCalled();
    });

    it('should warn when button does not exist', async () => {
      mockDocument.getElementById.mockReturnValue(null);

      await import('src/_static/js/back-to-top.js');

      expect(mockConsole.warn).toHaveBeenCalledWith('Back to top button not found');
      expect(mockWindow.addEventListener).not.toHaveBeenCalled();
    });

    it('should check initial visibility on load', async () => {
      mockWindow.scrollY = 400;

      await import('src/_static/js/back-to-top.js');

      expect(mockButton.classList.add).toHaveBeenCalledWith('back-to-top--visible');
    });
  });

  describe('Scroll Visibility Logic', () => {
    it('should show button when scrolled past threshold (300px)', async () => {
      mockButton.classList.contains.mockReturnValue(false);

      await import('src/_static/js/back-to-top.js');

      const scrollCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'scroll'
      );
      const scrollHandler = scrollCall?.[1];

      mockWindow.scrollY = 350;
      scrollHandler();

      expect(mockButton.classList.add).toHaveBeenCalledWith('back-to-top--visible');
    });

    it('should hide button when scrolled above threshold', async () => {
      mockButton.classList.contains.mockReturnValue(true);

      await import('src/_static/js/back-to-top.js');

      const scrollCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'scroll'
      );
      const scrollHandler = scrollCall?.[1];

      mockWindow.scrollY = 250;
      scrollHandler();

      expect(mockButton.classList.remove).toHaveBeenCalledWith('back-to-top--visible');
    });

    it('should handle scroll at exactly threshold (300px)', async () => {
      mockButton.classList.contains.mockReturnValue(false);

      await import('src/_static/js/back-to-top.js');

      const scrollCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'scroll'
      );
      const scrollHandler = scrollCall?.[1];

      mockWindow.scrollY = 300;
      scrollHandler();

      expect(mockButton.classList.remove).toHaveBeenCalledWith('back-to-top--visible');
    });
  });

  describe('Click to Scroll Functionality', () => {
    it('should scroll to top smoothly when button is clicked', async () => {
      await import('src/_static/js/back-to-top.js');

      const clickCall = mockButton.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      );
      const clickHandler = clickCall?.[1];

      clickHandler();

      expect(mockWindow.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth'
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should use passive scroll listener for better performance', async () => {
      await import('src/_static/js/back-to-top.js');

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle window.scrollY being undefined', async () => {
      mockWindow.scrollY = undefined;

      await import('src/_static/js/back-to-top.js');

      const scrollCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'scroll'
      );
      const scrollHandler = scrollCall?.[1];

      if (scrollHandler) {
        scrollHandler();
        expect(mockButton.classList.remove).toHaveBeenCalledWith('back-to-top--visible');
      }
    });

    it('should handle negative scroll values', async () => {
      mockWindow.scrollY = -10;

      await import('src/_static/js/back-to-top.js');

      const scrollCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'scroll'
      );
      const scrollHandler = scrollCall?.[1];

      if (scrollHandler) {
        scrollHandler();
        expect(mockButton.classList.remove).toHaveBeenCalledWith('back-to-top--visible');
      }
    });
  });
});