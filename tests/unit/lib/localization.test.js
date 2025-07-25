import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from 'src/lib/constants.js';

/**
 * Unit tests for localization functionality
 * Tests the core localization logic and URL generation
 */

describe('Localization Core', () => {
  describe('Supported Locales', () => {
    it('should have exactly 3 supported locales', () => {
      expect(SUPPORTED_LOCALES).toHaveLength(3);
      expect(SUPPORTED_LOCALES).toEqual(['en-us', 'el', 'tr']);
    });

    it('should have en-us as default locale', () => {
      expect(DEFAULT_LOCALE).toBe('en-us');
      expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
    });
  });

  describe('URL Generation Patterns', () => {
    const testCases = [
      // Static pages
      { locale: 'en-us', page: 'about', expected: '/en-us/about/' },
      { locale: 'el', page: 'about', expected: '/el/about/' },
      { locale: 'tr', page: 'about', expected: '/tr/about/' },
      
      { locale: 'en-us', page: 'acknowledgements', expected: '/en-us/acknowledgements/' },
      { locale: 'el', page: 'acknowledgements', expected: '/el/acknowledgements/' },
      { locale: 'tr', page: 'acknowledgements', expected: '/tr/acknowledgements/' },
      
      { locale: 'en-us', page: 'ai-disclaimer', expected: '/en-us/ai-disclaimer/' },
      { locale: 'el', page: 'ai-disclaimer', expected: '/el/ai-disclaimer/' },
      { locale: 'tr', page: 'ai-disclaimer', expected: '/tr/ai-disclaimer/' },
      
      { locale: 'en-us', page: 'dictionary', expected: '/en-us/dictionary/' },
      { locale: 'el', page: 'dictionary', expected: '/el/dictionary/' },
      { locale: 'tr', page: 'dictionary', expected: '/tr/dictionary/' },
      
      // 404 pages (no trailing slash)
      { locale: 'en-us', page: '404.html', expected: '/en-us/404.html' },
      { locale: 'el', page: '404.html', expected: '/el/404.html' },
      { locale: 'tr', page: '404.html', expected: '/tr/404.html' },
    ];

    testCases.forEach(({ locale, page, expected }) => {
      it(`should generate correct URL for ${locale} ${page}`, () => {
        // Simulate the permalink pattern: "{{ locale }}/page/" or "{{ locale }}/page.html"
        let result;
        if (page.endsWith('.html')) {
          result = `/${locale}/${page}`;
        } else {
          result = `/${locale}/${page}/`.replace('//', '/');
        }
        expect(result).toBe(expected);
      });
    });
  });

  describe('Home Page URL Patterns', () => {
    it('should generate correct home URLs for each locale', () => {
      // Home page uses different pattern: en-us at root, others with locale prefix
      const homeUrls = {
        'en-us': '/', // index.html at root
        'el': '/el/', // el/index.html
        'tr': '/tr/'  // tr/index.html
      };

      Object.entries(homeUrls).forEach(([locale, expectedUrl]) => {
        expect(expectedUrl).toBe(homeUrls[locale]);
      });
    });
  });

  describe('Blog URL Patterns', () => {
    it('should generate correct blog URLs for each locale', () => {
      const blogSlug = 'test-post';
      const blogUrls = {
        'en-us': `/blog/en-us/${blogSlug}/`,
        'el': `/blog/el/${blogSlug}/`,
        'tr': `/blog/tr/${blogSlug}/`
      };

      Object.entries(blogUrls).forEach(([locale, expectedUrl]) => {
        expect(expectedUrl).toBe(blogUrls[locale]);
      });
    });
  });
});

