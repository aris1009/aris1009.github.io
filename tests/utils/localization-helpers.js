/**
 * Test utilities for localization testing
 * Provides common helpers and patterns for testing localized functionality
 */

export const SUPPORTED_LOCALES = ['en-us', 'el', 'tr'];

export const LOCALE_FLAGS = {
  'en-us': '🇺🇸',
  'el': '🇬🇷', 
  'tr': '🇹🇷'
};

export const LOCALE_NAMES = {
  'en-us': 'English',
  'el': 'Greek',
  'tr': 'Turkish'
};

/**
 * Generate test cases for all locale combinations
 */
export function generateLocaleTestCases(testFunction) {
  return SUPPORTED_LOCALES.map(locale => ({
    locale,
    name: LOCALE_NAMES[locale],
    flag: LOCALE_FLAGS[locale],
    test: testFunction
  }));
}

/**
 * Generate test cases for locale switching (from -> to)
 */
export function generateLocaleSwitchingTestCases(testFunction) {
  const cases = [];
  SUPPORTED_LOCALES.forEach(fromLocale => {
    SUPPORTED_LOCALES.forEach(toLocale => {
      if (fromLocale !== toLocale) {
        cases.push({
          from: fromLocale,
          to: toLocale,
          fromName: LOCALE_NAMES[fromLocale],
          toName: LOCALE_NAMES[toLocale],
          test: testFunction
        });
      }
    });
  });
  return cases;
}

/**
 * URL pattern generators
 */
export const UrlPatterns = {
  home: (locale) => locale === 'en-us' ? '/' : `/${locale}/`,
  
  staticPage: (locale, page) => `/${locale}/${page}/`,
  
  blogPost: (locale, slug) => `/blog/${locale}/${slug}/`,
  
  notFound: (locale) => `/${locale}/404.html`,
  
  dictionary: (locale) => `/${locale}/dictionary/`
};

/**
 * Common page types for testing
 */
export const PAGE_TYPES = {
  STATIC_PAGES: ['about', 'acknowledgements', 'ai-disclaimer', 'dictionary'],
  ALL_PAGES: ['home', 'about', 'acknowledgements', 'ai-disclaimer', 'dictionary']
};

/**
 * Playwright helpers for localization testing
 */
export class LocalizationTestHelpers {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a localized page
   */
  async goToLocalizedPage(locale, pageType, slug = null) {
    let url;
    switch (pageType) {
      case 'home':
        url = UrlPatterns.home(locale);
        break;
      case 'blog':
        url = UrlPatterns.blogPost(locale, slug || 'test-post');
        break;
      default:
        url = UrlPatterns.staticPage(locale, pageType);
    }
    
    await this.page.goto(url);
    return url;
  }

  /**
   * Switch language using the language selector
   */
  async switchLanguage(targetLocale) {
    await this.page.locator('#language-toggle').click();
    await this.page.locator(`[data-lang="${targetLocale}"]`).click();
  }

  /**
   * Verify current language indicator
   */
  async verifyCurrentLanguage(expectedLocale) {
    const expectedFlag = LOCALE_FLAGS[expectedLocale];
    await this.page.locator('#current-language .flag').waitFor();
    const currentFlag = await this.page.locator('#current-language .flag').textContent();
    if (currentFlag !== expectedFlag) {
      throw new Error(`Expected language flag ${expectedFlag} but got ${currentFlag}`);
    }
  }

  /**
   * Verify page URL matches expected pattern
   */
  async verifyUrl(expectedUrl) {
    const currentUrl = this.page.url();
    const urlPath = new URL(currentUrl).pathname;
    if (urlPath !== expectedUrl) {
      throw new Error(`Expected URL ${expectedUrl} but got ${urlPath}`);
    }
  }

  /**
   * Navigate using burger menu
   */
  async navigateViaBurgerMenu(linkIndex) {
    await this.page.getByTestId('burger-toggle').click();
    await this.page.locator('.burger-nav-link').nth(linkIndex).click();
  }

  /**
   * Get all navigation link hrefs from burger menu
   */
  async getBurgerMenuLinks() {
    await this.page.getByTestId('burger-toggle').click();
    const links = await this.page.locator('.burger-nav-link').evaluateAll(
      elements => elements.map(el => el.getAttribute('href'))
    );
    // Close menu
    await this.page.locator('body').click();
    return links;
  }

