import { describe, it, expect } from 'vitest';
import { externalLink, internalLink, dictionaryLink } from 'src/lib/shortcodes.js';

/**
 * Tests for HTML escaping in shortcode parameters — audit bug blog-i67.
 * All user-facing parameters interpolated into HTML attributes must be escaped.
 */

describe('shortcode HTML escaping (blog-i67)', () => {
  describe('externalLink', () => {
    it('should escape double quotes in text parameter', () => {
      const result = externalLink('click "here"', 'https://example.com');
      expect(result).not.toContain('click "here"');
      expect(result).toContain('click &quot;here&quot;');
    });

    it('should escape angle brackets in text parameter', () => {
      const result = externalLink('<script>alert(1)</script>', 'https://example.com');
      expect(result).not.toContain('<script>alert(1)</script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape double quotes in url parameter', () => {
      const result = externalLink('link', 'https://example.com/a"onmouseover="alert(1)');
      expect(result).not.toContain('a"onmouseover');
    });

    it('should escape double quotes in ariaLabel parameter', () => {
      const result = externalLink('link', 'https://example.com', 'label"onmouseover="alert(1)');
      expect(result).not.toContain('label"onmouseover');
    });
  });

  describe('internalLink', () => {
    it('should escape double quotes in text parameter', () => {
      const result = internalLink('click "here"', '/page');
      expect(result).not.toContain('click "here"');
      expect(result).toContain('click &quot;here&quot;');
    });

    it('should escape angle brackets in text parameter', () => {
      const result = internalLink('<img src=x>', '/page');
      expect(result).not.toContain('<img src=x>');
      expect(result).toContain('&lt;img src=x&gt;');
    });

    it('should escape double quotes in url parameter', () => {
      const result = internalLink('link', '/page"onmouseover="alert(1)');
      expect(result).not.toContain('page"onmouseover');
    });
  });

  describe('dictionaryLink', () => {
    it('should escape double quotes in text parameter', () => {
      const result = dictionaryLink('click "here"', 'encryption');
      expect(result).not.toContain('click "here"');
      expect(result).toContain('click &quot;here&quot;');
    });

    it('should escape angle brackets in text parameter', () => {
      const result = dictionaryLink('<script>xss</script>', 'encryption');
      expect(result).not.toContain('<script>xss</script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape double quotes in term parameter', () => {
      const result = dictionaryLink('test', 'term"onmouseover="alert(1)');
      expect(result).not.toContain('term"onmouseover');
    });
  });
});
