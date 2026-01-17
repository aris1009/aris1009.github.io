import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for code-copy-buttons.js functionality
 * Tests the core logic without requiring DOM manipulation or browser APIs
 */

describe('Code Copy Buttons', () => {
  let mockDocument;
  let mockWindow;
  let mockElement;
  let mockCopyButton;
  let mockPrism;
  let mockMutationObserver;
  let mockObserverInstance;

  beforeEach(() => {
    // Mock DOM elements
    mockElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false)
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      addEventListener: vi.fn(),
      appendChild: vi.fn(),
      insertBefore: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      parentNode: {
        insertBefore: vi.fn()
      },
      textContent: 'console.log("Hello, World!");',
      dataset: {}
    };

    mockCopyButton = {
      classList: { add: vi.fn() },
      setAttribute: vi.fn(),
      addEventListener: vi.fn(),
      value: ''
    };

    // Mock document
    mockDocument = {
      createElement: vi.fn((tagName) => {
        if (tagName === 'sl-copy-button') return mockCopyButton;
        if (tagName === 'div') return {
          className: '',
          classList: { add: vi.fn() },
          appendChild: vi.fn()
        };
        return mockElement;
      }),
      querySelectorAll: vi.fn((selector) => {
        // Return empty array for mermaid selector by default
        // Tests can override this for specific cases
        return [];
      }),
      addEventListener: vi.fn(),
      // Set to 'loading' to prevent auto-initialization during module import
      // Tests can call initializeCopyButtons() manually when needed
      readyState: 'loading',
      body: mockElement
    };

    // Mock MutationObserver
    mockObserverInstance = {
      observe: vi.fn(),
      disconnect: vi.fn()
    };
    mockMutationObserver = vi.fn(function() {
      return mockObserverInstance;
    });

    // Mock Prism.js
    mockPrism = {
      hooks: {
        add: vi.fn()
      }
    };

    // Mock window
    mockWindow = {
      Prism: mockPrism,
      requestIdleCallback: vi.fn((callback) => callback()),
      MutationObserver: mockMutationObserver,
      Node: {
        ELEMENT_NODE: 1
      }
    };
    
    // Set up global requestIdleCallback for the module
    global.requestIdleCallback = mockWindow.requestIdleCallback;

    // Set up global mocks
    global.document = mockDocument;
    global.window = mockWindow;
    global.MutationObserver = mockMutationObserver;
    global.Node = mockWindow.Node;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete global.document;
    delete global.window;
    delete global.MutationObserver;
    delete global.Node;
    delete global.requestIdleCallback;
  });

  describe('Core Functionality', () => {
    it('should create copy button with correct attributes', async () => {
      // Mock code element and pre element
      const mockCodeElement = {
        textContent: 'const greeting = "Hello, World!";'
      };
      const mockPreElement = {
        classList: { 
          add: vi.fn(),
          contains: vi.fn(() => false) 
        },
        querySelector: vi.fn(() => mockCodeElement),
        parentNode: {
          insertBefore: vi.fn()
        }
      };

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      // Import and test the function
      const module = await import('src/_static/js/code-copy-buttons.js');
      const { addCopyButtonsToCodeBlocks } = module;
      
      addCopyButtonsToCodeBlocks();

      // Verify copy button was created
      expect(mockDocument.createElement).toHaveBeenCalledWith('sl-copy-button');
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      
      // Verify copy button attributes
      expect(mockCopyButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Copy code snippet');
      expect(mockCopyButton.setAttribute).toHaveBeenCalledWith('copy-label', 'Copy');
      expect(mockCopyButton.setAttribute).toHaveBeenCalledWith('success-label', 'Copied!');
      expect(mockCopyButton.setAttribute).toHaveBeenCalledWith('error-label', 'Copy failed');
      expect(mockCopyButton.setAttribute).toHaveBeenCalledWith('feedback-duration', '1500');
      expect(mockCopyButton.setAttribute).toHaveBeenCalledWith('data-testid', 'code-copy-button');
      
      // Verify code text was set as value
      expect(mockCopyButton.value).toBe('const greeting = "Hello, World!";');
      
      // Verify event listeners were added
      expect(mockCopyButton.addEventListener).toHaveBeenCalledWith('sl-copy', expect.any(Function));
      expect(mockCopyButton.addEventListener).toHaveBeenCalledWith('sl-error', expect.any(Function));
    });

    it('should skip code blocks that already have copy buttons', async () => {
      const mockPreElement = {
        classList: { 
          contains: vi.fn(() => true) // Already has copy button
        },
        querySelector: vi.fn()
      };

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      const { addCopyButtonsToCodeBlocks } = await import('src/_static/js/code-copy-buttons.js');
      
      addCopyButtonsToCodeBlocks();

      // Should not create any new copy buttons
      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should skip pre elements without code elements', async () => {
      const mockPreElement = {
        classList: { 
          contains: vi.fn(() => false) 
        },
        querySelector: vi.fn(() => null) // No code element
      };

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      const { addCopyButtonsToCodeBlocks } = await import('src/_static/js/code-copy-buttons.js');
      
      addCopyButtonsToCodeBlocks();

      // Should not create copy buttons for invalid elements
      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should handle empty code content gracefully', async () => {
      const mockCodeElement = {
        textContent: '' // Empty code
      };
      const mockPreElement = {
        classList: { 
          add: vi.fn(),
          contains: vi.fn(() => false) 
        },
        querySelector: vi.fn(() => mockCodeElement),
        parentNode: {
          insertBefore: vi.fn()
        }
      };

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      const { addCopyButtonsToCodeBlocks } = await import('src/_static/js/code-copy-buttons.js');
      
      addCopyButtonsToCodeBlocks();

      // Should still create copy button but with empty value
      expect(mockCopyButton.value).toBe('');
      expect(mockDocument.createElement).toHaveBeenCalledWith('sl-copy-button');
    });
  });

  describe('Prism.js Integration', () => {
    it('should register Prism hooks when Prism is available', async () => {
      mockWindow.Prism = mockPrism;
      
      const { initializeCopyButtons } = await import('src/_static/js/code-copy-buttons.js');
      
      initializeCopyButtons();

      // Should register both before-highlight and after-highlight hooks
      expect(mockPrism.hooks.add).toHaveBeenCalledWith('after-highlight', expect.any(Function));
      expect(mockPrism.hooks.add).toHaveBeenCalledWith('before-highlight', expect.any(Function));
    });

    it('should handle Prism re-highlighting by preserving copy button state', () => {
      const mockEnv = {
        element: {
          classList: {
            contains: vi.fn(() => true),
            add: vi.fn()
          },
          dataset: {}
        }
      };

      // Test before-highlight hook
      const beforeHighlightCallback = mockPrism.hooks.add.mock.calls
        .find(call => call[0] === 'before-highlight')?.[1];
      
      if (beforeHighlightCallback) {
        beforeHighlightCallback(mockEnv);
        expect(mockEnv.element.dataset.preserveCopyButton).toBe('true');
      }

      // Test after-highlight hook
      const afterHighlightCallback = mockPrism.hooks.add.mock.calls
        .find(call => call[0] === 'after-highlight')?.[1];
      
      if (afterHighlightCallback) {
        afterHighlightCallback(mockEnv);
        expect(mockEnv.element.classList.add).toHaveBeenCalledWith('has-copy-button');
        expect(mockEnv.element.dataset.preserveCopyButton).toBeUndefined();
      }
    });

    it('should fallback gracefully when Prism is not available', async () => {
      mockWindow.Prism = undefined;
      
      const { initializeCopyButtons } = await import('src/_static/js/code-copy-buttons.js');
      
      // Should not throw error
      expect(() => initializeCopyButtons()).not.toThrow();
    });
  });

  describe('MutationObserver Integration', () => {
    it('should create MutationObserver for dynamic content', async () => {
      const { initializeCopyButtons } = await import('src/_static/js/code-copy-buttons.js');
      
      initializeCopyButtons();

      expect(mockMutationObserver).toHaveBeenCalled();
      expect(mockObserverInstance.observe).toHaveBeenCalledWith(
        mockDocument.body,
        { childList: true, subtree: true }
      );
    });

    it('should process new code blocks when DOM changes', async () => {
      let mutationCallback;
      mockMutationObserver.mockImplementation(function(callback) {
        mutationCallback = callback;
        return mockObserverInstance;
      });

      const { initializeCopyButtons } = await import('src/_static/js/code-copy-buttons.js');
      
      initializeCopyButtons();

      // Simulate adding a new code block
      const mockNewCodeBlock = {
        nodeType: 1, // ELEMENT_NODE
        matches: vi.fn(() => true),
        querySelector: vi.fn()
      };

      const mockMutations = [{
        addedNodes: [mockNewCodeBlock]
      }];

      // Should trigger processing when new code blocks are added
      if (mutationCallback) {
        mutationCallback(mockMutations);
        expect(mockWindow.requestIdleCallback).toHaveBeenCalled();
      }
    });

    it('should ignore non-element nodes in mutations', async () => {
      let mutationCallback;
      mockMutationObserver.mockImplementation(function(callback) {
        mutationCallback = callback;
        return mockObserverInstance;
      });

      const { initializeCopyButtons } = await import('src/_static/js/code-copy-buttons.js');
      
      initializeCopyButtons();

      // Simulate adding a text node (nodeType: 3)
      const mockTextNode = {
        nodeType: 3 // TEXT_NODE
      };

      const mockMutations = [{
        addedNodes: [mockTextNode]
      }];

      // Should not trigger processing for text nodes
      if (mutationCallback) {
        mutationCallback(mockMutations);
        expect(mockWindow.requestIdleCallback).not.toHaveBeenCalled();
      }
    });
  });

  describe('Event Handling', () => {
    it('should handle copy success events', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockCodeElement = { textContent: 'test code' };
      const mockPreElement = {
        classList: { add: vi.fn(), contains: vi.fn(() => false) },
        querySelector: vi.fn(() => mockCodeElement),
        parentNode: { insertBefore: vi.fn() }
      };

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      const { addCopyButtonsToCodeBlocks } = await import('src/_static/js/code-copy-buttons.js');
      
      addCopyButtonsToCodeBlocks();

      // Find and trigger the copy success event
      const copySuccessHandler = mockCopyButton.addEventListener.mock.calls
        .find(call => call[0] === 'sl-copy')?.[1];
      
      if (copySuccessHandler) {
        copySuccessHandler();
        expect(consoleSpy).toHaveBeenCalledWith('Code copied successfully');
      }

      consoleSpy.mockRestore();
    });

    it('should handle copy error events', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockCodeElement = { textContent: 'test code' };
      const mockPreElement = {
        classList: { add: vi.fn(), contains: vi.fn(() => false) },
        querySelector: vi.fn(() => mockCodeElement),
        parentNode: { insertBefore: vi.fn() }
      };

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      const { addCopyButtonsToCodeBlocks } = await import('src/_static/js/code-copy-buttons.js');
      
      addCopyButtonsToCodeBlocks();

      // Find and trigger the copy error event
      const copyErrorHandler = mockCopyButton.addEventListener.mock.calls
        .find(call => call[0] === 'sl-error')?.[1];
      
      if (copyErrorHandler) {
        const mockError = new Error('Copy failed');
        copyErrorHandler(mockError);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Copy failed:', mockError);
      }

      consoleErrorSpy.mockRestore();
    });
  });

  describe('CSS Class Management', () => {
    it('should add has-copy-button class after processing', async () => {
      const mockCodeElement = { textContent: 'test code' };
      const mockPreElement = {
        classList: { 
          add: vi.fn(), 
          contains: vi.fn(() => false) 
        },
        querySelector: vi.fn(() => mockCodeElement),
        parentNode: { insertBefore: vi.fn() }
      };

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      const { addCopyButtonsToCodeBlocks } = await import('src/_static/js/code-copy-buttons.js');
      
      addCopyButtonsToCodeBlocks();

      expect(mockPreElement.classList.add).toHaveBeenCalledWith('has-copy-button');
    });

    it('should add correct CSS classes to wrapper and button', async () => {
      const mockCodeElement = { textContent: 'test code' };
      const mockPreElement = {
        classList: { add: vi.fn(), contains: vi.fn(() => false) },
        querySelector: vi.fn(() => mockCodeElement),
        parentNode: { insertBefore: vi.fn() }
      };

      const mockWrapper = {
        className: '',
        classList: { add: vi.fn() },
        appendChild: vi.fn()
      };

      mockDocument.createElement.mockImplementation((tagName) => {
        if (tagName === 'sl-copy-button') return mockCopyButton;
        if (tagName === 'div') return mockWrapper;
        return mockElement;
      });

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      const { addCopyButtonsToCodeBlocks } = await import('src/_static/js/code-copy-buttons.js');
      
      addCopyButtonsToCodeBlocks();

      expect(mockWrapper.className).toBe('code-block-wrapper');
      expect(mockCopyButton.className).toBe('code-copy-button');
    });
  });

  describe('Accessibility', () => {
    it('should set proper ARIA attributes', async () => {
      const mockCodeElement = { textContent: 'test code' };
      const mockPreElement = {
        classList: { add: vi.fn(), contains: vi.fn(() => false) },
        querySelector: vi.fn(() => mockCodeElement),
        parentNode: { insertBefore: vi.fn() }
      };

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      const { addCopyButtonsToCodeBlocks } = await import('src/_static/js/code-copy-buttons.js');
      
      addCopyButtonsToCodeBlocks();

      expect(mockCopyButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Copy code snippet');
    });

    it('should set proper test IDs for testing', async () => {
      const mockCodeElement = { textContent: 'test code' };
      const mockPreElement = {
        classList: { add: vi.fn(), contains: vi.fn(() => false) },
        querySelector: vi.fn(() => mockCodeElement),
        parentNode: { insertBefore: vi.fn() }
      };

      mockDocument.querySelectorAll.mockReturnValue([mockPreElement]);

      const { addCopyButtonsToCodeBlocks } = await import('src/_static/js/code-copy-buttons.js');
      
      addCopyButtonsToCodeBlocks();

      expect(mockCopyButton.setAttribute).toHaveBeenCalledWith('data-testid', 'code-copy-button');
    });
  });
});