  /**
   * Verify page has basic structure
   */
  async verifyPageStructure() {
    await this.page.locator('main').waitFor();
    await this.page.locator('h1').waitFor();
    await this.page.getByTestId('language-selector-container').waitFor();
    await this.page.getByTestId('burger-toggle').waitFor();
  }

  /**
   * Get page content for comparison
   */
  async getPageContent() {
    return {
      title: await this.page.locator('h1').textContent(),
      content: await this.page.locator('main').textContent(),
      pageTitle: await this.page.title()
    };
  }

  /**
   * Verify content differs between locales
   */
  static verifyContentDiffers(content1, content2, locale1, locale2) {
    // At minimum, English should differ from Greek/Turkish
    if ((locale1 === 'en-us' && locale2 !== 'en-us') || 
        (locale2 === 'en-us' && locale1 !== 'en-us')) {
      if (content1.title === content2.title) {
        throw new Error(`Title should differ between ${locale1} and ${locale2}`);
      }
    }
  }
}

/**
 * Vitest helpers for unit testing
 */
export class UnitTestHelpers {
  /**
   * Create mock page object for testing navigation logic
   */
  static createMockPage(url) {
    return { url };
  }

  /**
   * Create mock translations object
   */
  static createMockTranslations(keys) {
    const translations = {};
    
    keys.forEach(key => {
      const keyPath = key.split('.');
      let current = translations;
      
      for (let i = 0; i < keyPath.length - 1; i++) {
        if (!current[keyPath[i]]) {
          current[keyPath[i]] = {};
        }
        current = current[keyPath[i]];
      }
      
      const finalKey = keyPath[keyPath.length - 1];
      current[finalKey] = {};
      
      SUPPORTED_LOCALES.forEach(locale => {
        current[finalKey][locale] = `${key} in ${locale}`;
      });
    });
    
    return translations;
  }

  /**
   * Validate translation structure
   */
  static validateTranslationStructure(translations, requiredKeys) {
    const errors = [];
    
    requiredKeys.forEach(keyPath => {
      const keys = keyPath.split('.');
      let current = translations;
      
      try {
        for (const key of keys) {
          if (!current[key]) {
            errors.push(`Missing key: ${keyPath}`);
            return;
          }
          current = current[key];
        }
        
        SUPPORTED_LOCALES.forEach(locale => {
          if (!current[locale]) {
            errors.push(`Missing ${locale} translation for: ${keyPath}`);
          } else if (typeof current[locale] !== 'string' || current[locale].length === 0) {
            errors.push(`Invalid ${locale} translation for: ${keyPath}`);
          }
        });
      } catch (error) {
        errors.push(`Error validating ${keyPath}: ${error.message}`);
      }
    });
    
    return errors;
  }
}

/**
 * Common test data
 */
export const TEST_DATA = {
  BLOG_SLUGS: ['test-post', 'another-post', 'sample-article'],
  
  REQUIRED_TRANSLATION_KEYS: [
    'site.title',
    'site.motto',
    'home.title',
    'home.heading',
    'nav.about',
    'nav.acknowledgements',
    'nav.aiDisclaimer',
    'dictionary.title',
    'about.description',
    'acknowledgements.description',
    'aiDisclaimer.description'
  ],
  
  NAVIGATION_LINKS: [
    { name: 'home', index: 0 },
    { name: 'about', index: 1 },
    { name: 'acknowledgements', index: 2 },
    { name: 'ai-disclaimer', index: 3 },
    { name: 'dictionary', index: 4 }
  ]
};

/**
 * Performance testing helpers
 */
export class PerformanceHelpers {
  /**
   * Measure language switching time
   */
  static async measureLanguageSwitch(page, fromLocale, toLocale) {
    const startTime = Date.now();
    
    const helper = new LocalizationTestHelpers(page);
    await helper.switchLanguage(toLocale);
    await helper.verifyCurrentLanguage(toLocale);
    
    const endTime = Date.now();
    return endTime - startTime;
  }

  /**
   * Measure page load time
   */
  static async measurePageLoad(page, url) {
    const startTime = Date.now();
    await page.goto(url);
    await page.locator('main').waitFor();
    const endTime = Date.now();
    return endTime - startTime;
  }
}

export default {
  SUPPORTED_LOCALES,
  LOCALE_FLAGS,
  LOCALE_NAMES,
  UrlPatterns,
  PAGE_TYPES,
  LocalizationTestHelpers,
  UnitTestHelpers,
  TEST_DATA,
  PerformanceHelpers,
  generateLocaleTestCases,
  generateLocaleSwitchingTestCases
};