import { test, expect } from '@playwright/test';

const PAGE_URL = '/en-us/tools/diceware/';
const WORDLIST_URL = '/wordlists/eff_large_wordlist-v1.txt';

/**
 * Drive a Shoelace control whose value lives on the host element. We set the
 * property and dispatch sl-change (which the page listens for) so the auto-
 * regenerate wiring fires.
 */
async function setShoelaceValue(page, selector, value, { event = 'sl-change' } = {}) {
  await page.evaluate(
    ({ selector, value, event }) => {
      const el = document.querySelector(selector);
      el.value = value;
      el.dispatchEvent(new CustomEvent(event, { bubbles: true, composed: true }));
    },
    { selector, value, event }
  );
}

async function toggleShoelaceSwitch(page, selector, checked) {
  await page.evaluate(
    ({ selector, checked }) => {
      const el = document.querySelector(selector);
      el.checked = checked;
      el.dispatchEvent(new CustomEvent('sl-change', { bubbles: true, composed: true }));
    },
    { selector, checked }
  );
}

test.describe('Diceware passphrase generator', () => {
  test('loads, verifies integrity, enables generate, and draws an initial passphrase', async ({ page }) => {
    await page.goto(PAGE_URL);

    const status = page.locator('#diceware-status');
    await expect(status).toContainText('Wordlist loaded', { timeout: 10000 });
    await expect(status).toContainText('7776 words');
    await expect(status).toContainText('integrity verified');

    const genBtn = page.locator('#dw-generate');
    await expect(genBtn).not.toHaveAttribute('disabled', /.*/);

    const initial = (await page.locator('#dw-output').textContent()).trim();
    expect(initial.split('-')).toHaveLength(6);
  });

  test('Generated passphrase uses only words from the EFF list', async ({ page }) => {
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
    await expect(page.locator('#diceware-status')).toContainText('integrity verified', {
      timeout: 10000
    });

    // Use the manual regenerate button to re-draw a passphrase.
    await page.locator('#dw-generate').click();
    const output = (await page.locator('#dw-output').textContent()).trim();
    const parts = output.split('-');
    expect(parts).toHaveLength(6);
    for (const p of parts) {
      expect(words.has(p)).toBe(true);
    }
  });

  test('changing the slider auto-regenerates with the new word count', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#diceware-status')).toContainText('integrity verified', {
      timeout: 10000
    });

    const before = (await page.locator('#dw-output').textContent()).trim();
    await setShoelaceValue(page, '#dw-count', 9);

    const after = (await page.locator('#dw-output').textContent()).trim();
    expect(after).not.toBe(before);
    expect(after.split('-')).toHaveLength(9);
    await expect(page.locator('#dw-count-value')).toHaveText('9');
    await expect(page.locator('#dw-entropy-value')).toContainText('9 words');
  });

  test('changing the separator auto-regenerates with the new delimiter', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#diceware-status')).toContainText('integrity verified', {
      timeout: 10000
    });

    await setShoelaceValue(page, '#dw-separator', '.');
    const output = (await page.locator('#dw-output').textContent()).trim();
    expect(output.split('.')).toHaveLength(6);
    expect(output.includes('-')).toBe(false);
  });

  test('toggling capitalize auto-regenerates with capitalized words', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#diceware-status')).toContainText('integrity verified', {
      timeout: 10000
    });

    await toggleShoelaceSwitch(page, '#dw-capitalize', true);
    const output = (await page.locator('#dw-output').textContent()).trim();
    const parts = output.split('-');
    for (const p of parts) {
      expect(/^[A-Z][a-z0-9-]*$/.test(p)).toBe(true);
    }
  });

  test('copy button puts the current passphrase on the clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are chromium-only in this suite');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(PAGE_URL);
    await expect(page.locator('#diceware-status')).toContainText('integrity verified', {
      timeout: 10000
    });

    const phrase = (await page.locator('#dw-output').textContent()).trim();
    expect(phrase.length).toBeGreaterThan(0);

    // The sl-copy-button exposes its `value` via the host property. Assert
    // that it stays in sync with the output text; actually clicking it writes
    // that value via the Clipboard API.
    const copyValue = await page.evaluate(() => document.querySelector('#dw-copy').value);
    expect(copyValue).toBe(phrase);

    await page.locator('#dw-copy').click();
    // Shoelace writes via navigator.clipboard in the page context.
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(phrase);
  });

  test('second visit serves the wordlist from Cache Storage (no network fetch)', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#diceware-status')).toContainText('integrity verified', {
      timeout: 10000
    });

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
