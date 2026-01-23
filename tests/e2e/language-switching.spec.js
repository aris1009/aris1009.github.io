import { test, expect } from '@playwright/test';

/**
 * E2E tests for language switching bug fix
 * Bug: User reads EN blog → switches to TR (unavailable) → sees "not available"
 * → switches back to EN → incorrectly sees "not available" in EN instead of original blog
 */

test.describe('Language Switching - Translation Not Available Bug', () => {
  test('should restore original blog when switching back from unavailable language', async ({ page }) => {
    // 1. Visit English-only blog post (not available in Turkish)
    await page.goto('/blog/en-us/dealing-with-rate-limits/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/dealing-with-rate-limits/);

    // 2. Wait for deferred scripts to load and component to initialize
    await page.waitForTimeout(500);

    // 3. Verify sessionStorage tracks the blog slug
    const storedSlug = await page.evaluate(() => sessionStorage.getItem('lastViewedBlogSlug'));
    expect(storedSlug).toBe('dealing-with-rate-limits');

    // 4. Open language selector and switch to Turkish (post not available in Turkish)
    await page.click('language-selector');
    await page.click('[data-lang="tr"]');

    // 5. Verify redirect to "post-not-translated" page
    await page.waitForURL('/tr/post-not-translated/');

    // 6. Verify sessionStorage still has the original slug
    const slugAfterRedirect = await page.evaluate(() => sessionStorage.getItem('lastViewedBlogSlug'));
    expect(slugAfterRedirect).toBe('dealing-with-rate-limits');

    // 7. Switch back to English
    await page.click('language-selector');
    await page.click('[data-lang="en-us"]');

    // 8. Verify we're back to the original blog post (NOT the "not available" page)
    await page.waitForURL('/blog/en-us/dealing-with-rate-limits/');
    await expect(page).toHaveURL(/dealing-with-rate-limits/);
  });

  test('should update sessionStorage when viewing different blog posts', async ({ page }) => {
    // 1. Visit first blog post
    await page.goto('/blog/en-us/gru-kms-windows/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    let storedSlug = await page.evaluate(() => sessionStorage.getItem('lastViewedBlogSlug'));
    expect(storedSlug).toBe('gru-kms-windows');

    // 2. Visit second blog post
    await page.goto('/blog/en-us/dealing-with-rate-limits/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 3. Verify sessionStorage updated
    storedSlug = await page.evaluate(() => sessionStorage.getItem('lastViewedBlogSlug'));
    expect(storedSlug).toBe('dealing-with-rate-limits');
  });

  test('should stay on not-available page if manually visited with no sessionStorage', async ({ page }) => {
    // 1. Clear sessionStorage
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());

    // 2. Manually visit Turkish "not available" page
    await page.goto('/tr/post-not-translated/');

    // 3. Switch to English
    await page.click('language-selector');
    await page.click('[data-lang="en-us"]');

    // 4. Should go to English "not available" page (no blog context to restore)
    await page.waitForURL('/en-us/post-not-translated/');
    await expect(page.locator('h1')).toContainText(/not.*available/i);
  });

  test('should work with Greek language switching', async ({ page }) => {
    // 1. Visit English blog (exists in Greek too)
    await page.goto('/blog/en-us/gru-kms-windows/');

    // 2. Switch to Greek (post exists in Greek)
    await page.click('language-selector');
    await page.click('[data-lang="el"]');

    // 3. Should navigate to Greek version successfully
    await page.waitForURL('/blog/el/gru-kms-windows/');
    await expect(page).toHaveURL(/gru-kms-windows/);

    // 4. Verify sessionStorage updated
    const storedSlug = await page.evaluate(() => sessionStorage.getItem('lastViewedBlogSlug'));
    expect(storedSlug).toBe('gru-kms-windows');
  });

  test('should preserve most recent blog when switching multiple times', async ({ page }) => {
    // 1. Visit English-only blog post
    await page.goto('/blog/en-us/dealing-with-rate-limits/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    let slug = await page.evaluate(() => sessionStorage.getItem('lastViewedBlogSlug'));
    expect(slug).toBe('dealing-with-rate-limits');

    // 2. Switch to unavailable language
    await page.click('language-selector');
    await page.click('[data-lang="tr"]');
    await page.waitForURL('/tr/post-not-translated/');

    // 3. Go back to homepage
    await page.goto('/');

    // 4. Visit same blog again (update sessionStorage)
    await page.goto('/blog/en-us/dealing-with-rate-limits/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 5. Switch to unavailable again
    await page.click('language-selector');
    await page.click('[data-lang="tr"]');
    await page.waitForURL('/tr/post-not-translated/');

    // 6. Switch back to English - should restore blog
    await page.click('language-selector');
    await page.click('[data-lang="en-us"]');
    await page.waitForURL('/blog/en-us/dealing-with-rate-limits/');
    await expect(page).toHaveURL(/dealing-with-rate-limits/);
  });
});
