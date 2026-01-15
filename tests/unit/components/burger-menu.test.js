import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for burger-menu web component
 */

describe('BurgerMenu Web Component', () => {
  let BurgerMenu;
  let mockTrigger;
  let mockOverlay;
  let mockButton;
  let mockNavLinks;
  let mockBody;
  let mockElement;

  beforeEach(async () => {
    // Reset module cache
    vi.resetModules();

    // Create mock nav links
    mockNavLinks = [
      { addEventListener: vi.fn(), removeEventListener: vi.fn() },
      { addEventListener: vi.fn(), removeEventListener: vi.fn() }
    ];

    // Mock button element
    mockButton = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false)
      },
      style: {}
    };

    // Mock trigger element
    mockTrigger = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn()
    };

    // Mock overlay element
    mockOverlay = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      }
    };

    // Mock body
    mockBody = { style: { overflow: '' } };

    // Mock document
    const mockDocument = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getElementById: vi.fn((id) => {
        if (id === 'burger-overlay') return mockOverlay;
        return null;
      }),
      body: mockBody
    };
    vi.stubGlobal('document', mockDocument);

    // Mock HTMLElement
    class MockHTMLElement {
      constructor() {
        this._trigger = null;
        this._overlay = null;
        this._button = null;
        this._navLinks = [];
      }
      getAttribute(attr) {
        if (attr === 'overlay-id') return 'burger-overlay';
        return null;
      }
      querySelector(selector) {
        if (selector === '[data-trigger]') return mockTrigger;
        if (selector === '[data-overlay]') return mockOverlay;
        if (selector === '.burger-button') return mockButton;
        return null;
      }
      querySelectorAll(selector) {
        if (selector === '.burger-nav-link') return mockNavLinks;
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
    vi.stubGlobal('customElements', {
      define: vi.fn()
    });

    // Import the module
    const module = await import('src/_static/js/components/burger-menu.js');
    BurgerMenu = module.BurgerMenu;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('connectedCallback', () => {
    it('should find and store required elements', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();

      expect(menu._trigger).toBe(mockTrigger);
      expect(menu._overlay).toBe(mockOverlay);
      expect(menu._button).toBe(mockButton);
    });

    it('should add click listener to trigger', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();

      expect(mockTrigger.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should add click listener to overlay', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();

      expect(mockOverlay.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should add keydown listener for escape key', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();

      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should add click listeners to nav links', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();

      mockNavLinks.forEach(link => {
        expect(link.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      });
    });

    it('should add hover listeners to trigger', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();

      expect(mockTrigger.addEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function));
      expect(mockTrigger.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    });

    it('should warn if required elements missing', () => {
      const mockConsole = { warn: vi.fn() };
      vi.stubGlobal('console', mockConsole);

      const menu = new BurgerMenu();
      menu.querySelector = () => null;
      menu.connectedCallback();

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'BurgerMenu: Missing required [data-trigger] or overlay element'
      );
    });
  });

  describe('disconnectedCallback', () => {
    it('should remove all event listeners', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      menu.disconnectedCallback();

      expect(mockTrigger.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockOverlay.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('isOpen', () => {
    it('should return false when menu is closed', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockButton.classList.contains.mockReturnValue(false);

      expect(menu.isOpen).toBe(false);
    });

    it('should return true when menu is open', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockButton.classList.contains.mockReturnValue(true);

      expect(menu.isOpen).toBe(true);
    });
  });

  describe('open', () => {
    it('should add active class to button and overlay', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      menu.open();

      expect(mockButton.classList.add).toHaveBeenCalledWith('active');
      expect(mockOverlay.classList.add).toHaveBeenCalledWith('active');
    });

    it('should set aria-expanded to true', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      menu.open();

      expect(mockTrigger.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
    });

    it('should lock body scroll', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      menu.open();

      expect(mockBody.style.overflow).toBe('hidden');
    });
  });

  describe('close', () => {
    it('should remove active class from button and overlay', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      menu.close();

      expect(mockButton.classList.remove).toHaveBeenCalledWith('active');
      expect(mockOverlay.classList.remove).toHaveBeenCalledWith('active');
    });

    it('should set aria-expanded to false', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      menu.close();

      expect(mockTrigger.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false');
    });

    it('should unlock body scroll', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockBody.style.overflow = 'hidden';
      menu.close();

      expect(mockBody.style.overflow).toBe('');
    });
  });

  describe('toggle', () => {
    it('should open when closed', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockButton.classList.contains.mockReturnValue(false);

      menu.toggle();

      expect(mockButton.classList.add).toHaveBeenCalledWith('active');
    });

    it('should close when open', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockButton.classList.contains.mockReturnValue(true);

      menu.toggle();

      expect(mockButton.classList.remove).toHaveBeenCalledWith('active');
    });
  });

  describe('keyboard navigation', () => {
    it('should close menu on Escape key when open', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockButton.classList.contains.mockReturnValue(true);

      // Get the keydown handler
      const keydownCall = document.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      );
      const keydownHandler = keydownCall?.[1];

      keydownHandler({ key: 'Escape' });

      expect(mockButton.classList.remove).toHaveBeenCalledWith('active');
    });

    it('should not close menu on Escape key when already closed', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockButton.classList.contains.mockReturnValue(false);

      const keydownCall = document.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      );
      const keydownHandler = keydownCall?.[1];

      keydownHandler({ key: 'Escape' });

      expect(mockButton.classList.remove).not.toHaveBeenCalled();
    });
  });

  describe('hover effects', () => {
    it('should scale button on mouseenter when closed', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockButton.classList.contains.mockReturnValue(false);

      const mouseenterCall = mockTrigger.addEventListener.mock.calls.find(
        call => call[0] === 'mouseenter'
      );
      const mouseenterHandler = mouseenterCall?.[1];

      mouseenterHandler();

      expect(mockButton.style.transform).toBe('scale(1.05)');
    });

    it('should not scale button on mouseenter when open', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockButton.classList.contains.mockReturnValue(true);

      const mouseenterCall = mockTrigger.addEventListener.mock.calls.find(
        call => call[0] === 'mouseenter'
      );
      const mouseenterHandler = mouseenterCall?.[1];

      mouseenterHandler();

      expect(mockButton.style.transform).toBeUndefined();
    });

    it('should reset scale on mouseleave', () => {
      const menu = new BurgerMenu();
      menu.connectedCallback();
      mockButton.classList.contains.mockReturnValue(false);

      const mouseleaveCall = mockTrigger.addEventListener.mock.calls.find(
        call => call[0] === 'mouseleave'
      );
      const mouseleaveHandler = mouseleaveCall?.[1];

      mouseleaveHandler();

      expect(mockButton.style.transform).toBe('scale(1)');
    });
  });

  describe('component registration', () => {
    it('should register custom element', () => {
      expect(customElements.define).toHaveBeenCalledWith('burger-menu', BurgerMenu);
    });
  });
});
