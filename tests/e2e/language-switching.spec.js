import { test, expect } from '@playwright/test';

test.describe('Language switcher', () => {
  test('navigates to the translated page when one exists', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    await page.click('language-selector');
    await page.click('[data-lang="el"]');
    await page.waitForURL('/blog/el/gru-kms-windows/');
  });

  test('round-trips en → el → en on a blog post without losing the slug', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    await page.click('language-selector');
    await page.click('[data-lang="el"]');
    await page.waitForURL('/blog/el/gru-kms-windows/');

    // On the Greek page, the en-us option must point at the English post,
    // and the el option must point at itself (not at post-not-translated).
    expect(await page.getAttribute('[data-lang="en-us"]', 'href')).toBe('/blog/en-us/gru-kms-windows/');
    expect(await page.getAttribute('[data-lang="el"]', 'href')).toBe('/blog/el/gru-kms-windows/');

    await page.click('language-selector');
    await page.click('[data-lang="en-us"]');
    await page.waitForURL('/blog/en-us/gru-kms-windows/');
  });

  test('points to post-not-translated when the locale has no translation', async ({ page }) => {
    await page.goto('/blog/en-us/dealing-with-rate-limits/');

    const trHref = await page.getAttribute('[data-lang="tr"]', 'href');
    expect(trHref).toBe('/tr/post-not-translated/');

    await page.click('language-selector');
    await page.click('[data-lang="tr"]');
    await page.waitForURL('/tr/post-not-translated/');
  });

  test('round-trips through post-not-translated back to the original post via the blog link', async ({ page }) => {
    await page.goto('/blog/en-us/dealing-with-rate-limits/');

    const enHrefBefore = await page.getAttribute('[data-lang="en-us"]', 'href');
    expect(enHrefBefore).toBe('/blog/en-us/dealing-with-rate-limits/');

    await page.click('language-selector');
    await page.click('[data-lang="tr"]');
    await page.waitForURL('/tr/post-not-translated/');

    const enHrefOnDeadEnd = await page.getAttribute('[data-lang="en-us"]', 'href');
    expect(enHrefOnDeadEnd).toBe('/en-us/post-not-translated/');
  });

  test('renders hreflang alternates in <head> for translated pages', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    const hreflangs = await page.$$eval(
      'link[rel="alternate"][hreflang]',
      els => els.map(el => el.getAttribute('hreflang'))
    );
    expect(hreflangs).toEqual(expect.arrayContaining(['en-us', 'el', 'tr', 'x-default']));
  });
});
