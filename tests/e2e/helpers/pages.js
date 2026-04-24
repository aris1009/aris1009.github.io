/**
 * Shared list of CSS-sensitive pages used by the layout-invariant, a11y, and
 * visual-regression suites. Keep in sync with tests/e2e/visual-regression.spec.js
 * (the xf3 baseline) so the same surface is exercised by every defensive layer.
 */
export const PAGES = [
  { name: 'home', url: '/' },
  { name: 'blog-post-prose', url: '/blog/en-us/gru-kms-windows/' },
  { name: 'tools-diceware', url: '/en-us/tools/diceware/' },
  { name: 'dictionary', url: '/en-us/dictionary/' },
  { name: 'blog-post-toc-mermaid', url: '/blog/en-us/mcp-security/' },
];

export const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
