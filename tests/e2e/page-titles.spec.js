import { test, expect } from '@playwright/test';

/**
 * E2E tests for page titles to ensure they render correctly with i18n translations.
 * These tests verify that eleventyComputed properly evaluates i18n filters in frontmatter.
 */

test.describe('Page Titles - English', () => {
  test('About page has correct English title', async ({ page }) => {
    await page.goto('/en-us/about/');
    await expect(page).toHaveTitle(/About - Minute Engineering/);
  });

  test('Acknowledgements page has correct English title', async ({ page }) => {
    await page.goto('/en-us/acknowledgements/');
    await expect(page).toHaveTitle(/Acknowledgements - Minute Engineering/);
  });

  test('AI Disclaimer page has correct English title', async ({ page }) => {
    await page.goto('/en-us/ai-disclaimer/');
    await expect(page).toHaveTitle(/AI Disclaimer - Minute Engineering/);
  });

  test('AI Toolset page has correct English title', async ({ page }) => {
    await page.goto('/en-us/ai-toolset/');
    await expect(page).toHaveTitle(/AI Toolset - Minute Engineering/);
  });

  test('Dictionary page has correct English title', async ({ page }) => {
    await page.goto('/en-us/dictionary/');
    await expect(page).toHaveTitle(/Dictionary - Minute Engineering/);
  });

  test('404 page has correct English title', async ({ page }) => {
    await page.goto('/en-us/404.html');
    await expect(page).toHaveTitle(/Page Not Found - Minute Engineering/);
  });
});

test.describe('Page Titles - Greek', () => {
  test('About page has correct Greek title', async ({ page }) => {
    await page.goto('/el/about/');
    await expect(page).toHaveTitle(/Σχετικά - Minute Engineering/);
  });

  test('Acknowledgements page has correct Greek title', async ({ page }) => {
    await page.goto('/el/acknowledgements/');
    await expect(page).toHaveTitle(/Ευχαριστίες - Minute Engineering/);
  });

  test('AI Disclaimer page has correct Greek title', async ({ page }) => {
    await page.goto('/el/ai-disclaimer/');
    await expect(page).toHaveTitle(/Δήλωση για την Τ.Ν. - Minute Engineering/);
  });

  test('AI Toolset page has correct Greek title', async ({ page }) => {
    await page.goto('/el/ai-toolset/');
    await expect(page).toHaveTitle(/Εργαλεία Τ.Ν. - Minute Engineering/);
  });

  test('Dictionary page has correct Greek title', async ({ page }) => {
    await page.goto('/el/dictionary/');
    await expect(page).toHaveTitle(/Λεξικό - Minute Engineering/);
  });

  test('404 page has correct Greek title', async ({ page }) => {
    await page.goto('/el/404.html');
    await expect(page).toHaveTitle(/Η Σελίδα Δεν Βρέθηκε - Minute Engineering/);
  });
});

test.describe('Page Titles - Turkish', () => {
  test('About page has correct Turkish title', async ({ page }) => {
    await page.goto('/tr/about/');
    await expect(page).toHaveTitle(/Hakkında - Minute Engineering/);
  });

  test('Acknowledgements page has correct Turkish title', async ({ page }) => {
    await page.goto('/tr/acknowledgements/');
    await expect(page).toHaveTitle(/Teşekkürler - Minute Engineering/);
  });

  test('AI Disclaimer page has correct Turkish title', async ({ page }) => {
    await page.goto('/tr/ai-disclaimer/');
    await expect(page).toHaveTitle(/YZ Feragatnamesi - Minute Engineering/);
  });

  test('AI Toolset page has correct Turkish title', async ({ page }) => {
    await page.goto('/tr/ai-toolset/');
    await expect(page).toHaveTitle(/YZ Araç Seti - Minute Engineering/);
  });

  test('Dictionary page has correct Turkish title', async ({ page }) => {
    await page.goto('/tr/dictionary/');
    await expect(page).toHaveTitle(/Sözlük - Minute Engineering/);
  });

  test('404 page has correct Turkish title', async ({ page }) => {
    await page.goto('/tr/404.html');
    await expect(page).toHaveTitle(/Sayfa Bulunamadı - Minute Engineering/);
  });
});

test.describe('Page Titles - No Template Syntax', () => {
  test('Titles should not contain raw Nunjucks syntax', async ({ page }) => {
    const pages = [
      '/en-us/about/',
      '/en-us/acknowledgements/',
      '/en-us/dictionary/',
      '/el/about/',
      '/tr/about/',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      const title = await page.title();

      // Verify no raw template syntax
      expect(title).not.toContain('{{');
      expect(title).not.toContain('}}');
      expect(title).not.toContain('i18n');
      expect(title).not.toContain('nav.');
      expect(title).not.toContain('dictionary.');

      // Verify not empty (except for site name)
      expect(title).not.toBe(' - Minute Engineering ');
      expect(title).not.toBe('- Minute Engineering');
    }
  });
});
