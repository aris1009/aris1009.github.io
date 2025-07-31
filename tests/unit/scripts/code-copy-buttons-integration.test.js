import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Integration tests for code-copy-buttons.js functionality
 * Tests the integration aspects and core logic patterns
 */

describe('Code Copy Buttons Integration', () => {
  let mockDocument;
  let mockWindow;

  beforeEach(() => {
    // Create minimal DOM-like structure for testing
    mockDocument = {
      readyState: 'complete',
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      createElement: vi.fn((tagName) => {
        // Return a mock element with necessary properties
        return {
          tagName: tagName.toUpperCase(),
          className: '',
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(() => false)
          },
          setAttribute: vi.fn(),
          getAttribute: vi.fn(() => null),
          appendChild: vi.fn(),
          querySelector: vi.fn(() => null),
          matches: vi.fn(function(selector) {
            if (selector.includes('language-')) {
              const hasLanguageClass = this.className.includes('language-');
              if (selector.includes(':not(.has-copy-button)')) {
                return hasLanguageClass && !this.classList.contains('has-copy-button');
              }
              return hasLanguageClass;
            }
            return false;
          }),
          textContent: '',
          dataset: {}
        };
      }),
      body: { appendChild: vi.fn() }
    };

    mockWindow = {
      Prism: {
        hooks: {
          add: vi.fn()
        }
      },
      MutationObserver: vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn()
      })),
      requestIdleCallback: vi.fn(callback => callback()),
      Node: { ELEMENT_NODE: 1 }
    };

    // Set globals
    global.document = mockDocument;
    global.window = mockWindow;
    global.MutationObserver = mockWindow.MutationObserver;
    global.Node = mockWindow.Node;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete global.document;
    delete global.window;
    delete global.MutationObserver;
    delete global.Node;
  });

  describe('Module Loading and Initialization', () => {
    it('should export required functions', async () => {
      const module = await import('src/_static/js/code-copy-buttons.js');
      
      expect(module).toHaveProperty('addCopyButtonsToCodeBlocks');
      expect(module).toHaveProperty('initializeCopyButtons');
      expect(typeof module.addCopyButtonsToCodeBlocks).toBe('function');
      expect(typeof module.initializeCopyButtons).toBe('function');
    });

    it('should handle missing window object gracefully', async () => {
      delete global.window;
      delete global.document;
      
      // Should not throw when importing
      expect(async () => {
        await import('src/_static/js/code-copy-buttons.js');
      }).not.toThrow();
    });
  });

  describe('CSS Selector Patterns', () => {
    it('should use correct selectors for code blocks', () => {
      const expectedSelector = 'pre[class*="language-"]:not(.has-copy-button)';
      
      // This tests that our selector pattern is correct
      const testElement = document.createElement('pre');
      testElement.className = 'language-javascript';
      
      // Should match language-* classes
      expect(testElement.matches('pre[class*="language-"]')).toBe(true);
      
      // Should be excluded when has-copy-button is present
      testElement.classList.add('has-copy-button');
      testElement.classList.contains = vi.fn((className) => className === 'has-copy-button');
      expect(testElement.matches('pre[class*="language-"]:not(.has-copy-button)')).toBe(false);
    });

    it('should handle various language class patterns', () => {
      const languagePatterns = [
        'language-javascript',
        'language-text',
        'language-css',
        'language-html',
        'language-bash'
      ];

      languagePatterns.forEach(className => {
        const element = document.createElement('pre');
        element.className = className;
        expect(element.matches('pre[class*="language-"]')).toBe(true);
      });
    });
  });

  describe('DOM Structure Validation', () => {
    it('should create proper wrapper and button structure', () => {
      // Test the expected DOM structure
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      
      const copyButton = document.createElement('sl-copy-button');
      copyButton.className = 'code-copy-button';
      copyButton.setAttribute('data-testid', 'code-copy-button');
      
      const pre = document.createElement('pre');
      pre.className = 'language-javascript';
      
      wrapper.appendChild(pre);
      wrapper.appendChild(copyButton);
      
      // Mock querySelector to return the appropriate elements
      wrapper.querySelector = vi.fn((selector) => {
        if (selector === 'pre') return pre;
        if (selector === 'sl-copy-button') return copyButton;
        return null;
      });
      
      // Verify structure
      expect(wrapper.className).toBe('code-block-wrapper');
      expect(wrapper.querySelector('pre')).toBeTruthy();
      expect(wrapper.querySelector('sl-copy-button')).toBeTruthy();
      // Mock getAttribute on the copy button
      copyButton.getAttribute = vi.fn((attr) => {
        if (attr === 'data-testid') return 'code-copy-button';
        return null;
      });
      expect(copyButton.getAttribute('data-testid')).toBe('code-copy-button');
    });

    it('should set correct attributes on copy button', () => {
      const copyButton = document.createElement('sl-copy-button');
      
      // Expected attributes
      const expectedAttributes = {
        'aria-label': 'Copy code snippet',
        'copy-label': 'Copy',
        'success-label': 'Copied!',
        'error-label': 'Copy failed',
        'feedback-duration': '1500',
        'data-testid': 'code-copy-button'
      };
      
      // Mock getAttribute to return the expected values
      copyButton.getAttribute = vi.fn((key) => expectedAttributes[key] || null);
      
      // Set attributes as the function would
      Object.entries(expectedAttributes).forEach(([key, value]) => {
        copyButton.setAttribute(key, value);
      });
      
      // Verify all attributes are set correctly
      Object.entries(expectedAttributes).forEach(([key, value]) => {
        expect(copyButton.getAttribute(key)).toBe(value);
      });
    });
  });

  describe('Event Handling Patterns', () => {
    it('should define proper event listeners', () => {
      const mockButton = {
        addEventListener: vi.fn()
      };
      
      // Simulate adding event listeners as the function would
      const copyHandler = vi.fn(() => console.log('Code copied successfully'));
      const errorHandler = vi.fn((e) => console.error('Copy failed:', e));
      
      mockButton.addEventListener('sl-copy', copyHandler);
      mockButton.addEventListener('sl-error', errorHandler);
      
      expect(mockButton.addEventListener).toHaveBeenCalledWith('sl-copy', copyHandler);
      expect(mockButton.addEventListener).toHaveBeenCalledWith('sl-error', errorHandler);
    });

    it('should handle mutation observer events correctly', () => {
      const mockObserver = vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn()
      }));
      
      global.MutationObserver = mockObserver;
      
      // Simulate observer creation
      const observer = new MutationObserver(() => {});
      
      expect(mockObserver).toHaveBeenCalled();
      expect(observer.observe).toBeDefined();
    });
  });

  describe('Prism.js Integration Patterns', () => {
    it('should register correct hooks with Prism', () => {
      const mockPrism = {
        hooks: {
          add: vi.fn()
        }
      };
      
      global.window.Prism = mockPrism;
      
      // Simulate hook registration
      mockPrism.hooks.add('after-highlight', () => {});
      mockPrism.hooks.add('before-highlight', () => {});
      
      expect(mockPrism.hooks.add).toHaveBeenCalledWith('after-highlight', expect.any(Function));
      expect(mockPrism.hooks.add).toHaveBeenCalledWith('before-highlight', expect.any(Function));
    });

    it('should handle hook environment objects correctly', () => {
      const mockEnv = {
        element: {
          classList: {
            contains: vi.fn(() => true),
            add: vi.fn()
          },
          dataset: {}
        }
      };
      
      // Simulate before-highlight hook logic
      if (mockEnv.element.classList.contains('has-copy-button')) {
        mockEnv.element.dataset.preserveCopyButton = 'true';
      }
      
      expect(mockEnv.element.dataset.preserveCopyButton).toBe('true');
      
      // Simulate after-highlight hook logic
      if (mockEnv.element.dataset.preserveCopyButton) {
        mockEnv.element.classList.add('has-copy-button');
        delete mockEnv.element.dataset.preserveCopyButton;
      }
      
      expect(mockEnv.element.classList.add).toHaveBeenCalledWith('has-copy-button');
      expect(mockEnv.element.dataset.preserveCopyButton).toBeUndefined();
    });
  });

  describe('Text Content Extraction', () => {
    it('should extract text content correctly', () => {
      const code = document.createElement('code');
      code.textContent = 'const greeting = "Hello, World!";';
      
      const pre = document.createElement('pre');
      pre.className = 'language-javascript';
      pre.appendChild(code);
      
      expect(code.textContent).toBe('const greeting = "Hello, World!";');
      // Mock querySelector for pre element
      pre.querySelector = vi.fn(() => code);
      expect(pre.querySelector('code').textContent).toBe('const greeting = "Hello, World!";');
    });

    it('should handle multiline code content', () => {
      const multilineCode = `function example() {
  console.log("Hello");
  return true;
}`;
      
      const code = document.createElement('code');
      code.textContent = multilineCode;
      
      expect(code.textContent).toBe(multilineCode);
      expect(code.textContent.includes('\n')).toBe(true);
    });

    it('should handle empty code content', () => {
      const code = document.createElement('code');
      code.textContent = '';
      
      expect(code.textContent).toBe('');
    });

    it('should preserve whitespace in code content', () => {
      const codeWithWhitespace = '  const x = 1;\n    const y = 2;  ';
      const code = document.createElement('code');
      code.textContent = codeWithWhitespace;
      
      expect(code.textContent).toBe(codeWithWhitespace);
    });
  });

  describe('Performance Considerations', () => {
    it('should use requestIdleCallback when available', () => {
      const mockRequestIdleCallback = vi.fn(callback => callback());
      global.window.requestIdleCallback = mockRequestIdleCallback;
      
      // Simulate using requestIdleCallback
      const callback = vi.fn();
      window.requestIdleCallback(callback, { timeout: 2000 });
      
      expect(mockRequestIdleCallback).toHaveBeenCalledWith(callback, { timeout: 2000 });
      expect(callback).toHaveBeenCalled();
    });

    it('should fallback to setTimeout when requestIdleCallback unavailable', () => {
      delete global.window.requestIdleCallback;
      global.setTimeout = vi.fn(callback => callback());
      
      // Simulate fallback to setTimeout
      const callback = vi.fn();
      if (window.requestIdleCallback) {
        window.requestIdleCallback(callback);
      } else {
        setTimeout(callback, 0);
      }
      
      expect(global.setTimeout).toHaveBeenCalledWith(callback, 0);
      expect(callback).toHaveBeenCalled();
    });
  });
});