import { test, expect } from '@playwright/test';
import { setTheme, settleTheme } from './helpers/theme.js';

/**
 * Theming contract: prevents the "white-on-white / dark-on-dark" class of
 * regression for theme-sensitive UI components.
 *
 * The bug we keep tripping on: a CSS change (purge config, Shoelace token
 * collision, missing `dark:` variant, CSP blocking an icon fetch, …) leaves
 * a component visually invisible — same colour as its background — in one
 * theme but not the other. Per-component unit tests miss this because they
 * inspect computed styles, not pixels; visual-regression catches it but
 * only after a baseline update reveals the diff.
 *
 * This suite asserts a hard pixel contrast contract: for every listed
 * component, in both light and dark mode, the rendered foreground (icon /
 * glyph / text) must be visually distinguishable from the background.
 *
 * The approach is deliberately mechanical: take a tight screenshot of the
 * component, decode the PNG, compute mean luminance over the foreground
 * region and over the surrounding background region, and require a minimum
 * delta. This works through shadow DOM (Shoelace icons), through SVG
 * `currentColor`, and even when the component fails to load at all
 * (luminance delta collapses to ~0 → test fails loudly).
 *
 * To add a component: append one entry to THEMED_COMPONENTS. No fixtures,
 * no baselines, no per-component setup.
 */

// Per-pixel luminance delta that counts a pixel as "different from background".
// 0.15 is comfortably above antialiasing fringe noise but well below the
// difference between any sane foreground and its background.
const PIXEL_LUMINANCE_DELTA = 0.15;
// Minimum fraction of inner-region pixels that must differ from background by
// PIXEL_LUMINANCE_DELTA. Icon buttons consist of a small glyph on a mostly
// empty button face, so requiring 100% would always fail; 1.5% reliably catches
// "icon entirely missing" without false-positiving on antialiased edges.
const MIN_DIFFERENT_PIXEL_FRACTION = 0.015;

const THEMED_COMPONENTS = [
  // Diceware — the regression that triggered this suite.
  {
    page: '/en-us/tools/diceware/',
    selector: 'sl-icon-button[data-testid="dw-generate"]',
    label: 'diceware regenerate icon-button',
    waitFor: 'sl-icon-button[data-testid="dw-generate"]',
  },
  {
    page: '/en-us/tools/diceware/',
    selector: 'sl-copy-button[data-testid="dw-copy"]',
    label: 'diceware copy-button',
    waitFor: 'sl-copy-button[data-testid="dw-copy"]',
  },
  // Code-block copy buttons (added by src/_static/js/code-copy-buttons.js).
  // gru-kms-windows has no <pre> blocks, so use curl-bash-pipe-security which
  // has 11. Keep this anchored to a post that's guaranteed to ship in CI
  // (oldest committed posts only — same rule as docs/testing.md).
  {
    page: '/blog/en-us/curl-bash-pipe-security/',
    selector: '[data-testid="code-copy-button"]',
    label: 'code-block copy-button',
    waitFor: '[data-testid="code-copy-button"]',
  },
  // Header theme toggle — most-touched theme-sensitive widget on the site.
  {
    page: '/',
    selector: '#theme-toggle',
    label: 'header theme toggle button',
    waitFor: '#theme-toggle',
  },
  // Prose links inside an article (sky-800 in light, sky-300 in dark per PR #144).
  {
    page: '/blog/en-us/gru-kms-windows/',
    selector: 'article .external-link .link-text, article .internal-link .link-text',
    label: 'prose link text',
    waitFor: 'article .external-link, article .internal-link',
  },
  // Dictionary trigger inside prose.
  {
    page: '/blog/en-us/gru-kms-windows/',
    selector: '[data-testid^="dictionary-link-"]',
    label: 'dictionary link trigger',
    waitFor: '[data-testid^="dictionary-link-"]',
  },
];

const THEMES = /** @type {const} */ (['light', 'dark']);

const linearize = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function relativeLuminance(r, g, b) {
  return 0.2126 * linearize(r / 255) + 0.7152 * linearize(g / 255) + 0.0722 * linearize(b / 255);
}

/**
 * Compute mean relative luminance over a region of an RGBA buffer.
 * Uses the WCAG relative-luminance formula (sRGB → linear → weighted sum).
 */
function meanLuminance(rgba, width, x0, y0, x1, y1) {
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      if (rgba[i + 3] === 0) continue;
      sum += relativeLuminance(rgba[i], rgba[i + 1], rgba[i + 2]);
      count++;
    }
  }
  return count === 0 ? null : sum / count;
}

/**
 * Fraction of inner-region pixels whose luminance differs from `bgL` by at
 * least `delta`. Robust to icons that occupy a small fraction of the bbox:
 * an entirely missing/invisible glyph yields ~0 differing pixels; a visible
 * glyph yields enough to clear MIN_DIFFERENT_PIXEL_FRACTION.
 */
function fractionDifferingFromBg(rgba, width, x0, y0, x1, y1, bgL, delta) {
  let differing = 0;
  let total = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      if (rgba[i + 3] === 0) continue;
      const L = relativeLuminance(rgba[i], rgba[i + 1], rgba[i + 2]);
      if (Math.abs(L - bgL) >= delta) differing++;
      total++;
    }
  }
  return total === 0 ? 0 : differing / total;
}

