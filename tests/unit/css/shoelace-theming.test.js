import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Regression guard for selfhosted-h0ws (secondary defect).
//
// Before the bridge fix, raw-website.css had explicit dark-mode overrides
// like `html.dark sl-copy-button { color: ... }`. The minified output
// dropped the `html.dark` qualifier from one half of comma-joined selector
// lists, producing rules like `sl-copy-button{color:#e4e4e7}` — visible
// against any background, invisible in light mode.
//
// The fix replaced those rules with a `--sl-color-*` token bridge keyed
// off `html.dark`. This test asserts:
//   1. No unqualified selector pins sl-copy-button or sl-icon-button to a
//      light-on-light or dark-on-dark colour.
//   2. The token bridge is present in both default and dark scopes, so a
//      future regression (rule re-introduction or bridge deletion) trips
//      this guard before reaching production.
//
// We read the *built* `_site/css/style.css` so we catch minifier
// rewrites, not just source intent.

const CSS_PATH = resolve(process.cwd(), '_site/css/style.css');

// The exact zinc-200 hex that the broken minified output pinned
// sl-copy-button to. Other unqualified `sl-copy-button { color: ... }`
// rules would also be suspect, but this is the specific shape that hit
// production, so we name it explicitly.
const ZINC_200_HEX = '#e4e4e7';

let css = '';

beforeAll(() => {
  if (!existsSync(CSS_PATH)) {
    throw new Error(
      `${CSS_PATH} missing — run \`npm run build\` (or \`npm run dev:css\`) before this test`,
    );
  }
  css = readFileSync(CSS_PATH, 'utf8');
});

/**
 * Find every CSS rule whose selector list mentions `target` and return the
 * full rule text. Robust to minified single-line CSS: walks brace depth to
 * pair selectors with bodies.
 */
function rulesMentioning(text, target) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      if (depth === 0) {
        const selector = text.slice(start, i);
        if (selector.includes(target)) {
          // capture until matching close brace
          let d = 1;
          let j = i + 1;
          while (j < text.length && d > 0) {
            if (text[j] === '{') d++;
            else if (text[j] === '}') d--;
            j++;
          }
          out.push({
            selector: selector.trim(),
            body: text.slice(i + 1, j - 1),
            full: text.slice(start, j),
          });
        }
      }
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) start = i + 1;
    }
  }
  return out;
}

describe('Shoelace theming — built CSS contract', () => {
  it('does not contain an unqualified `sl-copy-button` color rule pinning the zinc-200 hex', () => {
    const rules = rulesMentioning(css, 'sl-copy-button');
    const offenders = rules.filter((r) => {
      // Selector list with sl-copy-button as a standalone (no qualifier).
      // Split on commas and check if any list-item is bare `sl-copy-button`.
      const items = r.selector.split(',').map((s) => s.trim());
      const hasBare = items.some((s) => s === 'sl-copy-button');
      const colorsToZinc = r.body.includes(ZINC_200_HEX);
      return hasBare && colorsToZinc;
    });
    expect(
      offenders,
      `Unqualified sl-copy-button rule pinned to ${ZINC_200_HEX} found — ` +
        `this is the minifier defect from selfhosted-h0ws. ` +
        `Offenders:\n${offenders.map((o) => o.full).join('\n')}`,
    ).toEqual([]);
  });

  it('does not contain an unqualified `sl-icon-button` color rule pinning the zinc-200 hex', () => {
    const rules = rulesMentioning(css, 'sl-icon-button');
    const offenders = rules.filter((r) => {
      const items = r.selector.split(',').map((s) => s.trim());
      const hasBare = items.some((s) => s === 'sl-icon-button');
      const colorsToZinc = r.body.includes(ZINC_200_HEX);
      return hasBare && colorsToZinc;
    });
    expect(offenders, `Unqualified sl-icon-button rule pinned to ${ZINC_200_HEX} found`).toEqual([]);
  });

  it('defines the Shoelace neutral token bridge in :root', () => {
    // Both bridge ramps must remain in the built CSS — without them every
    // Shoelace component falls back to its own (broken-for-our-design)
    // defaults regardless of theme.
    expect(css).toMatch(/--sl-color-neutral-600:[^;]+/);
    expect(css).toMatch(/--sl-color-neutral-200:[^;]+/);
  });

  it('overrides the Shoelace neutral ramp under html.dark', () => {
    // The dark-mode override lives in a rule whose selector includes
    // `html.dark` and whose body sets --sl-color-neutral-* values. Find
    // any such rule.
    const darkRules = rulesMentioning(css, 'html.dark');
    const hasNeutralOverride = darkRules.some((r) => /--sl-color-neutral-\d+\s*:/.test(r.body));
    expect(
      hasNeutralOverride,
      'No html.dark { --sl-color-neutral-*: ... } rule found in built CSS — ' +
        'the dark-mode side of the Shoelace token bridge is missing.',
    ).toBe(true);
  });
});
