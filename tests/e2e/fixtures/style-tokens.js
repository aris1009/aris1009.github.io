/**
 * Hardcoded RGB style tokens for narrow prose-contract assertions.
 *
 * These values are intentionally explicit (NOT derived from a Tailwind config
 * resolver) so any intentional contract change in a CSS-trim PR shows up as a
 * single-line fixture diff in the same PR. That makes the change visible to the
 * reviewer and prevents silent regressions.
 *
 * All values were captured empirically against the production build of
 * /blog/en-us/gru-kms-windows/ on `main` at the time this file was added.
 *
 * Maintenance:
 *   - Trim A may change `articleP.dark`, `articleLi.dark`, `articleLead.*`
 *   - Trim B may change `articleP.fontSize`
 *   - Trim C may change `articleA.*`
 * Each such change is a deliberate edit to this file in the same PR.
 *
 * Captured via the Playwright dev server (`npm run dev`) — the same build
 * environment the e2e suite uses. `npm run build:prod` purges some of these
 * variants where they are unused in markup; the dev (un-purged) values are
 * the right contract for the test runner.
 *
 * In dark mode the prose-p / prose-li / prose-lead overrides are driven by:
 *   - dark:prose-p:text-slate-50    -> #f8fafc
 *   - dark:prose-li:text-slate-50   -> #f8fafc
 *   - dark:prose-lead:text-slate-100 -> #f1f5f9 (cascade: html dark color also slate-100)
 *   - prose-lead:font-light          -> 300
 * Trim A is expected to delete those modifiers and replace them with raw
 * rules; if it does, the rgb values here are what the raw rules must produce.
 */
export const TOKENS = {
  html: {
    light: {
      backgroundColor: 'rgb(244, 244, 245)', // zinc-100
      color: 'rgb(15, 23, 42)',              // slate-900
    },
    dark: {
      backgroundColor: 'rgb(24, 24, 27)',    // zinc-900
      color: 'rgb(241, 245, 249)',           // slate-100
    },
  },
  articleP: {
    light: { color: 'rgb(55, 65, 81)' },     // gray-700 via prose-sky body (descendant `p`)
    dark: { color: 'rgb(248, 250, 252)' },   // slate-50 via dark:prose-p:text-slate-50
    fontSize: '20px',                        // prose-lg p at 1440 viewport; Trim B drops prose-lg
  },
  articleLi: {
    light: { color: 'rgb(55, 65, 81)' },     // gray-700 via prose-sky default
    dark: { color: 'rgb(248, 250, 252)' },   // slate-50 via dark:prose-li:text-slate-50
  },
  articleLead: {
    light: {
      color: 'rgb(75, 85, 99)',              // gray-600 (prose-sky default lead)
      fontWeight: '300',                     // prose-lead:font-light
    },
    dark: {
      color: 'rgb(241, 245, 249)',           // slate-100 via dark:prose-lead:text-slate-100
      fontWeight: '300',
    },
  },
  articleA: {
    light: { color: 'rgb(3, 105, 161)' },    // sky-700 via prose-sky
    dark: { color: 'rgb(56, 189, 248)' },    // sky-400 via prose-sky inverted
  },
};
