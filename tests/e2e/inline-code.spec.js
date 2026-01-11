import { test, expect } from '@playwright/test';

test.describe('Inline Code Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Great Firewall article which has inline code
    await page.goto('/blog/en-us/great-firewall-wallbleed/');
  });

  test('inline code should have gray background in light theme', async ({ page }) => {
    // Ensure light theme
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });

    const inlineCode = page.locator('article code').filter({ hasNotText: /\n/ }).first();

    const bgColor = await inlineCode.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // gray-200 is rgb(229, 231, 235)
    expect(bgColor).toBe('rgb(229, 231, 235)');
  });

  test('inline code should have gray background in dark theme', async ({ page }) => {
    // Enable dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    const inlineCode = page.locator('article code').filter({ hasNotText: /\n/ }).first();

    const bgColor = await inlineCode.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // gray-800 is rgb(31, 41, 55)
    expect(bgColor).toBe('rgb(31, 41, 55)');
  });

  test('inline code should have border in light theme', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });

    const inlineCode = page.locator('article code').filter({ hasNotText: /\n/ }).first();

    const borderColor = await inlineCode.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // gray-300 is rgb(209, 213, 219)
    expect(borderColor).toBe('rgb(209, 213, 219)');
  });

  test('inline code should have border in dark theme', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    const inlineCode = page.locator('article code').filter({ hasNotText: /\n/ }).first();

    const borderColor = await inlineCode.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // gray-700 is rgb(55, 65, 81)
    expect(borderColor).toBe('rgb(55, 65, 81)');
  });

  test('inline code should NOT have decorative backticks', async ({ page }) => {
    const inlineCode = page.locator('article code').filter({ hasNotText: /\n/ }).first();

    const pseudoContent = await inlineCode.evaluate((el) => {
      const before = window.getComputedStyle(el, '::before').content;
      const after = window.getComputedStyle(el, '::after').content;
      return { before, after };
    });

    // Content should be 'none' or empty, not backticks
    expect(pseudoContent.before).toBe('none');
    expect(pseudoContent.after).toBe('none');
  });

  test('inline code should have normal font weight', async ({ page }) => {
    const inlineCode = page.locator('article code').filter({ hasNotText: /\n/ }).first();

    const fontWeight = await inlineCode.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });

    // 400 is normal weight
    expect(fontWeight).toBe('400');
  });

  test('inline code should have monospace font', async ({ page }) => {
    const inlineCode = page.locator('article code').filter({ hasNotText: /\n/ }).first();

    const fontFamily = await inlineCode.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });

    // Should include monospace font
    expect(fontFamily).toContain('monospace');
  });

  test('inline code should have rounded corners', async ({ page }) => {
    const inlineCode = page.locator('article code').filter({ hasNotText: /\n/ }).first();

    const borderRadius = await inlineCode.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });

    // Should have some border radius (not 0px)
    expect(borderRadius).not.toBe('0px');
  });

  test('code blocks should NOT have the same styling as inline code', async ({ page }) => {
    const inlineCode = page.locator('article p code').first();
    const blockCode = page.locator('article pre code').first();

    const inlineBg = await inlineCode.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const blockBg = await blockCode.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Block code should have different background than inline code
    expect(inlineBg).not.toBe(blockBg);
  });

  test('inline code text should be visible and readable', async ({ page }) => {
    const inlineCode = page.locator('article code').filter({ hasNotText: /\n/ }).first();

    // Should be visible
    await expect(inlineCode).toBeVisible();

    // Should have text content
    const textContent = await inlineCode.textContent();
    expect(textContent).toBeTruthy();
    expect(textContent.length).toBeGreaterThan(0);
  });
});
