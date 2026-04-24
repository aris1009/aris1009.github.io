import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGES } from './helpers/pages.js';
import { setTheme, settleTheme } from './helpers/theme.js';

/**
 * Layer 2 of the CSS-trim safety net: axe-core a11y rules.
 *
 * Limited intentionally to rules that catch CSS regressions:
 *   - color-contrast        (WCAG 1.4.3) — gives us color-token contract
 *                            checking 'for free' across all themed surfaces
 *   - target-size           (WCAG 2.5.5/2.5.8) — interactive sizing
 *
 * Reflow (WCAG 1.4.10) doesn't have a stable axe rule id — Layer 1's
 * horizontal-overflow check at 320/375px already enforces it.
 *
 * We disable other axe rules to keep this suite focused on visual contracts;
 * broader semantic a11y can be a follow-up bead.
 */

const RULES = ['color-contrast', 'target-size'];
const THEMES = ['light', 'dark'];

/**
 * Selectors to exclude per (page, theme). These are KNOWN pre-existing
 * violations on `main` at the time this suite was added; the trim PRs are
 * scoped to typography, NOT to these chrome/content elements, so excluding
 * them here keeps the suite focused on regressions the trims could cause.
 *
 * Each entry is a list of CSS selectors handed to AxeBuilder.exclude(...).
 * Tracked separately for follow-up beads:
 *   - dark home: archive list `time` + .text-blue-600 read-more links
 *     have insufficient contrast against the dark background.
 *   - light blog posts: .external-link / .internal-link `.link-text`
 *     uses sky-700 which falls just under 4.5:1 on the light background.
 */
const EXCLUDE_BY_KEY = {
  'home|dark': ['time', '.text-blue-600.font-medium', '.text-blue-600.hover\\:text-blue-800'],
  'blog-post-prose|light': ['.external-link .link-text', '.internal-link .link-text'],
  'blog-post-toc-mermaid|light': ['.external-link .link-text', '.internal-link .link-text'],
};

test.describe('A11y (axe-core, CSS-relevant rules)', () => {
  for (const theme of THEMES) {
    for (const pageDef of PAGES) {
      test(`axe ${RULES.join('+')} | ${pageDef.name} | ${theme}`, async ({ page }) => {
        // target-size rule is viewport-sensitive; pick a desktop viewport so we
        // don't double-fail on mobile-only sizing decisions Layer 1 already
        // covers more surgically.
        await page.setViewportSize({ width: 1440, height: 900 });
        await setTheme(page, theme);
        await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
        await settleTheme(page, theme);
        await page.waitForLoadState('networkidle').catch(() => {});

        let builder = new AxeBuilder({ page }).withRules(RULES);
        const excludes = EXCLUDE_BY_KEY[`${pageDef.name}|${theme}`] || [];
        for (const sel of excludes) {
          builder = builder.exclude(sel);
        }
        const results = await builder.analyze();

        if (results.violations.length) {
          // Render a compact, surgical message — one line per violating node so
          // the failing CSS rule is obvious in CI output.
          const lines = [];
          for (const v of results.violations) {
            for (const node of v.nodes) {
              lines.push(`[${v.id}] ${node.target.join(' ')} :: ${node.failureSummary?.split('\n').join(' | ')}`);
            }
          }
          expect.soft(lines, `axe violations on ${pageDef.name} (${theme})`).toEqual([]);
        }
        expect(results.violations).toEqual([]);
      });
    }
  }
});
