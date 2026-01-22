import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for language-selector web component
 */

describe('LanguageSelector Web Component', () => {
  let LanguageSelector;
  let mockDisplay;
  let mockContainer;
  let mockOptions;
  let mockLocalStorage;

  beforeEach(async () => {
    vi.resetModules();

    // Mock localStorage
    mockLocalStorage = {
      store: {},
      getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage.store[key] = value; })
    };
    vi.stubGlobal('localStorage', mockLocalStorage);

    // Mock display element
    mockDisplay = {
      firstChild: null,
      appendChild: vi.fn(),
      removeChild: vi.fn()
    };

    // Mock container
    mockContainer = {
      style: { pointerEvents: '' }
    };

    // Mock options (language links)
    mockOptions = [
      {
        getAttribute: vi.fn(() => 'en-us'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        href: ''
      },
      {
        getAttribute: vi.fn(() => 'el'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        href: ''
      },
      {
        getAttribute: vi.fn(() => 'tr'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        href: ''
      }
    ];

    // Mock document
    const mockDocument = {
      createElement: vi.fn(() => ({
        className: '',
        textContent: ''
      }))
    };
    vi.stubGlobal('document', mockDocument);

    // Mock window.location
    vi.stubGlobal('window', {
      location: { pathname: '/en-us/about/' }
    });

    // Mock console
    vi.stubGlobal('console', { warn: vi.fn() });

    // Mock HTMLElement
    class MockHTMLElement {
      constructor() {
        this._container = null;
        this._display = null;
        this._options = [];
      }
      querySelector(selector) {
        if (selector === '.language-selector-container') return mockContainer;
        if (selector === '#current-language') return mockDisplay;
        return null;
      }
      querySelectorAll(selector) {
        if (selector === '.language-option') return mockOptions;
        return [];
      }
      dispatchEvent() {}
    }

    vi.stubGlobal('HTMLElement', MockHTMLElement);
    vi.stubGlobal('CustomEvent', class {
      constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
        this.bubbles = options?.bubbles;
      }
    });
    vi.stubGlobal('customElements', { define: vi.fn() });

    // Import the module
    const module = await import('src/_static/js/components/language-selector.js');
    LanguageSelector = module.LanguageSelector;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('LANGUAGES constant', () => {
    it('should have en-us, el, and tr languages', () => {
      expect(LanguageSelector.LANGUAGES['en-us']).toEqual({ flag: '🇺🇸' });
      expect(LanguageSelector.LANGUAGES['el']).toEqual({ flag: '🇬🇷' });
      expect(LanguageSelector.LANGUAGES['tr']).toEqual({ flag: '🇹🇷' });
    });
  });

  describe('LANG_PREFIXES constant', () => {
    it('should include all language prefixes', () => {
      expect(LanguageSelector.LANG_PREFIXES).toContain('/en-us/');
      expect(LanguageSelector.LANG_PREFIXES).toContain('/el/');
      expect(LanguageSelector.LANG_PREFIXES).toContain('/tr/');
      expect(LanguageSelector.LANG_PREFIXES).toContain('/blog/en-us/');
      expect(LanguageSelector.LANG_PREFIXES).toContain('/blog/el/');
      expect(LanguageSelector.LANG_PREFIXES).toContain('/blog/tr/');
    });
  });

  describe('connectedCallback', () => {
    it('should find and store required elements', () => {
      const selector = new LanguageSelector();
      selector.connectedCallback();

      expect(selector._container).toBe(mockContainer);
      expect(selector._display).toBe(mockDisplay);
    });

    it('should add click listeners to all language options', () => {
      const selector = new LanguageSelector();
      selector.connectedCallback();

      mockOptions.forEach(option => {
        expect(option.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      });
    });

    it('should warn if display element is missing', () => {
      const selector = new LanguageSelector();
      selector.querySelector = () => null;
      selector.querySelectorAll = () => [];
      selector.connectedCallback();

      expect(console.warn).toHaveBeenCalledWith('LanguageSelector: Missing #current-language element');
    });
  });

  describe('disconnectedCallback', () => {
    it('should remove click listeners from all options', () => {
      const selector = new LanguageSelector();
      selector.connectedCallback();
      selector.disconnectedCallback();

      mockOptions.forEach(option => {
        expect(option.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      });
    });
  });

  describe('_onOptionClick', () => {
    it('should save language to localStorage', () => {
      const selector = new LanguageSelector();
      selector.connectedCallback();

      // Get the click handler
      const clickHandler = mockOptions[1].addEventListener.mock.calls[0][1];

      // Simulate click on Greek option
      clickHandler({
        currentTarget: mockOptions[1],
        preventDefault: vi.fn()
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('language', 'el');
    });

    it('should temporarily disable pointer events on container', () => {
      vi.useFakeTimers();

      const selector = new LanguageSelector();
      selector.connectedCallback();

      const clickHandler = mockOptions[0].addEventListener.mock.calls[0][1];
      clickHandler({
        currentTarget: mockOptions[0],
        preventDefault: vi.fn()
      });

      expect(mockContainer.style.pointerEvents).toBe('none');

      vi.advanceTimersByTime(300);

      expect(mockContainer.style.pointerEvents).toBe('auto');

      vi.useRealTimers();
    });

    it('should not save if language is not in LANGUAGES', () => {
      const selector = new LanguageSelector();
      selector.connectedCallback();

      const clickHandler = mockOptions[0].addEventListener.mock.calls[0][1];

      // Mock option returning invalid language
      const invalidOption = { getAttribute: vi.fn(() => 'invalid-lang') };
      clickHandler({
        currentTarget: invalidOption,
        preventDefault: vi.fn()
      });

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('_updateDisplay', () => {
    it('should create flag span with correct content', () => {
      const mockFlagSpan = { className: '', textContent: '' };
      document.createElement.mockReturnValue(mockFlagSpan);

      const selector = new LanguageSelector();
      selector.connectedCallback();
      selector._updateDisplay('el');

      expect(document.createElement).toHaveBeenCalledWith('span');
      expect(mockFlagSpan.className).toBe('flag');
      expect(mockFlagSpan.textContent).toBe('🇬🇷');
      expect(mockDisplay.appendChild).toHaveBeenCalledWith(mockFlagSpan);
    });

    it('should clear existing children before adding new flag', () => {
      const selector = new LanguageSelector();
      selector.connectedCallback();

      // Simulate existing child
      mockDisplay.firstChild = { id: 'old-child' };
      mockDisplay.removeChild.mockImplementation(() => {
        mockDisplay.firstChild = null;
      });

      selector._updateDisplay('tr');

      expect(mockDisplay.removeChild).toHaveBeenCalled();
    });
  });

  describe('currentLanguage getter', () => {
    it('should return language from localStorage', () => {
      mockLocalStorage.store['language'] = 'el';

      const selector = new LanguageSelector();
      expect(selector.currentLanguage).toBe('el');
    });

    it('should return en-us as default', () => {
      const selector = new LanguageSelector();
      expect(selector.currentLanguage).toBe('en-us');
    });
  });

  describe('component registration', () => {
    it('should register custom element', () => {
      expect(customElements.define).toHaveBeenCalledWith('language-selector', LanguageSelector);
    });
  });

  describe('_parsePath', () => {
    it('should detect blog posts', () => {
      const selector = new LanguageSelector();
      const result = selector._parsePath('/blog/en-us/my-post/');
      expect(result.isBlog).toBe(true);
      expect(result.basePath).toBe('/my-post/');
    });

    it('should strip language prefix from pages', () => {
      const selector = new LanguageSelector();
      const result = selector._parsePath('/el/about/');
      expect(result.isBlog).toBe(false);
      expect(result.basePath).toBe('/about/');
    });

    it('should handle root path', () => {
      const selector = new LanguageSelector();
      const result = selector._parsePath('/');
      expect(result.basePath).toBe('/');
    });

    it('should handle Greek root path', () => {
      const selector = new LanguageSelector();
      const result = selector._parsePath('/el/');
      expect(result.basePath).toBe('/');
    });
  });

  describe('_buildUrl', () => {
    it('should build blog URLs correctly', () => {
      const selector = new LanguageSelector();
      expect(selector._buildUrl('el', '/my-post/', true)).toBe('/blog/el/my-post/');
      expect(selector._buildUrl('en-us', '/my-post/', true)).toBe('/blog/en-us/my-post/');
    });

    it('should build page URLs correctly', () => {
      const selector = new LanguageSelector();
      expect(selector._buildUrl('el', '/about/', false)).toBe('/el/about/');
      expect(selector._buildUrl('tr', '/dictionary/', false)).toBe('/tr/dictionary/');
    });

    it('should handle home page for en-us', () => {
      const selector = new LanguageSelector();
      expect(selector._buildUrl('en-us', '/', false)).toBe('/');
    });

    it('should handle home page for other languages', () => {
      const selector = new LanguageSelector();
      expect(selector._buildUrl('el', '/', false)).toBe('/el/');
      expect(selector._buildUrl('tr', '/', false)).toBe('/tr/');
    });
  });

  describe('_generateLinks', () => {
    it('should set href on all options', () => {
      window.location.pathname = '/en-us/about/';

      const selector = new LanguageSelector();
      selector.connectedCallback();

      expect(mockOptions[0].href).toBe('/en-us/about/');
      expect(mockOptions[1].href).toBe('/el/about/');
      expect(mockOptions[2].href).toBe('/tr/about/');
    });
  });
});
