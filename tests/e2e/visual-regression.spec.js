import { test, expect } from '@playwright/test';

/**
 * Visual regression baselines for CSS-sensitive pages.
 *
 * Captures screenshots across light/dark themes and three viewports so
 * downstream CSS-trim PRs can detect unintended styling changes.
 *
 * To regenerate baselines after intentional CSS changes:
 *   npx playwright test visual-regression --update-snapshots
 */

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const THEMES = ['light', 'dark'];

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'blog-post-prose', path: '/blog/en-us/gru-kms-windows/' },
  { name: 'tools-diceware', path: '/en-us/tools/diceware/' },
  { name: 'dictionary', path: '/en-us/dictionary/' },
  // mcp-security has 20+ H2s (TOC renders) and embedded mermaid diagrams.
  { name: 'blog-post-toc-mermaid', path: '/blog/en-us/mcp-security/' },
];

const DISABLE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
`;

// Selectors for dynamic content that should be masked from screenshots
// to avoid false positives (dates, reading-time, randomly generated
// values, mermaid SVGs whose layout varies between runs, etc.).
const DYNAMIC_MASK_SELECTORS = [
  'time',
  'small.info',
  '#reading-progress',
  '.reading-progress',
  // Diceware: the entire interactive section regenerates a passphrase
  // and entropy figures on every page load via the in-page CSPRNG, and
  // Shoelace components hydrate with subtle frame-to-frame differences.
  // Mask the whole app box; the surrounding prose still validates layout.
  '#diceware-app',
  // Mermaid renders SVG client-side; dimensions and internal IDs vary
  // between runs even with the same source. Mask the rendered blocks
  // wholesale; the surrounding prose still validates layout.
  'pre.mermaid',
  '.mermaid',
];

async function preparePage(page, theme) {
  // Apply theme via localStorage before navigation so the FOUC-prevention
  // inline script picks it up.
  await page.addInitScript((selectedTheme) => {
    try {
      localStorage.setItem('theme', selectedTheme);
    } catch (_) {
      // ignore
    }
  }, theme);
  await page.emulateMedia({ colorScheme: theme });
}

async function settlePage(page) {
  // Belt-and-braces: ensure the theme manager has applied classes even if
  // the inline script raced.
  await page.evaluate((selectedTheme) => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('sl-theme-dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('sl-theme-dark');
    }
  }, await page.evaluate(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')));

  // Inject CSS via DOM rather than page.addStyleTag(): the latter routes
  // through Playwright's content URL mechanism which the site's CSP
  // (connect-src) blocks. Direct DOM insertion is allowed because the
  // CSP grants 'unsafe-inline' for styles to support Tailwind/Shoelace.
  await page.evaluate(
    ([animationsCss, mermaidCss]) => {
      const inject = (id, css) => {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
      };
      inject('pw-disable-animations', animationsCss);
      inject('pw-stable-mermaid', mermaidCss);
    },
    [
      DISABLE_ANIMATIONS_CSS,
      `pre.mermaid, .mermaid {
        min-height: 240px !important;
        max-height: 240px !important;
        height: 240px !important;
        overflow: hidden !important;
      }
      #diceware-app {
        min-height: 480px !important;
        max-height: 480px !important;
        height: 480px !important;
        overflow: hidden !important;
      }`,
    ]
  );

  // Wait for fonts so glyph metrics are stable across runs.
  await page.evaluate(() => document.fonts && document.fonts.ready);

  // Allow lazy assets, mermaid SVGs, and Shoelace components to settle.
  await page.waitForLoadState('networkidle').catch(() => {});
}

test.describe('Visual regression baselines', () => {
  for (const themeName of THEMES) {
    for (const viewport of VIEWPORTS) {
      for (const pageDef of PAGES) {
        test(`${pageDef.name} | ${themeName} | ${viewport.name}`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await preparePage(page, themeName);
          await page.goto(pageDef.path, { waitUntil: 'domcontentloaded' });
          await settlePage(page);

          const masks = DYNAMIC_MASK_SELECTORS.map((sel) => page.locator(sel));

          await expect(page).toHaveScreenshot(
            `${pageDef.name}-${themeName}-${viewport.name}.png`,
            {
              fullPage: true,
              animations: 'disabled',
              mask: masks,
            }
          );
        });
      }
    }
  }
});
