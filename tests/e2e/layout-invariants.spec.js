import { test, expect } from '@playwright/test';
import { PAGES, VIEWPORTS } from './helpers/pages.js';
import { setTheme, settleTheme } from './helpers/theme.js';

/**
 * Layer 1 of the CSS-trim safety net: layout invariants.
 *
 * Asserts properties that should hold regardless of theme tokens or prose
 * styling. These checks survive env drift (no pixel comparisons) and produce
 * surgical failures that point at the actual offending element/property.
 *
 * Companion suites:
 *   - a11y-axe.spec.js         (Layer 2: color-contrast / target-size / reflow)
 *   - prose-contracts.spec.js  (Layer 3: hardcoded prose token assertions)
 *   - visual-regression.spec.js (xf3 pixel-diff backstop)
 */

// Selectors whose intrinsic content is allowed to overflow their box (decorative
// emoji glyphs, mermaid SVG content, etc.). Skip these in text-overflow checks.
const TEXT_OVERFLOW_EXCLUDE = [
  '.dictionary-emoji',
  '.flag',
  'svg',
  '.mermaid',
  'pre.mermaid',
];

function buildExcludeMatcher() {
  const sel = TEXT_OVERFLOW_EXCLUDE.join(',');
  return sel;
}

test.describe('Layout invariants', () => {
  for (const viewport of VIEWPORTS) {
    for (const pageDef of PAGES) {
      test(`no horizontal overflow | ${pageDef.name} | ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await setTheme(page, 'light');
        await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
        await settleTheme(page, 'light');
        await page.waitForLoadState('networkidle').catch(() => {});

        const result = await page.evaluate(() => {
          const de = document.documentElement;
          return {
            scrollWidth: de.scrollWidth,
            clientWidth: de.clientWidth,
          };
        });
        expect(
          result.scrollWidth,
          `documentElement.scrollWidth (${result.scrollWidth}) exceeds clientWidth (${result.clientWidth}) on ${pageDef.name} @ ${viewport.name} — horizontal overflow regression`
        ).toBeLessThanOrEqual(result.clientWidth);
      });

      test(`text fits in interactive controls | ${pageDef.name} | ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await setTheme(page, 'light');
        await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
        await settleTheme(page, 'light');
        await page.waitForLoadState('networkidle').catch(() => {});

        const excludeSel = buildExcludeMatcher();
        const offenders = await page.evaluate((excludeSel) => {
          const isVisible = (el) => {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };
          const elements = Array.from(document.querySelectorAll('button, a, .burger-nav-link'));
          const out = [];
          for (const el of elements) {
            if (!isVisible(el)) continue;
            if (excludeSel && el.matches(excludeSel)) continue;
            // Skip if any descendant is in the exclude list AND is the only meaningful child
            if (el.querySelector(excludeSel) && el.textContent.trim() === '') continue;
            // 1px tolerance for sub-pixel rounding
            if (el.scrollWidth > el.clientWidth + 1) {
              out.push({
                tag: el.tagName.toLowerCase(),
                cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : '',
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
                text: (el.textContent || '').trim().slice(0, 60),
              });
            }
          }
          return out;
        }, excludeSel);

        expect(
          offenders,
          `interactive elements with text overflow on ${pageDef.name} @ ${viewport.name}: ${JSON.stringify(offenders, null, 2)}`
        ).toEqual([]);
      });

      test(`no visible-but-zero-size nav links | ${pageDef.name} | ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await setTheme(page, 'light');
        await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
        await settleTheme(page, 'light');
        await page.waitForLoadState('networkidle').catch(() => {});

        // Open burger menu so its links become "visible" for layout purposes.
        await page.evaluate(() => {
          const overlay = document.getElementById('burger-overlay');
          const trigger = document.getElementById('burger-toggle');
          if (overlay && trigger) {
            overlay.classList.add('active');
            trigger.classList.add('active');
            trigger.setAttribute('aria-expanded', 'true');
          }
        });
        await page.waitForTimeout(50);

        const offenders = await page.evaluate(() => {
          const out = [];
          const links = Array.from(document.querySelectorAll('.burger-nav-link'));
          for (const a of links) {
            const cs = getComputedStyle(a);
            // Skip if explicitly hidden — those don't need to lay out.
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            const r = a.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) {
              out.push({
                href: a.getAttribute('href'),
                text: (a.textContent || '').trim().slice(0, 40),
                width: r.width,
                height: r.height,
                display: cs.display,
              });
            }
          }
          return out;
        });

        expect(
          offenders,
          `burger nav links are technically visible but render at zero size on ${pageDef.name} @ ${viewport.name}: ${JSON.stringify(offenders, null, 2)}`
        ).toEqual([]);
      });
    }

  }

  // Mobile tap-target check (WCAG 2.5.5) — only at 375px viewport.
  for (const pageDef of PAGES) {
    test(`mobile tap targets >= 44x44 | ${pageDef.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await setTheme(page, 'light');
      await page.goto(pageDef.url, { waitUntil: 'domcontentloaded' });
      await settleTheme(page, 'light');
      await page.waitForLoadState('networkidle').catch(() => {});

      const small = await page.evaluate(() => {
        const out = [];
        // Only check chrome interactive elements, not in-prose links (prose
        // links can legitimately wrap inline at any size).
        const sel = [
          'header button',
          'header a',
          'footer button',
          '.burger-nav-link',
          '#back-to-top',
        ].join(',');
        // Pre-existing under-sized chrome controls on `main` at the time this
        // suite was added. Excluded so the suite catches *new* regressions
        // (e.g. a trim shrinking the burger nav links). Tracked for follow-up.
        const KNOWN_SMALL_IDS = new Set(['burger-toggle', 'theme-toggle', 'language-toggle']);
        const isVisible = (el) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        for (const el of document.querySelectorAll(sel)) {
          if (!isVisible(el)) continue;
          if (el.id && KNOWN_SMALL_IDS.has(el.id)) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 44 || r.height < 44) {
            out.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 60) : '',
              w: Math.round(r.width),
              h: Math.round(r.height),
            });
          }
        }
        return out;
      });

      expect(
        small,
        `interactive elements smaller than 44x44 (WCAG 2.5.5) on ${pageDef.name} @ mobile: ${JSON.stringify(small, null, 2)}`
      ).toEqual([]);
    });
  }

  test('layout box-model spot checks: main / header / footer padding (mobile base)', async ({ page }) => {
    // Pin to the smallest viewport so no media-query overrides kick in. Larger
    // viewports rescale rem (html { text-xl }) which makes padding values
    // viewport-dependent and a poor regression signal.
    await page.setViewportSize({ width: 375, height: 800 });
    await setTheme(page, 'light');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await settleTheme(page, 'light');

    // raw-website.css base layer (mobile, <450px):
    //   header { @apply py-4 px-0 } -> 16px/0
    //   main, article { @apply py-3 px-0 } -> 12px/0
    //   footer { @apply py-6 px-0 } -> 24px/0
    const padding = await page.evaluate(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
          top: cs.paddingTop,
          right: cs.paddingRight,
          bottom: cs.paddingBottom,
          left: cs.paddingLeft,
        };
      };
      return {
        header: pick('header'),
        main: pick('main'),
        footer: pick('footer'),
      };
    });

    expect(padding.header, 'header padding').toEqual({
      top: '16px',
      right: '0px',
      bottom: '16px',
      left: '0px',
    });
    expect(padding.main, 'main padding').toEqual({
      top: '12px',
      right: '0px',
      bottom: '12px',
      left: '0px',
    });
    expect(padding.footer, 'footer padding').toEqual({
      top: '24px',
      right: '0px',
      bottom: '24px',
      left: '0px',
    });
  });

  test('z-index sanity: open burger overlay sits above main', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await setTheme(page, 'light');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await settleTheme(page, 'light');

    const z = await page.evaluate(() => {
      const overlay = document.getElementById('burger-overlay');
      const trigger = document.getElementById('burger-toggle');
      if (overlay && trigger) {
        overlay.classList.add('active');
        trigger.classList.add('active');
      }
      const parseZ = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const v = getComputedStyle(el).zIndex;
        return v === 'auto' ? 0 : parseInt(v, 10);
      };
      return {
        overlay: parseZ('.burger-overlay'),
        main: parseZ('main'),
      };
    });

    expect(z.overlay, 'burger overlay z-index missing').not.toBeNull();
    expect(z.main, 'main z-index missing').not.toBeNull();
    expect(
      z.overlay > z.main,
      `burger overlay z-index (${z.overlay}) must exceed main z-index (${z.main})`
    ).toBe(true);
  });
});
