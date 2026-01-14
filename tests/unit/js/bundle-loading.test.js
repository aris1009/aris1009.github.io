import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FeatureLoader } from '../../../src/_static/js/feature-loader.js';
import { ThemeManager, LanguageSelector, BurgerMenu } from '../../../src/_static/js/core.js';

describe('Bundle Loading', () => {
  let featureLoader;
  let mockDocument;

  beforeEach(() => {
    // Mock document and related APIs
    mockDocument = {
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(),
      createElement: vi.fn(),
      readyState: 'complete',
      head: {
        appendChild: vi.fn()
      }
    };

    global.document = mockDocument;
    global.window = {
      location: { pathname: '/' },
      matchMedia: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    };

    featureLoader = new FeatureLoader();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('FeatureLoader conditional loading', () => {
    it('should detect article features correctly', () => {
      // Test needsArticleFeatures() method
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'article') return {};
        if (selector === '[data-testid*="dictionary"]') return {};
        return null;
      });

      expect(featureLoader.needsArticleFeatures()).toBe(true);
    });

    it('should detect code features correctly', () => {
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'pre code') return {};
        return null;
      });

      expect(featureLoader.needsCodeFeatures()).toBe(true);
    });

    it('should detect media features correctly', () => {
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'img[data-src]') return {};
        return null;
      });

      expect(featureLoader.needsMediaFeatures()).toBe(true);
    });

    it('should not load features when conditions are not met', () => {
      // Mock empty selectors
      mockDocument.querySelector.mockReturnValue(null);

      expect(featureLoader.needsArticleFeatures()).toBe(false);
      expect(featureLoader.needsCodeFeatures()).toBe(false);
      expect(featureLoader.needsMediaFeatures()).toBe(false);
    });
  });

  describe('Bundle preloading', () => {
    it('should preload bundles with modulepreload links', () => {
      const createElementSpy = vi.spyOn(mockDocument, 'createElement');
      const appendChildSpy = vi.spyOn(mockDocument.head, 'appendChild');

      // Mock createElement to return an object with the properties we set
      const mockLinkElement = { rel: '', href: '' };
      mockDocument.createElement.mockReturnValue(mockLinkElement);

      // Mock needsArticleFeatures to return true so preloadCriticalBundles will preload
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'article') return {};
        return null;
      });

      featureLoader.preloadCriticalBundles();

      expect(createElementSpy).toHaveBeenCalledWith('link');
      expect(appendChildSpy).toHaveBeenCalled();

      expect(mockLinkElement.rel).toBe('modulepreload');
      expect(mockLinkElement.href).toBe('/js/article.js');
    });
  });

  describe('Dynamic loading', () => {
    it('should track loaded bundles correctly', () => {
      // Test the loaded bundles tracking without actual loading
      expect(featureLoader.isLoaded('article')).toBe(false);

      // Manually mark as loaded to test the tracking
      featureLoader.loadedBundles.add('article');
      expect(featureLoader.isLoaded('article')).toBe(true);
    });

    it('should not load already loaded bundles', async () => {
      // Mark article as already loaded
      featureLoader.loadedBundles.add('article');

      // Mock import to ensure it's not called
      const mockImport = vi.fn();
      const originalImport = global.import;
      global.import = mockImport;

      // This should return early without calling import
      await featureLoader.loadArticleFeatures();

      expect(mockImport).not.toHaveBeenCalled();

      // Restore
      global.import = originalImport;
    });
  });

  describe('Initialization', () => {
    it('should initialize and load appropriate bundles based on content', async () => {
      // Mock presence of article features and DOM ready
      mockDocument.readyState = 'complete';
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'article') return {};
        return null;
      });

      // Mock createElement for preloading
      const mockLinkElement = { rel: '', href: '' };
      mockDocument.createElement.mockReturnValue(mockLinkElement);

      const preloadSpy = vi.spyOn(featureLoader, 'preloadCriticalBundles');
      const loadSpy = vi.spyOn(featureLoader, 'loadFeatures');

      await featureLoader.init();

      expect(preloadSpy).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('Core Bundle Exports', () => {
    beforeEach(() => {
      // Mock localStorage for ThemeManager
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };
      global.localStorage = mockLocalStorage;

      // Mock matchMedia for ThemeManager
      global.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });

      // Mock document.body and documentElement for DOM manipulation
      global.document.body = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
          toggle: vi.fn()
        },
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn()
      };

      global.document.documentElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
          toggle: vi.fn()
        }
      };

      global.document.getElementById = vi.fn().mockReturnValue(null);
    });

    it('should export ThemeManager class', () => {
      expect(typeof ThemeManager).toBe('function');
      expect(ThemeManager.name).toBe('ThemeManager');
    });

    it('should export LanguageSelector class', () => {
      expect(typeof LanguageSelector).toBe('function');
      expect(LanguageSelector.name).toBe('LanguageSelector');
    });

    it('should export BurgerMenu class', () => {
      expect(typeof BurgerMenu).toBe('function');
      expect(BurgerMenu.name).toBe('BurgerMenu');
    });

    it('should allow instantiation of core components', () => {
      expect(() => new ThemeManager()).not.toThrow();
      expect(() => new LanguageSelector()).not.toThrow();
      expect(() => new BurgerMenu()).not.toThrow();
    });
  });
});