/**
 * Decode a PNG buffer to {width, height, rgba}. Uses the upng-js shipped with
 * Playwright's snapshotter when available, else falls back to canvas-less
 * pure-JS via pngjs.
 */
async function decodePng(buffer) {
  // pngjs is already a transitive dep via several testing tools; if it's
  // missing we throw a clear error rather than silently passing.
  const { PNG } = await import('pngjs');
  return new Promise((resolve, reject) => {
    new PNG().parse(buffer, (err, data) => {
      if (err) return reject(err);
      resolve({ width: data.width, height: data.height, rgba: data.data });
    });
  });
}

/**
 * Take a screenshot of `el` plus a margin around it, then compute:
 *   - fgL: mean luminance of the inner (component) region
 *   - bgL: mean luminance of the outer (margin) region
 * Returns { fgL, bgL, delta }.
 */
async function measureContrast(page, locator) {
  // Bring the element into the viewport — Playwright's `screenshot` with
  // `clip` requires the clipped area to fall inside the rendered image.
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('measureContrast: element has no bounding box');
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  const margin = Math.max(8, Math.round(Math.min(box.width, box.height) * 0.4));
  const x = Math.max(0, Math.floor(box.x - margin));
  const y = Math.max(0, Math.floor(box.y - margin));
  const clip = {
    x,
    y,
    width: Math.min(viewport.width - x, Math.ceil(box.width + margin * 2)),
    height: Math.min(viewport.height - y, Math.ceil(box.height + margin * 2)),
  };
  if (clip.width <= 0 || clip.height <= 0) {
    throw new Error(`measureContrast: clip outside viewport: ${JSON.stringify({ box, viewport, clip })}`);
  }
  const buf = await page.screenshot({ clip, animations: 'disabled' });
  const { width, height, rgba } = await decodePng(buf);

  // Inner region: where the component itself lives.
  const innerX0 = Math.max(0, Math.floor(box.x - clip.x));
  const innerY0 = Math.max(0, Math.floor(box.y - clip.y));
  const innerX1 = Math.min(width, innerX0 + Math.ceil(box.width));
  const innerY1 = Math.min(height, innerY0 + Math.ceil(box.height));

  // Background region: the margin ring around the component. Sample the
  // four edges of the clip and average — gives us "what colour is the
  // surrounding background?" robust to gradients or local noise.
  const edge = Math.max(2, Math.floor(margin / 2));
  const bgSamples = [
    meanLuminance(rgba, width, 0, 0, width, edge),
    meanLuminance(rgba, width, 0, height - edge, width, height),
    meanLuminance(rgba, width, 0, 0, edge, height),
    meanLuminance(rgba, width, width - edge, 0, width, height),
  ].filter((v) => v !== null);
  const bgL = bgSamples.reduce((a, b) => a + b, 0) / bgSamples.length;

  const fgL = meanLuminance(rgba, width, innerX0, innerY0, innerX1, innerY1);
  const fraction = fractionDifferingFromBg(
    rgba, width, innerX0, innerY0, innerX1, innerY1, bgL, PIXEL_LUMINANCE_DELTA,
  );

  return { fgL, bgL, fraction };
}

test.describe('Theming contract — components must remain visible in both themes', () => {
  for (const theme of THEMES) {
    for (const c of THEMED_COMPONENTS) {
      test(`${theme} · ${c.label} (${c.selector})`, async ({ page }) => {
        await setTheme(page, theme);
        await page.goto(c.page);
        await settleTheme(page, theme);

        // Wait for the component (or a parent that holds it) to be present
        // and stable. For Shoelace components we additionally wait for them
        // to upgrade so the shadow DOM is rendered.
        await page.waitForSelector(c.waitFor, { state: 'attached', timeout: 10_000 });
        const locator = page.locator(c.selector).first();
        await locator.waitFor({ state: 'attached', timeout: 10_000 });
        await page.waitForLoadState('networkidle');

        // Wait for Shoelace component upgrade so the shadow DOM has rendered
        // and the host has a non-zero bounding box.
        await page.waitForFunction(
          (sel) => {
            const el = document.querySelector(sel);
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          },
          c.selector,
          { timeout: 10_000 },
        );

        const { fgL, bgL, fraction } = await measureContrast(page, locator);
        expect(
          fraction,
          `${c.label}: only ${(fraction * 100).toFixed(2)}% of pixels in the ` +
            `component bbox differ from background by ≥${PIXEL_LUMINANCE_DELTA} ` +
            `luminance (fg-mean=${fgL?.toFixed(3)}, bg-mean=${bgL?.toFixed(3)}). ` +
            'Component is likely invisible in this theme — check that icon assets ' +
            'load (CSP / vendored path), that --sl-color-* tokens are bridged, and ' +
            'that no rule was purged.',
        ).toBeGreaterThan(MIN_DIFFERENT_PIXEL_FRACTION);
      });
    }
  }
});
