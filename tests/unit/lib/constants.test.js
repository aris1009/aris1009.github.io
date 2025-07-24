import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LOCALES,
  LOCALE_MAP,
  FALLBACK_LOCALES,
  DEFAULT_LOCALE,
  EXCLUDED_TAGS,
  BLOG_GLOBS,
  TEMPLATE_FORMATS,
  HTML_MINIFY_OPTIONS
} from 'src/lib/constants.js';

describe('constants', () => {
  describe('SUPPORTED_LOCALES', () => {
    it('should contain expected locales', () => {
      expect(SUPPORTED_LOCALES).toEqual(['en-us', 'el', 'tr']);
    });
  });

  describe('LOCALE_MAP', () => {
    it('should map locale codes to proper formats', () => {
      expect(LOCALE_MAP['en-us']).toBe('en-US');
      expect(LOCALE_MAP['el']).toBe('el');
      expect(LOCALE_MAP['tr']).toBe('tr');
    });
  });

  describe('FALLBACK_LOCALES', () => {
    it('should have correct fallback configuration', () => {
      expect(FALLBACK_LOCALES['*']).toBe('en-us');
    });
  });

  describe('DEFAULT_LOCALE', () => {
    it('should be en-us', () => {
      expect(DEFAULT_LOCALE).toBe('en-us');
    });
  });

  describe('EXCLUDED_TAGS', () => {
    it('should contain navigation and post tags', () => {
      expect(EXCLUDED_TAGS).toEqual(['all', 'nav', 'post', 'posts']);
    });
  });

  describe('BLOG_GLOBS', () => {
    it('should have correct glob patterns for each locale', () => {
      expect(BLOG_GLOBS['en-us']).toBe('src/blog/en-us/*.md');
      expect(BLOG_GLOBS.el).toBe('src/blog/el/*.md');
      expect(BLOG_GLOBS.tr).toBe('src/blog/tr/*.md');
    });
  });

  describe('TEMPLATE_FORMATS', () => {
    it('should contain supported template formats', () => {
      expect(TEMPLATE_FORMATS).toEqual(['md', 'njk', 'html', 'liquid']);
    });
  });

  describe('HTML_MINIFY_OPTIONS', () => {
    it('should have correct minification options', () => {
      expect(HTML_MINIFY_OPTIONS).toEqual({
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        decodeEntities: true
      });
    });
  });
});