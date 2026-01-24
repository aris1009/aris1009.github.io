import { describe, it, expect } from 'vitest';
import { htmlminTransform, processEmphasisInHTML, addHeaderAnchors } from 'src/lib/transforms.js';

describe('transforms', () => {
  describe('htmlminTransform', () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <!-- This is a comment -->
          <title>Test</title>
        </head>
        <body>
          <h1>Hello World</h1>
        </body>
      </html>
    `;

    it('should minify HTML content for .html files', () => {
      const result = htmlminTransform(htmlContent, '/path/to/file.html');
      
      expect(result).not.toContain('<!-- This is a comment -->');
      expect(result).not.toContain('\n      ');
      expect(result).toContain('<!doctype html>');
      expect(result).toContain('<title>Test</title>');
    });

    it('should return content unchanged for non-HTML files', () => {
      const result = htmlminTransform(htmlContent, '/path/to/file.css');
      expect(result).toBe(htmlContent);
    });

    it('should return content unchanged when outputPath is null', () => {
      const result = htmlminTransform(htmlContent, null);
      expect(result).toBe(htmlContent);
    });

    it('should return content unchanged when outputPath is undefined', () => {
      const result = htmlminTransform(htmlContent, undefined);
      expect(result).toBe(htmlContent);
    });

    it('should handle empty content', () => {
      const result = htmlminTransform('', '/path/to/file.html');
      expect(result).toBe('');
    });
  });

  describe('processEmphasisInHTML', () => {
    describe('basic functionality', () => {
      it('should convert single asterisks to em tags', () => {
        const input = '<article data-blog-post><p>This is *italic* text</p></article>';
        const expected = '<article data-blog-post><p>This is <em>italic</em> text</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should convert double asterisks to strong tags', () => {
        const input = '<article data-blog-post><p>This is **bold** text</p></article>';
        const expected = '<article data-blog-post><p>This is <strong>bold</strong> text</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle both em and strong in the same text', () => {
        const input = '<article data-blog-post><p>This is *italic* and **bold** text</p></article>';
        const expected = '<article data-blog-post><p>This is <em>italic</em> and <strong>bold</strong> text</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle multiple emphasis markers in the same text node', () => {
        const input = '<article data-blog-post><p>*first* and *second* and *third*</p></article>';
        const expected = '<article data-blog-post><p><em>first</em> and <em>second</em> and <em>third</em></p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });
    });

    describe('list items with inline HTML (the original bug case)', () => {
      it('should convert asterisks after inline HTML in list items', () => {
        const input = '<article data-blog-post><ul><li><sl-tooltip>Term</sl-tooltip> capture *why* decisions were made</li></ul></article>';
        const expected = '<article data-blog-post><ul><li><sl-tooltip>Term</sl-tooltip> capture <em>why</em> decisions were made</li></ul></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle multiple asterisks after inline HTML', () => {
        const input = '<article data-blog-post><li><span>HTML</span> capture *why* decisions, not just *what* happened</li></article>';
        const expected = '<article data-blog-post><li><span>HTML</span> capture <em>why</em> decisions, not just <em>what</em> happened</li></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle nested HTML elements with asterisks', () => {
        const input = '<article data-blog-post><li><sl-tooltip><button>Text</button></sl-tooltip> *emphasis* after nested HTML</li></article>';
        const expected = '<article data-blog-post><li><sl-tooltip><button>Text</button></sl-tooltip> <em>emphasis</em> after nested HTML</li></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle dictionary tooltip with asterisks (real-world case)', () => {
        const input = `<article data-blog-post><li>
          <sl-tooltip placement="bottom"><span slot="content">Definition</span><button>Context graphs</button></sl-tooltip>
          capture *why* decisions were made, not just *what* happened
        </li></article>`;
        const result = processEmphasisInHTML(input, 'test.html');
        expect(result).toContain('<em>why</em>');
        expect(result).toContain('<em>what</em>');
      });
    });

    describe('edge cases', () => {
      it('should not process asterisks inside HTML attributes', () => {
        const input = '<article data-blog-post><a href="test*with*asterisks">link</a></article>';
        const expected = '<article data-blog-post><a href="test*with*asterisks">link</a></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should not process asterisks in data attributes', () => {
        const input = '<article data-blog-post><div data-testid="test-*value*">text</div></article>';
        const expected = '<article data-blog-post><div data-testid="test-*value*">text</div></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle text with no asterisks', () => {
        const input = '<article data-blog-post><p>Plain text without emphasis</p></article>';
        const expected = '<article data-blog-post><p>Plain text without emphasis</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle empty text nodes', () => {
        const input = '<article data-blog-post><p></p></article>';
        const expected = '<article data-blog-post><p></p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle single asterisk without closing', () => {
        const input = '<article data-blog-post><p>Text with single * asterisk</p></article>';
        const expected = '<article data-blog-post><p>Text with single * asterisk</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle asterisks at start and end of text', () => {
        const input = '<article data-blog-post><p>*start* middle *end*</p></article>';
        const expected = '<article data-blog-post><p><em>start</em> middle <em>end</em></p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });
    });

    describe('guard conditions', () => {
      it('should not process non-HTML files', () => {
        const input = '<p>This is *italic* text</p>';
        expect(processEmphasisInHTML(input, 'test.css')).toBe(input);
        expect(processEmphasisInHTML(input, 'test.js')).toBe(input);
        expect(processEmphasisInHTML(input, 'test.json')).toBe(input);
      });

      it('should not process files without outputPath', () => {
        const input = '<p>This is *italic* text</p>';
        expect(processEmphasisInHTML(input, null)).toBe(input);
        expect(processEmphasisInHTML(input, undefined)).toBe(input);
        expect(processEmphasisInHTML(input, '')).toBe(input);
      });

      it('should not process non-blog-post HTML', () => {
        const input = '<article><p>This is *italic* text</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(input);
      });

      it('should only process HTML with data-blog-post attribute', () => {
        const input = '<div data-blog-post><p>This is *italic* text</p></div>';
        const expected = '<div data-blog-post><p>This is <em>italic</em> text</p></div>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });
    });

    describe('complex real-world scenarios', () => {
      it('should handle real blog post structure', () => {
        const input = `<article data-blog-post>
          <h1>Title</h1>
          <ul>
            <li><sl-tooltip>Context graphs</sl-tooltip> capture *why* decisions were made, not just *what* happened</li>
            <li>They bridge the gap between formal systems</li>
          </ul>
        </article>`;

        const result = processEmphasisInHTML(input, 'test.html');
        expect(result).toContain('<em>why</em>');
        expect(result).toContain('<em>what</em>');
      });

      it('should handle mixed emphasis and already-processed emphasis', () => {
        const input = '<article data-blog-post><p>Already <em>processed</em> and *unprocessed* text</p></article>';
        const expected = '<article data-blog-post><p>Already <em>processed</em> and <em>unprocessed</em> text</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle multi-line content', () => {
        const input = `<article data-blog-post>
          <p>First paragraph with *emphasis*</p>
          <p>Second paragraph with **strong**</p>
        </article>`;

        const result = processEmphasisInHTML(input, 'test.html');
        expect(result).toContain('<em>emphasis</em>');
        expect(result).toContain('<strong>strong</strong>');
      });
    });

    describe('regression prevention', () => {
      it('should not break existing em tags', () => {
        const input = '<article data-blog-post><p>Text with <em>existing</em> emphasis</p></article>';
        const expected = '<article data-blog-post><p>Text with <em>existing</em> emphasis</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should not break existing strong tags', () => {
        const input = '<article data-blog-post><p>Text with <strong>existing</strong> bold</p></article>';
        const expected = '<article data-blog-post><p>Text with <strong>existing</strong> bold</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should not process asterisks in code blocks', () => {
        const input = '<article data-blog-post><pre><code>function test() { return *ptr; }</code></pre></article>';
        const expected = '<article data-blog-post><pre><code>function test() { return *ptr; }</code></pre></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should not process asterisks in inline code', () => {
        const input = '<article data-blog-post><p>Use <code>*ptr</code> for pointers</p></article>';
        const expected = '<article data-blog-post><p>Use <code>*ptr</code> for pointers</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle asterisks in URLs correctly', () => {
        const input = '<article data-blog-post><a href="https://example.com/path*with*asterisks">link</a></article>';
        const expected = '<article data-blog-post><a href="https://example.com/path*with*asterisks">link</a></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });
    });

    describe('internationalization support', () => {
      it('should handle emphasis with Greek characters', () => {
        const input = '<article data-blog-post><p>Greek: *Ελληνικά* text</p></article>';
        const expected = '<article data-blog-post><p>Greek: <em>Ελληνικά</em> text</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle emphasis with Turkish characters', () => {
        const input = '<article data-blog-post><p>Turkish: *Türkçe* text</p></article>';
        const expected = '<article data-blog-post><p>Turkish: <em>Türkçe</em> text</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle emphasis with emoji', () => {
        const input = '<article data-blog-post><p>Emoji: *📘 test* text</p></article>';
        const expected = '<article data-blog-post><p>Emoji: <em>📘 test</em> text</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });

      it('should handle emphasis with mixed Unicode characters', () => {
        const input = '<article data-blog-post><p>Mixed: *Ελληνικά Türkçe 中文* text</p></article>';
        const expected = '<article data-blog-post><p>Mixed: <em>Ελληνικά Türkçe 中文</em> text</p></article>';
        expect(processEmphasisInHTML(input, 'test.html')).toBe(expected);
      });
    });
  });

  describe('addHeaderAnchors', () => {
    it('should add anchor links to h2 headings in blog posts', () => {
      const input = '<article data-blog-post><h2 id="test-heading">Test Heading</h2></article>';
      const result = addHeaderAnchors(input, 'test.html');
      expect(result).toContain('<a href="#test-heading"');
      expect(result).toContain('class="header-anchor"');
      expect(result).toContain('data-testid="anchor-link-test-heading"');
    });

    it('should not add anchors to non-blog-post pages', () => {
      const input = '<article><h2 id="test-heading">Test Heading</h2></article>';
      const result = addHeaderAnchors(input, 'test.html');
      expect(result).toBe(input);
    });

    it('should preserve other h2 attributes', () => {
      const input = '<article data-blog-post><h2 id="test" tabindex="-1" class="custom">Test</h2></article>';
      const result = addHeaderAnchors(input, 'test.html');
      expect(result).toContain('tabindex="-1"');
      expect(result).toContain('id="test"');
    });

    it('should not add anchors to non-HTML files', () => {
      const input = '<article data-blog-post><h2 id="test">Test</h2></article>';
      expect(addHeaderAnchors(input, 'test.css')).toBe(input);
    });

    it('should handle multiple h2 headings', () => {
      const input = `<article data-blog-post>
        <h2 id="first">First</h2>
        <h2 id="second">Second</h2>
      </article>`;
      const result = addHeaderAnchors(input, 'test.html');
      expect(result).toContain('anchor-link-first');
      expect(result).toContain('anchor-link-second');
    });
  });
});