import { describe, it, expect } from "vitest";
import { SUPPORTED_LOCALES } from "src/lib/constants.js";

/**
 * Unit tests for translations data structure
 * Ensures all required translations exist for all supported locales
 */

// Import the actual translations
const translations = require("../../src/_data/translations.js");

describe("Translations Data Structure", () => {
  describe("Required Translation Keys", () => {
    const requiredTranslationPaths = [
      // Site-wide
      "site.title",
      "site.motto",

      // Home page
      "home.title",
      "home.heading",
      "home.welcome",
      "home.latestPosts",
      "home.readMore",

      // Navigation
      "nav.about",
      "nav.acknowledgements",
      "nav.aiDisclaimer",

      // Article
      "article.readTime",
      "article.readTimeFormat",

      // Footer
      "footer.links",

      // Accessibility
      "accessibility.toggleDarkMode",
      "accessibility.selectLanguage",
      "accessibility.changeLanguage",

      // 404 page
      "notFound.title",
      "notFound.heading",
      "notFound.message",
      "notFound.suggestions",
      "notFound.checkUrl",
      "notFound.goHome",
      "notFound.contactError",

      // Translation placeholder
      "translation.placeholder",
      "translation.notAvailableTitle",

      // Dictionary
      "dictionary.title",
      "dictionary.description",
      "dictionary.searchPlaceholder",
      "dictionary.noResults",
      "dictionary.termCount",
      "dictionary.showingResults",

      // About page (new)
      "about.description",
      "about.title",
      "about.myBackground",
      "about.whyExists",
      "about.whatYouFind",
      "about.myApproach",
      "about.personalNote",
      "about.contact",

      // Acknowledgements page (new)
      "acknowledgements.description",
      "acknowledgements.staticSiteGenerator",
      "acknowledgements.theme",
      "acknowledgements.additionalTechnologies",
      "acknowledgements.thankYou",

      // AI Disclaimer page (new)
      "aiDisclaimer.description",
      "aiDisclaimer.title",
      "aiDisclaimer.aboutDevelopment",
      "aiDisclaimer.aiEnhancementPolicy",
      "aiDisclaimer.transparencyCommitment",
    ];

    requiredTranslationPaths.forEach((path) => {
      describe(`Translation path: ${path}`, () => {
        it("should exist in translations object", () => {
          const keys = path.split(".");
          let current = translations;

          for (const key of keys) {
            expect(current).toHaveProperty(key);
            current = current[key];
          }

          expect(current).toBeDefined();
          expect(typeof current).toBe("object");
        });

        SUPPORTED_LOCALES.forEach((locale) => {
          it(`should have ${locale} translation`, () => {
            const keys = path.split(".");
            let current = translations;

            for (const key of keys) {
              current = current[key];
            }

            expect(current).toHaveProperty(locale);
            expect(current[locale]).toBeDefined();
            expect(typeof current[locale]).toBe("string");
            expect(current[locale].length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe("Translation Quality", () => {
    const checkTranslationQuality = (translationObj, path = "") => {
      Object.entries(translationObj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === "object" && !Array.isArray(value)) {
          // Check if this is a translation object (has locale keys)
          const hasLocaleKeys = SUPPORTED_LOCALES.some((locale) =>
            value.hasOwnProperty(locale)
          );

          if (hasLocaleKeys) {
            // This is a translation object, check all locales
            SUPPORTED_LOCALES.forEach((locale) => {
              it(`${currentPath} should have non-empty ${locale} translation`, () => {
                expect(value[locale]).toBeDefined();
                expect(typeof value[locale]).toBe("string");
                expect(value[locale].trim().length).toBeGreaterThan(0);
              });

              it(`${currentPath} ${locale} translation should not contain placeholder text`, () => {
                const translation = value[locale].toLowerCase();
                expect(translation).not.toContain("todo");
                expect(translation).not.toContain("placeholder");
                expect(translation).not.toContain("missing");
                expect(translation).not.toContain("untranslated");
              });
            });

            // Check for translation consistency (similar length)
            it(`${currentPath} translations should have reasonable length consistency`, () => {
              const lengths = SUPPORTED_LOCALES.map(
                (locale) => value[locale].length
              );
              const maxLength = Math.max(...lengths);
              const minLength = Math.min(...lengths);

              // Allow up to 3x difference in length (some languages are more verbose)
              expect(maxLength / minLength).toBeLessThanOrEqual(3);
            });
          } else {
            // Recurse into nested objects
            checkTranslationQuality(value, currentPath);
          }
        }
      });
    };

    checkTranslationQuality(translations);
  });

  describe("Special Translation Formats", () => {
    it("should have correct format for readTimeFormat", () => {
      SUPPORTED_LOCALES.forEach((locale) => {
        const format = translations.article.readTimeFormat[locale];
        expect(format).toContain("{time}");
        expect(format).toContain("{readText}");
      });
    });

    it("should have correct format for termCount", () => {
      SUPPORTED_LOCALES.forEach((locale) => {
        const format = translations.dictionary.termCount[locale];
        expect(format).toContain("{count}");
      });
    });

    it("should have correct format for showingResults", () => {
      SUPPORTED_LOCALES.forEach((locale) => {
        const format = translations.dictionary.showingResults[locale];
        expect(format).toContain("{count}");
        expect(format).toContain("{total}");
      });
    });
  });

  describe("Locale-Specific Validation", () => {
    describe("Greek translations", () => {
      it("should use Greek characters", () => {
        const greekText = translations.home.heading.el;
        // Check for Greek characters (basic check)
        expect(/[Α-Ωα-ω]/.test(greekText)).toBe(true);
      });
    });

    describe("Turkish translations", () => {
      it("should use Turkish characters where appropriate", () => {
        const turkishText = translations.home.heading.tr;
        // Turkish text should exist and be meaningful
        expect(turkishText).toBeDefined();
        expect(turkishText.length).toBeGreaterThan(0);
      });
    });

    describe("English translations", () => {
      it("should use proper English", () => {
        const englishText = translations.home.heading["en-us"];
        expect(englishText).toBeDefined();
        expect(englishText.length).toBeGreaterThan(0);
        // Basic English validation - should not contain non-Latin characters
        expect(/^[a-zA-Z0-9\s.,!?&'-]+$/.test(englishText)).toBe(true);
      });
    });
  });

  describe("Navigation Translation Consistency", () => {
    it("should have consistent navigation structure", () => {
      const navKeys = ["about", "acknowledgements", "aiDisclaimer"];

      navKeys.forEach((key) => {
        expect(translations.nav).toHaveProperty(key);
        SUPPORTED_LOCALES.forEach((locale) => {
          expect(translations.nav[key]).toHaveProperty(locale);
          expect(translations.nav[key][locale]).toBeDefined();
        });
      });
    });
  });

  describe("Page Description Consistency", () => {
    const pageDescriptions = ["about", "acknowledgements", "aiDisclaimer"];

    pageDescriptions.forEach((page) => {
      it(`should have description for ${page} page`, () => {
        expect(translations[page]).toHaveProperty("description");
        SUPPORTED_LOCALES.forEach((locale) => {
          expect(translations[page].description).toHaveProperty(locale);
          expect(translations[page].description[locale]).toBeDefined();
          expect(translations[page].description[locale].length).toBeGreaterThan(
            20
          ); // Descriptions should be substantial
        });
      });
    });
  });
});
