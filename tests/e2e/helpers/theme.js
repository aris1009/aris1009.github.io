/**
 * Theme helper for e2e tests.
 *
 * Sets the persisted theme preference before navigation (so the FOUC-prevention
 * inline script picks it up), then forces the html-class state after load to
 * survive any race with the theme manager. Mirrors the patterns used in
 * tests/e2e/theme-toggle.spec.js and tests/e2e/visual-regression.spec.js so we
 * have a single source of truth.
 */
export async function setTheme(page, theme) {
  if (theme !== 'light' && theme !== 'dark') {
    throw new Error(`setTheme: theme must be 'light' or 'dark', got ${theme}`);
  }
  await page.addInitScript((selectedTheme) => {
    try {
      localStorage.setItem('theme', selectedTheme);
    } catch (_) {
      // ignore storage errors
    }
  }, theme);
  await page.emulateMedia({ colorScheme: theme });
}

/**
 * Belt-and-braces: ensure html.dark / sl-theme-dark classes match the requested
 * theme regardless of whether the inline FOUC script ran. Call after
 * `page.goto(...)`.
 */
export async function settleTheme(page, theme) {
  await page.evaluate((selectedTheme) => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('sl-theme-dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('sl-theme-dark');
    }
  }, theme);
}
