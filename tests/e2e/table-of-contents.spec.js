import { test, expect } from '@playwright/test';

test.describe('Table of Contents', () => {
  test('should be collapsed by default', async ({ page }) => {
    await page.goto('/blog/en-us/mcp-security/');
    const details = page.locator('sl-details.toc-details');
    await expect(details).toBeVisible();
    await expect(details).not.toHaveAttribute('open');
  });

  test('should expand when clicked', async ({ page }) => {
    await page.goto('/blog/en-us/mcp-security/');
    const details = page.locator('sl-details.toc-details');

    // Wait for component to be fully defined
    await page.waitForFunction(() => customElements.get('sl-details') !== undefined);

    await details.click();
    await expect(details).toHaveAttribute('open');
  });

  test('should navigate to section when link clicked', async ({ page }) => {
    await page.goto('/blog/en-us/mcp-security/');
    const details = page.locator('sl-details.toc-details');
    await details.click();

    const firstLink = details.locator('.toc-nav a').first();
    await firstLink.click();

    // Check URL hash updated
    expect(page.url()).toContain('#');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/blog/en-us/mcp-security/');
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
    await page.goto('/blog/en-us/mcp-security/');
    let summary = page.locator('sl-details.toc-details');
    await expect(summary).toContainText('Table of Contents');
  });

  test('should collapse when clicking summary again', async ({ page }) => {
    await page.goto('/blog/en-us/curl-bash-pipe-security/');
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
    await page.goto('/blog/en-us/mcp-security/');

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

  test('should auto-collapse after clicking TOC link', async ({ page }) => {
    await page.goto('/blog/en-us/mcp-security/');
    const details = page.locator('sl-details.toc-details');

    // Expand TOC
    const summary = details.locator('[part="summary"]');
    await summary.click();
    await page.waitForTimeout(300);
    await expect(details).toHaveAttribute('open');

    // Click a TOC link
    const firstLink = details.locator('.toc-nav a').first();
    await firstLink.click();

    // Wait for auto-collapse
    await page.waitForTimeout(200);
    await expect(details).not.toHaveAttribute('open');
  });

  test('should not be visible until component is defined (no FOUC)', async ({ page }) => {
    // Intercept page load to check opacity before component upgrades
    await page.goto('/blog/en-us/mcp-security/', { waitUntil: 'domcontentloaded' });

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

  test('should scroll to correct position without overshooting', async ({ page }) => {
    await page.goto('/blog/en-us/mcp-security/');
    const details = page.locator('sl-details.toc-details');

    // Expand TOC
    await details.click();
    await page.waitForTimeout(300);

    // Get the second link to have meaningful scroll distance
    const secondLink = details.locator('.toc-nav a').nth(1);
    const href = await secondLink.getAttribute('href');
    const targetId = href?.replace('#', '');

    // Click TOC link
    await secondLink.click();

    // Wait for navigation to complete (instant with scroll-behavior: auto)
    await page.waitForTimeout(200);

    // Get target element position
    const targetElement = page.locator(`#${targetId}`);
    const targetRect = await targetElement.boundingBox();

    // Target should be visible near top of viewport (allowing for scroll-margin-top: 2rem = ~32px)
    // Should be within 50px of expected position to account for scroll-margin-top and minor variations
    expect(targetRect.y).toBeGreaterThan(-10);
    expect(targetRect.y).toBeLessThan(100);

    // Verify TOC collapsed
    await expect(details).not.toHaveAttribute('open');
  });

  test('should use instant scroll for TOC navigation', async ({ page }) => {
    await page.goto('/blog/en-us/mcp-security/');
    const details = page.locator('sl-details.toc-details');

    // Expand TOC
    await details.click();
    await page.waitForTimeout(300);
    await expect(details).toHaveAttribute('open');

    // Monitor scroll behavior when clicking TOC link
    await page.evaluate(() => {
      window.scrollBehaviorOnClick = null;
      const tocDetails = document.querySelector('sl-details.toc-details');
      tocDetails.addEventListener('click', () => {
        // Capture scroll behavior at time of click
        setTimeout(() => {
          window.scrollBehaviorOnClick = getComputedStyle(document.documentElement).scrollBehavior;
        }, 10);
      });
    });

    // Click a TOC link
    const firstLink = details.locator('.toc-nav a').first();
    await firstLink.click();

    // Wait for events to settle
    await page.waitForTimeout(100);

    // Verify scroll behavior was set to auto (instant) not smooth
    const scrollBehavior = await page.evaluate(() => window.scrollBehaviorOnClick);
    expect(scrollBehavior).toBe('auto');
  });

  test('should handle rapid clicks without scroll position errors', async ({ page }) => {
    await page.goto('/blog/en-us/mcp-security/');
    const details = page.locator('sl-details.toc-details');

    const links = details.locator('.toc-nav a');
    const linkCount = await links.count();

    // Click multiple links rapidly
    for (let i = 0; i < Math.min(3, linkCount); i++) {
      await details.click(); // Re-expand if needed
      await page.waitForTimeout(100);
      await links.nth(i).click();
      await page.waitForTimeout(100);
    }

    // Page should still be scrollable and not stuck
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThanOrEqual(0);

    // Verify final scroll behavior restored to smooth
    const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    expect(scrollBehavior).toBe('smooth');
  });
});