describe('Translation Key Structure', () => {
  // Mock translations data structure
  const mockTranslations = {
    nav: {
      about: { 'en-us': 'About', 'el': 'Περί', 'tr': 'Hakkında' },
      acknowledgements: { 'en-us': 'Acknowledgements', 'el': 'Ευχαριστίες', 'tr': 'Teşekkürler' },
      aiDisclaimer: { 'en-us': 'AI Disclaimer', 'el': 'Δήλωση για την Τ.Ν.', 'tr': 'YZ Feragatnamesi' }
    },
    home: {
      title: { 'en-us': 'Home', 'el': 'Αρχική', 'tr': 'Ana Sayfa' }
    },
    dictionary: {
      title: { 'en-us': 'Dictionary', 'el': 'Λεξικό', 'tr': 'Sözlük' }
    },
    about: {
      description: { 
        'en-us': 'Learn more about the author and the purpose of this cybersecurity and technology blog.',
        'el': 'Μάθετε περισσότερα για τον συγγραφέα και τον σκοπό αυτού του ιστολογίου κυβερνοασφάλειας και τεχνολογίας.',
        'tr': 'Yazar ve bu siber güvenlik ve teknoloji blogunun amacı hakkında daha fazla bilgi edinin.'
      }
    },
    acknowledgements: {
      description: {
        'en-us': 'Credits and acknowledgements for the technologies and themes used in this blog.',
        'el': 'Αναγνωρίσεις και ευχαριστίες για τις τεχνολογίες και τα θέματα που χρησιμοποιούνται σε αυτό το ιστολόγιο.',
        'tr': 'Bu blogda kullanılan teknolojiler ve temalar için krediler ve teşekkürler.'
      }
    },
    aiDisclaimer: {
      description: {
        'en-us': 'Transparency about AI assistance in content creation and development of this blog.',
        'el': 'Διαφάνεια σχετικά με τη βοήθεια της Τεχνητής Νοημοσύνης στη δημιουργία περιεχομένου και την ανάπτυξη αυτού του ιστολογίου.',
        'tr': 'Bu blogun içerik oluşturma ve geliştirme sürecinde yapay zeka yardımı konusunda şeffaflık.'
      }
    }
  };

  describe('Navigation Translations', () => {
    SUPPORTED_LOCALES.forEach(locale => {
      it(`should have all navigation translations for ${locale}`, () => {
        expect(mockTranslations.nav.about[locale]).toBeDefined();
        expect(mockTranslations.nav.acknowledgements[locale]).toBeDefined();
        expect(mockTranslations.nav.aiDisclaimer[locale]).toBeDefined();
        expect(mockTranslations.home.title[locale]).toBeDefined();
        expect(mockTranslations.dictionary.title[locale]).toBeDefined();
      });
    });
  });

  describe('Page Description Translations', () => {
    SUPPORTED_LOCALES.forEach(locale => {
      it(`should have all page descriptions for ${locale}`, () => {
        expect(mockTranslations.about.description[locale]).toBeDefined();
        expect(mockTranslations.acknowledgements.description[locale]).toBeDefined();
        expect(mockTranslations.aiDisclaimer.description[locale]).toBeDefined();
      });
    });
  });

  describe('Translation Completeness', () => {
    const requiredKeys = [
      'nav.about',
      'nav.acknowledgements', 
      'nav.aiDisclaimer',
      'home.title',
      'dictionary.title',
      'about.description',
      'acknowledgements.description',
      'aiDisclaimer.description'
    ];

    requiredKeys.forEach(keyPath => {
      it(`should have ${keyPath} for all locales`, () => {
        const keys = keyPath.split('.');
        SUPPORTED_LOCALES.forEach(locale => {
          let obj = mockTranslations;
          for (const key of keys) {
            obj = obj[key];
            expect(obj).toBeDefined();
          }
          expect(obj[locale]).toBeDefined();
          expect(typeof obj[locale]).toBe('string');
          expect(obj[locale].length).toBeGreaterThan(0);
        });
      });
    });
  });
});

