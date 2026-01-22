import { test, expect } from '@playwright/test';

test.describe('Header Anchors', () => {
  test('anchor links appear on h2 headers', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    const h2 = page.locator('article h2').first();
    await h2.hover();

    const anchor = h2.locator('.header-anchor');
    await expect(anchor).toBeVisible();
  });

  test('clicking anchor updates URL with hash', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    const h2 = page.locator('article h2').first();
    const headingId = await h2.getAttribute('id');

    const anchor = h2.locator('.header-anchor');
    await anchor.click();

    expect(page.url()).toContain(`#${headingId}`);
  });

  test('anchor links have proper accessibility', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    const anchor = page.locator('.header-anchor').first();

    await expect(anchor).toHaveAttribute('aria-label');
  });

  test('anchors work in dark mode', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    const h2 = page.locator('article h2').first();
    await h2.hover();
    const anchor = h2.locator('.header-anchor');

    await expect(anchor).toBeVisible();
  });
});
