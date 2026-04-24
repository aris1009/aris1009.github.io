import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('LanguageSelector Web Component', () => {
  let LanguageSelector;
  let mockContainer;
  let mockOptions;

  beforeEach(async () => {
    vi.resetModules();

    mockContainer = { style: { pointerEvents: '' } };

    mockOptions = ['en-us', 'el', 'tr'].map(lang => ({
      getAttribute: vi.fn(() => lang),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    class MockHTMLElement {
      querySelector(selector) {
        return selector === '.language-selector-container' ? mockContainer : null;
      }
      querySelectorAll(selector) {
        return selector === '.language-option' ? mockOptions : [];
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

    const module = await import('src/_static/js/components/language-selector.js');
    LanguageSelector = module.LanguageSelector;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('registers as a custom element', () => {
    expect(customElements.define).toHaveBeenCalledWith('language-selector', LanguageSelector);
  });

  it('binds a click listener to every language option', () => {
    const selector = new LanguageSelector();
    selector.connectedCallback();
    mockOptions.forEach(option => {
      expect(option.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  it('removes listeners on disconnect', () => {
    const selector = new LanguageSelector();
    selector.connectedCallback();
    selector.disconnectedCallback();
    mockOptions.forEach(option => {
      expect(option.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  it('suppresses pointer events briefly on click so the dropdown closes cleanly', () => {
    vi.useFakeTimers();
    const selector = new LanguageSelector();
    selector.connectedCallback();

    const handler = mockOptions[1].addEventListener.mock.calls[0][1];
    handler({ currentTarget: mockOptions[1] });

    expect(mockContainer.style.pointerEvents).toBe('none');
    vi.advanceTimersByTime(300);
    expect(mockContainer.style.pointerEvents).toBe('auto');

    vi.useRealTimers();
  });

  it('dispatches a language-change event on click', () => {
    const selector = new LanguageSelector();
    selector.connectedCallback();
    const events = [];
    selector.dispatchEvent = (e) => events.push(e);

    const handler = mockOptions[2].addEventListener.mock.calls[0][1];
    handler({ currentTarget: mockOptions[2] });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('language-change');
    expect(events[0].detail).toEqual({ language: 'tr' });
  });

  it('does not navigate from JS — the anchor href drives navigation', () => {
    const selector = new LanguageSelector();
    selector.connectedCallback();

    const handler = mockOptions[0].addEventListener.mock.calls[0][1];
    expect(() => handler({ currentTarget: mockOptions[0] })).not.toThrow();
  });
});
