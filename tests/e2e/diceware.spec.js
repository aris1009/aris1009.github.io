import { test, expect } from '@playwright/test';

const PAGE_URL = '/en-us/tools/diceware/';
const WORDLIST_URL = '/wordlists/eff_large_wordlist-v1.txt';

test.describe('Diceware passphrase generator', () => {
  test('loads, verifies integrity, and enables generation', async ({ page }) => {
    await page.goto(PAGE_URL);

    const status = page.locator('#diceware-status');
    await expect(status).toContainText('Wordlist loaded', { timeout: 10000 });
    await expect(status).toContainText('7776 words');
    await expect(status).toContainText('integrity verified');

    await expect(page.locator('#dw-generate')).toBeEnabled();
  });

  test('Generate produces exactly N words, all from the EFF list', async ({ page }) => {
    // Fetch the wordlist once to validate membership.
    const res = await page.request.get(WORDLIST_URL);
    expect(res.ok()).toBe(true);
    const words = new Set(
      (await res.text())
        .split('\n')
        .filter((l) => l.length > 0)
        .map((l) => l.split('\t')[1])
    );
    expect(words.size).toBe(7776);

    await page.goto(PAGE_URL);
    await expect(page.locator('#dw-generate')).toBeEnabled();

    await page.locator('#dw-count').fill('7');
    await page.locator('#dw-separator').selectOption('-');
    await page.locator('#dw-generate').click();

    const output = (await page.locator('#dw-output').textContent()).trim();
    const parts = output.split('-');
    expect(parts).toHaveLength(7);
    for (const p of parts) {
      expect(words.has(p)).toBe(true);
    }
  });

  test('Changing controls updates the next generation', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#dw-generate')).toBeEnabled();

    await page.locator('#dw-count').fill('4');
    await page.locator('#dw-separator').selectOption('.');
    await page.locator('#dw-capitalize').check();
    await page.locator('#dw-generate').click();

    const output = (await page.locator('#dw-output').textContent()).trim();
    const parts = output.split('.');
    expect(parts).toHaveLength(4);
    for (const p of parts) {
      expect(p[0]).toBe(p[0].toUpperCase());
      expect(/^[A-Z][a-z0-9-]*$/.test(p)).toBe(true);
    }

    await expect(page.locator('#dw-entropy-value')).toContainText('4 words');
  });

  test('Copy button writes the passphrase to clipboard', async ({ page, context, browserName }) => {
    // Clipboard permissions are a Chromium thing.
    test.skip(browserName !== 'chromium', 'clipboard API permissions are chromium-only in this suite');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(PAGE_URL);
    await expect(page.locator('#dw-generate')).toBeEnabled();
    await page.locator('#dw-generate').click();
    const output = (await page.locator('#dw-output').textContent()).trim();
    expect(output.length).toBeGreaterThan(0);

    await page.locator('#dw-copy').click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(output);
  });

  test('Second visit serves wordlist from Cache Storage (no network fetch)', async ({ page }) => {
    // First visit: warm the cache.
    await page.goto(PAGE_URL);
    await expect(page.locator('#diceware-status')).toContainText('integrity verified', {
      timeout: 10000
    });

    // Second visit: count wordlist requests.
    const requests = [];
    page.on('request', (req) => {
      if (req.url().endsWith(WORDLIST_URL)) requests.push(req.url());
    });

    await page.goto(PAGE_URL);
    await expect(page.locator('#diceware-status')).toContainText('integrity verified', {
      timeout: 10000
    });

    expect(requests).toHaveLength(0);
  });
});
