import { test, expect } from '@playwright/test';

test.describe('Back to Top Button Functionality', () => {
  // Back-to-top button only appears on article/blog post pages
  const BLOG_POST_URL = '/blog/en-us/gru-kms-windows/';

  test.beforeEach(async ({ page }) => {
    await page.goto(BLOG_POST_URL);
  });

  test('back to top button is present in DOM', async ({ page }) => {
    const backToTopButton = page.locator('#back-to-top');

    // Button should exist
    await expect(backToTopButton).toBeAttached();

    // Check accessibility attributes
    await expect(backToTopButton).toHaveAttribute('aria-label', 'Back to top');

    // Button should be hidden initially (opacity: 0, pointer-events: none)
    await expect(backToTopButton).toHaveCSS('opacity', '0');
    await expect(backToTopButton).toHaveCSS('pointer-events', 'none');
  });

  test('button becomes visible when scrolled past threshold', async ({ page }) => {
    const backToTopButton = page.locator('#back-to-top');

    // Initially hidden
    await expect(backToTopButton).toHaveCSS('opacity', '0');
    await expect(backToTopButton).toHaveCSS('pointer-events', 'none');

    // Scroll past the threshold (300px)
    await page.evaluate(() => window.scrollTo(0, 350));

    // Wait for scroll event to be processed
    await page.waitForTimeout(100);

    // Button should now be visible
    await expect(backToTopButton).toHaveCSS('opacity', '1');
    await expect(backToTopButton).toHaveCSS('pointer-events', 'auto');
  });

  test('button becomes hidden when scrolled above threshold', async ({ page }) => {
    const backToTopButton = page.locator('#back-to-top');

    // First scroll past threshold to show button
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(100);

    // Verify button is visible
    await expect(backToTopButton).toHaveCSS('opacity', '1');

    // Scroll back above threshold
    await page.evaluate(() => window.scrollTo(0, 250));
    await page.waitForTimeout(100);

    // Button should be hidden again
    await expect(backToTopButton).toHaveCSS('opacity', '0');
    await expect(backToTopButton).toHaveCSS('pointer-events', 'none');
  });

  test('clicking button scrolls to top smoothly', async ({ page }) => {
    const backToTopButton = page.locator('#back-to-top');

    // Scroll down to make button visible
    await page.evaluate(() => window.scrollTo(0, 500));

    // Wait for button to become visible
    await page.waitForTimeout(100);
    await expect(backToTopButton).toHaveCSS('opacity', '1');

    // Click the back to top button
    await backToTopButton.click();

    // Wait for smooth scroll animation
    await page.waitForTimeout(500);

    // Should be back at the top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('button works with keyboard navigation', async ({ page }) => {
    const backToTopButton = page.locator('#back-to-top');

    // Scroll down to show button
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(100);

    // Button should be visible
    await expect(backToTopButton).toHaveCSS('opacity', '1');

    // Focus the button
    await backToTopButton.focus();
    await expect(backToTopButton).toBeFocused();

    // Activate with Enter key
    await page.keyboard.press('Enter');

    // Wait for smooth scroll
    await page.waitForTimeout(500);

    // Should be at top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('button maintains visibility state during rapid scrolling', async ({ page }) => {
    const backToTopButton = page.locator('#back-to-top');

    // Rapid scroll past threshold
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(50);
    await expect(backToTopButton).toHaveCSS('opacity', '1');

    // Rapid scroll back above threshold
    await page.evaluate(() => window.scrollTo(0, 250));
    await page.waitForTimeout(50);
    await expect(backToTopButton).toHaveCSS('opacity', '0');

    // Rapid scroll past threshold again
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(50);
    await expect(backToTopButton).toHaveCSS('opacity', '1');
  });

  test('button works on pages with different content heights', async ({ page }) => {
    // Test on a blog post (back-to-top only appears on article pages)
    await page.goto(BLOG_POST_URL);

    // Ensure page has some height
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    expect(pageHeight).toBeGreaterThan(300);

    // Scroll past threshold
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(100);

    const backToTopButton = page.locator('#back-to-top');
    await expect(backToTopButton).toHaveCSS('opacity', '1');

    // Test on another blog post with different content
    await page.goto('/blog/en-us/get-most-out-of-claude-code/');
    const otherPostHeight = await page.evaluate(() => document.body.scrollHeight);

    if (otherPostHeight > 500) { // Only test if page has substantial content
      await page.evaluate(() => window.scrollTo(0, 350));
      await page.waitForTimeout(100);

      const backToTopButtonOther = page.locator('#back-to-top');
      await expect(backToTopButtonOther).toHaveCSS('opacity', '1');
    }
  });

  test('button handles very large scroll distances', async ({ page }) => {
    const backToTopButton = page.locator('#back-to-top');

    // Scroll to a very large position
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(100);

    // Button should be visible
    await expect(backToTopButton).toHaveCSS('opacity', '1');

    // Click to scroll back to top
    await backToTopButton.click();
    await page.waitForTimeout(1000); // Give more time for smooth scroll

    // Should be close to the top (smooth scroll might not be pixel-perfect)
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(50); // Allow some tolerance for smooth scroll
  });

  test('button works correctly at threshold boundaries', async ({ page }) => {
    const backToTopButton = page.locator('#back-to-top');

    // Test exactly at threshold - 1px (should be hidden)
    await page.evaluate(() => window.scrollTo(0, 299));
    await page.waitForTimeout(100);
    await expect(backToTopButton).toHaveCSS('opacity', '0');

    // Test exactly at threshold (should be hidden)
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);
    await expect(backToTopButton).toHaveCSS('opacity', '0');

    // Test 1px past threshold (should be visible)
    await page.evaluate(() => window.scrollTo(0, 301));
    await page.waitForTimeout(100);
    await expect(backToTopButton).toHaveCSS('opacity', '1');
  });

  test('button maintains proper styling and positioning', async ({ page }) => {
    const backToTopButton = page.locator('#back-to-top');

    // Scroll to show button
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(100);

    // Check positioning (fixed, bottom-8, right-8)
    await expect(backToTopButton).toHaveCSS('position', 'fixed');
    await expect(backToTopButton).toHaveCSS('bottom', '40px'); // 2.5rem = 40px (adjusted for actual CSS)
    await expect(backToTopButton).toHaveCSS('right', '40px'); // 2.5rem = 40px (adjusted for actual CSS)

    // Check z-index is high enough
    const zIndex = await backToTopButton.evaluate(el => getComputedStyle(el).zIndex);
    expect(parseInt(zIndex)).toBeGreaterThan(10);

    // Check icon is present and visible
    const icon = backToTopButton.locator('.icon');
    await expect(icon).toBeVisible();
  });

  test('button does not activate on non-article pages', async ({ page }) => {
    // Navigate to homepage (not an article page)
    await page.goto('/');

    const backToTopButton = page.locator('#back-to-top');

    // Button element exists in DOM (rendered by footer)
    await expect(backToTopButton).toBeAttached();

    // Scroll past threshold
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(100);

    // Button should remain hidden (script doesn't activate on non-article pages)
    await expect(backToTopButton).toHaveCSS('opacity', '0');
  });

  test('button works across different viewport sizes', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    const backToTopButtonMobile = page.locator('#back-to-top');

    // Scroll on mobile
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(100);

    await expect(backToTopButtonMobile).toHaveCSS('opacity', '1');

    // Test on desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();

    const backToTopButtonDesktop = page.locator('#back-to-top');

    // Scroll on desktop
    await page.evaluate(() => window.scrollTo(0, 350));
    await page.waitForTimeout(100);

    await expect(backToTopButtonDesktop).toHaveCSS('opacity', '1');
  });
});