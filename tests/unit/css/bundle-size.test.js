import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CSS_PATH = resolve(process.cwd(), '_site/css/style.css');
const PKG_PATH = resolve(process.cwd(), 'package.json');

// Per-category budgets (bytes). These are the authoritative guard against
// silent bloat in each bucket. Ratchet DOWN in the same PR as the trim that
// shrinks the bucket — see blog-wyu epic (Trims A-F).
//
// Targets (end-state, per epic AC): prose 35000, burger 6000, preflight 5000,
// features 15000, other 10000. Current values leave small headroom above
// observed so the suite starts green and each trim tightens a bucket.
const CATEGORY_BUDGETS = {
  'typography-prose': 36000,
  'burger-menu': 6000,
  preflight: 6600,
  // feature-components: bumped from 8000 → 9000 to absorb the prose link-text
  // rules (PR #144 — sky-800 in light, sky-300 in dark, plus dictionary parity
  // updates) which the categorizer routes here via .link-text/.dictionary-*.
  'feature-components': 9000,
  // other: bumped from 14500 → 18500 to absorb the Shoelace ↔ Tailwind theme
  // token bridge (--sl-color-* vars in :root + html.dark, ~3.4KB). The bridge
  // replaces ad-hoc per-component overrides with a single source of truth and
  // is what makes every future Shoelace component theme-correctly without new
  // CSS — a fixed cost that's explicitly worth paying.
  other: 18500,
  'keyframes-at': 2000,
};

function splitTopLevelRules(css) {
  const rules = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        rules.push(css.slice(start, i + 1));
        start = i + 1;
      }
    }
  }
  return rules;
}

function categorizeSelector(selector, body) {
  if (/\.prose\b|:where\(/.test(selector)) return 'typography-prose';
  if (/burger/i.test(selector)) return 'burger-menu';
  if (/dictionary|theme-toggle|language-toggle|language-selector|reading-progress|\.toc\b|toc-|mermaid|back-to-top|link-text|external-link|internal-link/i.test(selector)) {
    return 'feature-components';
  }
  const isUniversal = /^(\*,:after,:before|\*, ::before, ::after|::backdrop)$/.test(selector);
  const declaresTwVar = /--tw-/.test(body);
  if (isUniversal) return declaresTwVar ? 'other' : 'preflight';
  // Element-only selectors (no class/id) → preflight/base resets.
  if (/^[a-zA-Z][a-zA-Z0-9, :()\[\]=-]*$/.test(selector) && !/[.#]/.test(selector)) {
    return 'preflight';
  }
  return 'other';
}

function categorizeRule(rule) {
  const match = rule.match(/^([^{]+)\{/);
  if (!match) return 'other';
  const selector = match[1].trim();
  const body = rule.slice(rule.indexOf('{') + 1, rule.lastIndexOf('}'));
  if (/^@(keyframes|font-face|supports|layer|charset)/.test(selector)) return 'keyframes-at';
  if (selector.startsWith('@media')) {
    const inner = body.match(/([^{}]+)\{([^{}]*)\}/);
    if (inner) return categorizeSelector(inner[1].trim(), inner[2]);
    return 'other';
  }
  return categorizeSelector(selector, body);
}

function categorize(css) {
  const rules = splitTopLevelRules(css);
  const totals = Object.fromEntries(Object.keys(CATEGORY_BUDGETS).map((k) => [k, 0]));
  for (const rule of rules) {
    const cat = categorizeRule(rule);
    totals[cat] = (totals[cat] ?? 0) + rule.length;
  }
  return totals;
}

describe('CSS bundle size budgets', () => {
  let css;
  let pkg;

  beforeAll(() => {
    if (!existsSync(CSS_PATH)) {
      throw new Error(
        `Missing ${CSS_PATH}. Run \`npm run build:prod\` before \`npm test\`.`,
      );
    }
    css = readFileSync(CSS_PATH, 'utf8');
    pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
  });

  it('total bundle stays under package.json bundleSizeLimit.css', () => {
    const limit = pkg.bundleSizeLimit?.css;
    expect(limit, 'package.json bundleSizeLimit.css must be set').toBeTypeOf('number');
    expect(css.length).toBeLessThanOrEqual(limit);
  });

  it('categorization covers the whole file (no bytes lost)', () => {
    const totals = categorize(css);
    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    expect(sum).toBe(css.length);
  });

  it.each(Object.entries(CATEGORY_BUDGETS))(
    'category %s stays under %i bytes',
    (category, budget) => {
      const totals = categorize(css);
      const actual = totals[category] ?? 0;
      expect(
        actual,
        `${category}=${actual}B exceeds budget ${budget}B. Either trim the bucket or justify raising the limit in tests/unit/css/bundle-size.test.js.`,
      ).toBeLessThanOrEqual(budget);
    },
  );
});
