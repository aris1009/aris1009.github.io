import { test, expect } from '@playwright/test';
import { TOKENS } from './fixtures/style-tokens.js';
import { setTheme, settleTheme } from './helpers/theme.js';

/**
 * Layer 3 of the CSS-trim safety net: narrow computed-style contracts.
 *
 * Tests run against the gru-kms-windows post (guaranteed to exist per
 * CLAUDE.md). Each assertion targets a token a planned trim PR may touch,
 * so an intentional change shows up as a one-line edit to
 * tests/e2e/fixtures/style-tokens.js in the same PR.
 */

const POST = '/blog/en-us/gru-kms-windows/';

async function load(page, theme) {
  // Pin viewport: padding/font-size cascade is rem-scaled and rem changes at
  // 450 / 768 / 1280 / 1600 breakpoints. 1440 is comfortably inside the
  // 1280-1599 band where 1rem = 20px (html { text-xl }).
  await page.setViewportSize({ width: 1440, height: 900 });
  await setTheme(page, theme);
  await page.goto(POST, { waitUntil: 'domcontentloaded' });
  await settleTheme(page, theme);
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function injectLead(page) {
  // No markdown in the project produces a `.lead` element, but the prose-lead
  // styling contract still matters for the planned Trim A. Inject a synthetic
  // node so the rule path is exercised.
  await page.evaluate(() => {
    if (document.getElementById('probe-lead')) return;
    const article = document.querySelector('article');
    if (!article) return;
    const p = document.createElement('p');
    p.id = 'probe-lead';
    p.className = 'lead';
    p.textContent = 'Probe lead.';
    article.insertBefore(p, article.firstChild);
  });
}

function getStyle(page, selector, props) {
  return page.evaluate(
    ([sel, p]) => {
      const el = document.querySelector(sel);
      if (!el) return { _missing: true };
      const cs = getComputedStyle(el);
      const out = {};
      for (const k of p) out[k] = cs.getPropertyValue(k);
      return out;
    },
    [selector, props]
  );
}

test.describe('Prose contracts (narrow computed-style)', () => {
  for (const theme of ['light', 'dark']) {
    test(`html background-color + color | ${theme}`, async ({ page }) => {
      await load(page, theme);
      const s = await getStyle(page, 'html', ['background-color', 'color']);
      expect(s['background-color']).toBe(TOKENS.html[theme].backgroundColor);
      expect(s.color).toBe(TOKENS.html[theme].color);
    });

    test(`article p color | ${theme}`, async ({ page }) => {
      await load(page, theme);
      const s = await getStyle(page, 'article :where(p)', ['color']);
      expect(s.color).toBe(TOKENS.articleP[theme].color);
    });

    test(`article li color | ${theme}`, async ({ page }) => {
      await load(page, theme);
      const s = await getStyle(page, 'article :where(li)', ['color']);
      expect(s.color).toBe(TOKENS.articleLi[theme].color);
    });

    test(`article .lead color + font-weight | ${theme}`, async ({ page }) => {
      await load(page, theme);
      await injectLead(page);
      const s = await getStyle(page, 'article :where(.lead)', ['color', 'font-weight']);
      expect(s.color).toBe(TOKENS.articleLead[theme].color);
      expect(s['font-weight']).toBe(TOKENS.articleLead[theme].fontWeight);
    });

    test(`article a color | ${theme}`, async ({ page }) => {
      await load(page, theme);
      const s = await getStyle(page, 'article :where(a)', ['color']);
      expect(s.color).toBe(TOKENS.articleA[theme].color);
    });
  }

  test('article > p font-size (prose-lg base — Trim B will change this)', async ({ page }) => {
    await load(page, 'light');
    const s = await getStyle(page, 'article > p', ['font-size']);
    expect(s['font-size']).toBe(TOKENS.articleP.fontSize);
  });
});
