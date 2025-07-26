import { describe, it, expect } from 'vitest';
import { SUPPORTED_LOCALES } from 'src/lib/constants.js';

/**
 * Unit tests for navigation helper functions and URL generation logic
 * Tests the core logic used in navigation templates
 */

describe('Navigation Helpers', () => {
  describe('Locale Detection from URL', () => {
    /**
     * Simulates the locale detection logic used in nav.njk
     */
    function detectLocaleFromUrl(url) {
      if (url === '/') return 'en-us';
      if (url.startsWith('/blog/el/') || url.startsWith('/el/')) return 'el';
      if (url.startsWith('/blog/tr/') || url.startsWith('/tr/')) return 'tr';
      if (url.startsWith('/blog/en-us/') || url.startsWith('/en-us/')) return 'en-us';
      return 'en-us'; // fallback
    }

    const testCases = [
      // Home pages
      { url: '/', expected: 'en-us' },
      { url: '/el/', expected: 'el' },
      { url: '/tr/', expected: 'tr' },
      
      // Static pages
      { url: '/en-us/about/', expected: 'en-us' },
      { url: '/el/about/', expected: 'el' },
      { url: '/tr/about/', expected: 'tr' },
      { url: '/en-us/acknowledgements/', expected: 'en-us' },
      { url: '/el/acknowledgements/', expected: 'el' },
      { url: '/tr/acknowledgements/', expected: 'tr' },
      { url: '/en-us/ai-disclaimer/', expected: 'en-us' },
      { url: '/el/ai-disclaimer/', expected: 'el' },
      { url: '/tr/ai-disclaimer/', expected: 'tr' },
      { url: '/en-us/dictionary/', expected: 'en-us' },
      { url: '/el/dictionary/', expected: 'el' },
      { url: '/tr/dictionary/', expected: 'tr' },
      
      // Blog pages
      { url: '/blog/en-us/test-post/', expected: 'en-us' },
      { url: '/blog/el/test-post/', expected: 'el' },
      { url: '/blog/tr/test-post/', expected: 'tr' },
      
      // Edge cases
      { url: '/unknown/', expected: 'en-us' },
      { url: '/en-us/', expected: 'en-us' },
      { url: '', expected: 'en-us' }
    ];

    testCases.forEach(({ url, expected }) => {
      it(`should detect ${expected} from URL: ${url}`, () => {
        expect(detectLocaleFromUrl(url)).toBe(expected);
      });
    });
  });

  describe('Home URL Generation', () => {
    /**
     * Simulates the home URL generation logic used in nav.njk
     */
    function generateHomeUrl(currentUrl) {
      const locale = detectLocaleFromUrl(currentUrl);
      return locale === 'en-us' ? '/' : `/${locale}/`;
    }

    function detectLocaleFromUrl(url) {
      if (url === '/') return 'en-us';
      if (url.startsWith('/blog/el/') || url.startsWith('/el/')) return 'el';
      if (url.startsWith('/blog/tr/') || url.startsWith('/tr/')) return 'tr';
      if (url.startsWith('/blog/en-us/') || url.startsWith('/en-us/')) return 'en-us';
      return 'en-us';
    }

    const testCases = [
      { currentUrl: '/en-us/about/', expectedHome: '/' },
      { currentUrl: '/el/about/', expectedHome: '/el/' },
      { currentUrl: '/tr/about/', expectedHome: '/tr/' },
      { currentUrl: '/blog/en-us/post/', expectedHome: '/' },
      { currentUrl: '/blog/el/post/', expectedHome: '/el/' },
      { currentUrl: '/blog/tr/post/', expectedHome: '/tr/' },
      { currentUrl: '/', expectedHome: '/' }
    ];

    testCases.forEach(({ currentUrl, expectedHome }) => {
      it(`should generate home URL ${expectedHome} from ${currentUrl}`, () => {
        expect(generateHomeUrl(currentUrl)).toBe(expectedHome);
      });
    });
  });

  describe('Navigation URL Generation', () => {
    /**
     * Simulates the navigation URL generation logic used in nav.njk
     */
    function generateNavUrl(currentUrl, targetPage) {
      const locale = detectLocaleFromUrl(currentUrl);
      
      if (targetPage === 'home') {
        return locale === 'en-us' ? '/' : `/${locale}/`;
      }
      
      return `/${locale}/${targetPage}/`;
    }

    function detectLocaleFromUrl(url) {
      if (url === '/') return 'en-us';
      if (url.startsWith('/blog/el/') || url.startsWith('/el/')) return 'el';
      if (url.startsWith('/blog/tr/') || url.startsWith('/tr/')) return 'tr';
      if (url.startsWith('/blog/en-us/') || url.startsWith('/en-us/')) return 'en-us';
      return 'en-us';
    }

    const pages = ['about', 'acknowledgements', 'ai-disclaimer', 'dictionary'];
    const currentUrls = ['/en-us/about/', '/el/about/', '/tr/about/'];

    currentUrls.forEach(currentUrl => {
      const locale = detectLocaleFromUrl(currentUrl);
      
      pages.forEach(page => {
        it(`should generate ${page} URL for ${locale} from ${currentUrl}`, () => {
          const result = generateNavUrl(currentUrl, page);
          const expected = `/${locale}/${page}/`;
          expect(result).toBe(expected);
        });
      });

      it(`should generate home URL for ${locale} from ${currentUrl}`, () => {
        const result = generateNavUrl(currentUrl, 'home');
        const expected = locale === 'en-us' ? '/' : `/${locale}/`;
        expect(result).toBe(expected);
      });
    });
  });

  describe('Language Switching URL Generation', () => {
    /**
     * Simulates the language switching logic used in nav.njk
     */
    function generateLanguageSwitchUrl(currentUrl, targetLocale) {
      // Determine current page type
      if (currentUrl === '/' || currentUrl.match(/^\/[a-z-]+\/$/)) {
        // Home page
        return targetLocale === 'en-us' ? '/' : `/${targetLocale}/`;
      }
      
      if (currentUrl.includes('/blog/')) {
        // Blog page - extract slug
        const slug = currentUrl.replace(/^\/blog\/[^/]+\//, '').replace(/\/$/, '');
        return `/blog/${targetLocale}/${slug}/`;
      }
      
      // Static page - extract page name
      const pageMatch = currentUrl.match(/\/([^/]+)\/$/);
      if (pageMatch) {
        const pageName = pageMatch[1];
        if (['about', 'acknowledgements', 'ai-disclaimer', 'dictionary'].includes(pageName)) {
          return `/${targetLocale}/${pageName}/`;
        }
      }
      
      // Fallback to home
      return targetLocale === 'en-us' ? '/' : `/${targetLocale}/`;
    }

    describe('Home page language switching', () => {
      const testCases = [
        { from: '/', to: 'en-us', expected: '/' },
        { from: '/', to: 'el', expected: '/el/' },
        { from: '/', to: 'tr', expected: '/tr/' },
        { from: '/el/', to: 'en-us', expected: '/' },
        { from: '/el/', to: 'tr', expected: '/tr/' },
        { from: '/tr/', to: 'en-us', expected: '/' },
        { from: '/tr/', to: 'el', expected: '/el/' }
      ];

      testCases.forEach(({ from, to, expected }) => {
        it(`should switch from ${from} to ${to} -> ${expected}`, () => {
          expect(generateLanguageSwitchUrl(from, to)).toBe(expected);
        });
      });
    });

    describe('Static page language switching', () => {
      const pages = ['about', 'acknowledgements', 'ai-disclaimer', 'dictionary'];
      
      pages.forEach(page => {
        SUPPORTED_LOCALES.forEach(fromLocale => {
          SUPPORTED_LOCALES.forEach(toLocale => {
            if (fromLocale !== toLocale) {
              it(`should switch ${page} from ${fromLocale} to ${toLocale}`, () => {
                const fromUrl = `/${fromLocale}/${page}/`;
                const result = generateLanguageSwitchUrl(fromUrl, toLocale);
                const expected = `/${toLocale}/${page}/`;
                expect(result).toBe(expected);
              });
            }
          });
        });
      });
    });

    describe('Blog page language switching', () => {
      const blogSlug = 'test-post';
      
      SUPPORTED_LOCALES.forEach(fromLocale => {
        SUPPORTED_LOCALES.forEach(toLocale => {
          if (fromLocale !== toLocale) {
            it(`should switch blog post from ${fromLocale} to ${toLocale}`, () => {
              const fromUrl = `/blog/${fromLocale}/${blogSlug}/`;
              const result = generateLanguageSwitchUrl(fromUrl, toLocale);
              const expected = `/blog/${toLocale}/${blogSlug}/`;
              expect(result).toBe(expected);
            });
          }
        });
      });
    });
  });

  describe('URL Validation', () => {
    /**
     * Validates URL patterns for consistency
     */
    function isValidLocalizedUrl(url, locale) {
      // Home page patterns
      if (locale === 'en-us' && url === '/') return true;
      if (locale !== 'en-us' && url === `/${locale}/`) return true;
      
      // Static page patterns
      const staticPages = ['about', 'acknowledgements', 'ai-disclaimer', 'dictionary'];
      for (const page of staticPages) {
        if (url === `/${locale}/${page}/`) return true;
      }
      
      // Blog page patterns - only for valid locales
      if (SUPPORTED_LOCALES.includes(locale) && url.match(new RegExp(`^/blog/${locale}/[^/]+/$`))) return true;
      
      // 404 page patterns
      if (url === `/${locale}/404.html`) return true;
      
      return false;
    }

    describe('Valid URL patterns', () => {
      const validUrls = [
        // Home pages
        { url: '/', locale: 'en-us' },
        { url: '/el/', locale: 'el' },
        { url: '/tr/', locale: 'tr' },
        
        // Static pages
        { url: '/en-us/about/', locale: 'en-us' },
        { url: '/el/about/', locale: 'el' },
        { url: '/tr/about/', locale: 'tr' },
        { url: '/en-us/acknowledgements/', locale: 'en-us' },
        { url: '/el/acknowledgements/', locale: 'el' },
        { url: '/tr/acknowledgements/', locale: 'tr' },
        { url: '/en-us/ai-disclaimer/', locale: 'en-us' },
        { url: '/el/ai-disclaimer/', locale: 'el' },
        { url: '/tr/ai-disclaimer/', locale: 'tr' },
        { url: '/en-us/dictionary/', locale: 'en-us' },
        { url: '/el/dictionary/', locale: 'el' },
        { url: '/tr/dictionary/', locale: 'tr' },
        
        // Blog pages
        { url: '/blog/en-us/test-post/', locale: 'en-us' },
        { url: '/blog/el/test-post/', locale: 'el' },
        { url: '/blog/tr/test-post/', locale: 'tr' },
        
        // 404 pages
        { url: '/en-us/404.html', locale: 'en-us' },
        { url: '/el/404.html', locale: 'el' },
        { url: '/tr/404.html', locale: 'tr' }
      ];

      validUrls.forEach(({ url, locale }) => {
        it(`should validate ${url} as valid for ${locale}`, () => {
          expect(isValidLocalizedUrl(url, locale)).toBe(true);
        });
      });
    });

    describe('Invalid URL patterns', () => {
      const invalidUrls = [
        // Wrong locale for home
        { url: '/', locale: 'el' },
        { url: '/el/', locale: 'en-us' },
        
        // Non-existent pages
        { url: '/en-us/nonexistent/', locale: 'en-us' },
        { url: '/el/invalid/', locale: 'el' },
        
        // Wrong patterns
        { url: '/en-us/', locale: 'en-us' }, // en-us home should be at /
        { url: '/blog/invalid/post/', locale: 'invalid' },
        
        // Missing trailing slashes
        { url: '/en-us/about', locale: 'en-us' },
        { url: '/el/dictionary', locale: 'el' }
      ];

      invalidUrls.forEach(({ url, locale }) => {
        it(`should invalidate ${url} for ${locale}`, () => {
          expect(isValidLocalizedUrl(url, locale)).toBe(false);
        });
      });
    });
  });

  describe('Edge Case Handling', () => {
    function detectLocaleFromUrl(url) {
      if (url === '/') return 'en-us';
      if (url.startsWith('/blog/el/') || url.startsWith('/el/')) return 'el';
      if (url.startsWith('/blog/tr/') || url.startsWith('/tr/')) return 'tr';
      if (url.startsWith('/blog/en-us/') || url.startsWith('/en-us/')) return 'en-us';
      return 'en-us';
    }

    describe('Malformed URLs', () => {
      const edgeCases = [
        { url: '', expected: 'en-us' },
        { url: '///', expected: 'en-us' },
        { url: '/el//about/', expected: 'el' },
        { url: '/tr/about//', expected: 'tr' },
        { url: '/blog/en-us//', expected: 'en-us' },
        { url: '/unknown/path/', expected: 'en-us' }
      ];

      edgeCases.forEach(({ url, expected }) => {
        it(`should handle malformed URL ${url} gracefully`, () => {
          expect(detectLocaleFromUrl(url)).toBe(expected);
        });
      });
    });

    describe('Case sensitivity', () => {
      const caseSensitiveCases = [
        { url: '/EL/about/', expected: 'en-us' }, // Should not match
        { url: '/TR/about/', expected: 'en-us' }, // Should not match
        { url: '/EN-US/about/', expected: 'en-us' }, // Should not match
        { url: '/Blog/en-us/post/', expected: 'en-us' } // Should not match blog
      ];

      caseSensitiveCases.forEach(({ url, expected }) => {
        it(`should handle case-sensitive URL ${url}`, () => {
          expect(detectLocaleFromUrl(url)).toBe(expected);
        });
      });
    });
  });
});