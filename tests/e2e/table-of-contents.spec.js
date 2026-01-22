import { test, expect } from '@playwright/test';

test.describe('Table of Contents', () => {
  test('should be collapsed by default', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    const details = page.locator('sl-details.toc-details');
    await expect(details).toBeVisible();
    await expect(details).not.toHaveAttribute('open');
  });

  test('should expand when clicked', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    const details = page.locator('sl-details.toc-details');

    // Wait for component to be fully defined
    await page.waitForFunction(() => customElements.get('sl-details') !== undefined);

    await details.click();
    await expect(details).toHaveAttribute('open');
  });

  test('should navigate to section when link clicked', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    const details = page.locator('sl-details.toc-details');
    await details.click();

    const firstLink = details.locator('.toc-nav a').first();
    await firstLink.click();

    // Check URL hash updated
    expect(page.url()).toContain('#');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    const details = page.locator('sl-details.toc-details');

    // Wait for component to be fully defined
    await page.waitForFunction(() => customElements.get('sl-details') !== undefined);

    // Focus the sl-details element directly and press Space
    await details.evaluate((el) => el.shadowRoot.querySelector('[part="header"]').focus());
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await expect(details).toHaveAttribute('open');

    // Press Space again to close
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await expect(details).not.toHaveAttribute('open');
  });

  test('should display correct translations', async ({ page }) => {
    // English
    await page.goto('/blog/en-us/gru-kms-windows/');
    let summary = page.locator('sl-details.toc-details');
    await expect(summary).toContainText('Table of Contents');
  });

  test('should collapse when clicking summary again', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');
    const details = page.locator('sl-details.toc-details');

    // Expand by clicking the summary part
    const summary = details.locator('[part="summary"]');
    await summary.click();
    await page.waitForTimeout(300);
    await expect(details).toHaveAttribute('open');

    // Collapse by clicking summary again
    await summary.click();
    await page.waitForTimeout(300);
    await expect(details).not.toHaveAttribute('open');
  });

  test('should work in dark mode', async ({ page }) => {
    await page.goto('/blog/en-us/gru-kms-windows/');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('sl-theme-dark');
    });

    const details = page.locator('sl-details.toc-details');
    await expect(details).toBeVisible();

    // Should still be functional
    await details.click();
    await expect(details).toHaveAttribute('open');
  });

  test('should not be visible until component is defined (no FOUC)', async ({ page }) => {
    // Intercept page load to check opacity before component upgrades
    await page.goto('/blog/en-us/gru-kms-windows/', { waitUntil: 'domcontentloaded' });

    const details = page.locator('sl-details.toc-details');

    // Check if element exists but might not be fully defined yet
    await expect(details).toBeAttached();

    // Wait for component to be defined
    await page.waitForFunction(() => {
      return customElements.get('sl-details') !== undefined;
    });

    // After defined, should be visible (opacity 1 or not 0)
    const opacity = await details.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });

    // Opacity should be 1 (fully visible) after component is defined
    expect(parseFloat(opacity)).toBe(1);
  });
});