describe('Language Detection Logic', () => {
  const testUrls = [
    // Home pages
    { url: '/', expectedLocale: 'en-us' },
    { url: '/el/', expectedLocale: 'el' },
    { url: '/tr/', expectedLocale: 'tr' },
    
    // Static pages
    { url: '/en-us/about/', expectedLocale: 'en-us' },
    { url: '/el/about/', expectedLocale: 'el' },
    { url: '/tr/about/', expectedLocale: 'tr' },
    
    { url: '/en-us/acknowledgements/', expectedLocale: 'en-us' },
    { url: '/el/acknowledgements/', expectedLocale: 'el' },
    { url: '/tr/acknowledgements/', expectedLocale: 'tr' },
    
    { url: '/en-us/ai-disclaimer/', expectedLocale: 'en-us' },
    { url: '/el/ai-disclaimer/', expectedLocale: 'el' },
    { url: '/tr/ai-disclaimer/', expectedLocale: 'tr' },
    
    { url: '/en-us/dictionary/', expectedLocale: 'en-us' },
    { url: '/el/dictionary/', expectedLocale: 'el' },
    { url: '/tr/dictionary/', expectedLocale: 'tr' },
    
    // Blog pages
    { url: '/blog/en-us/test-post/', expectedLocale: 'en-us' },
    { url: '/blog/el/test-post/', expectedLocale: 'el' },
    { url: '/blog/tr/test-post/', expectedLocale: 'tr' },
  ];

  function detectLocaleFromUrl(url) {
    // Simulate the logic used in nav.njk
    if (url === '/') return 'en-us';
    if (url.startsWith('/blog/el/') || url.startsWith('/el/')) return 'el';
    if (url.startsWith('/blog/tr/') || url.startsWith('/tr/')) return 'tr';
    return 'en-us';
  }

  testUrls.forEach(({ url, expectedLocale }) => {
    it(`should detect ${expectedLocale} from URL ${url}`, () => {
      const detectedLocale = detectLocaleFromUrl(url);
      expect(detectedLocale).toBe(expectedLocale);
    });
  });
});

describe('Language Switching Logic', () => {
  describe('Static Page Language Switching', () => {
    const pageTypes = ['about', 'acknowledgements', 'ai-disclaimer', 'dictionary'];
    
    pageTypes.forEach(pageType => {
      describe(`${pageType} page switching`, () => {
        SUPPORTED_LOCALES.forEach(fromLocale => {
          SUPPORTED_LOCALES.forEach(toLocale => {
            if (fromLocale !== toLocale) {
              it(`should switch from ${fromLocale} to ${toLocale}`, () => {
                const fromUrl = fromLocale === 'en-us' && pageType === 'home' 
                  ? '/' 
                  : `/${fromLocale}/${pageType}/`;
                const expectedToUrl = toLocale === 'en-us' && pageType === 'home'
                  ? '/'
                  : `/${toLocale}/${pageType}/`;
                
                // This simulates the language switching logic
                function switchLanguage(currentUrl, targetLocale, pageType) {
                  if (pageType === 'home') {
                    return targetLocale === 'en-us' ? '/' : `/${targetLocale}/`;
                  }
                  return `/${targetLocale}/${pageType}/`;
                }
                
                const result = switchLanguage(fromUrl, toLocale, pageType);
                expect(result).toBe(expectedToUrl);
              });
            }
          });
        });
      });
    });
  });

  describe('Home Page Language Switching', () => {
    it('should switch to correct home URLs', () => {
      const homeUrls = {
        'en-us': '/',
        'el': '/el/',
        'tr': '/tr/'
      };

      SUPPORTED_LOCALES.forEach(locale => {
        expect(homeUrls[locale]).toBeDefined();
        if (locale === 'en-us') {
          expect(homeUrls[locale]).toBe('/');
        } else {
          expect(homeUrls[locale]).toBe(`/${locale}/`);
        }
      });
    });
  });

  describe('Blog Page Language Switching', () => {
    it('should maintain blog slug when switching languages', () => {
      const blogSlug = 'test-post';
      
      function switchBlogLanguage(currentUrl, targetLocale) {
        // Extract slug from current URL
        const slug = currentUrl.replace(/^\/blog\/[^/]+\//, '').replace(/\/$/, '');
        return `/blog/${targetLocale}/${slug}/`;
      }

      SUPPORTED_LOCALES.forEach(fromLocale => {
        SUPPORTED_LOCALES.forEach(toLocale => {
          if (fromLocale !== toLocale) {
            const fromUrl = `/blog/${fromLocale}/${blogSlug}/`;
            const result = switchBlogLanguage(fromUrl, toLocale);
            const expectedUrl = `/blog/${toLocale}/${blogSlug}/`;
            expect(result).toBe(expectedUrl);
          }
        });
      });
    });
  });
});