#!/usr/bin/env node
/**
 * CSS hygiene analyzer.
 *
 * Reads the BUILT production CSS at _site/css/style.css (run `npm run build:prod`
 * first), runs Project Wallace's analyzer against it, and compares key metrics
 * against the thresholds in wallace-thresholds.json.
 *
 * Exits 0 when every metric is within budget; exits 1 (with a clear diff) when any
 * threshold is exceeded.
 *
 * Trim PRs should ratchet wallace-thresholds.json downward as they trim — same
 * pattern as bundleSizeLimit.css in package.json.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '@projectwallace/css-analyzer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const cssPath = resolve(repoRoot, '_site/css/style.css');
const thresholdsPath = resolve(repoRoot, 'wallace-thresholds.json');

if (!existsSync(cssPath)) {
  console.error(
    `analyze-css: expected built CSS at ${cssPath}\n` +
      'Run `npm run build:prod` first.'
  );
  process.exit(2);
}

const css = readFileSync(cssPath, 'utf8');
const thresholds = JSON.parse(readFileSync(thresholdsPath, 'utf8'));
const result = analyze(css);

// Custom-property usage: scan raw CSS for var(--x) references. Anything declared
// but never referenced is an orphan — the exact pattern Project Wallace flags.
const declaredCustomMap = result.properties.custom?.unique ?? {};
const declaredCustom = Object.keys(declaredCustomMap);
const usedCustom = new Set(
  [...css.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)].map((m) => m[1])
);
const orphans = declaredCustom.filter((name) => !usedCustom.has(name));

const metrics = {
  'selectors.total': result.selectors.total,
  'selectors.totalUnique': result.selectors.totalUnique,
  'selectors.maxSpecificity': result.selectors.specificity.max,
  'rules.total': result.rules.total,
  'declarations.total': result.declarations.total,
  'declarations.importants': result.declarations.importants?.total ?? 0,
  'colors.totalUnique': result.values.colors.totalUnique,
  'customProperties.declared': declaredCustom.length,
  'customProperties.used': usedCustom.size,
  'customProperties.orphans': orphans.length,
};

const limits = {
  'selectors.total': thresholds.selectors.total,
  'selectors.totalUnique': thresholds.selectors.totalUnique,
  'selectors.maxSpecificity': thresholds.selectors.maxSpecificity,
  'rules.total': thresholds.rules.total,
  'declarations.total': thresholds.declarations.total,
  'declarations.importants': thresholds.declarations.importants,
  'colors.totalUnique': thresholds.colors.totalUnique,
  'customProperties.declared': thresholds.customProperties.declared,
  'customProperties.used': null,
  'customProperties.orphans': thresholds.customProperties.orphans,
};

function compareSpecificity(actual, limit) {
  // Lexicographic [a,b,c] comparison — higher is worse.
  for (let i = 0; i < 3; i++) {
    if (actual[i] > limit[i]) return 1;
    if (actual[i] < limit[i]) return -1;
  }
  return 0;
}

function fmt(value) {
  return Array.isArray(value) ? `[${value.join(',')}]` : String(value);
}

const failures = [];
console.log('CSS hygiene metrics (source: _site/css/style.css)');
console.log('-'.repeat(64));

for (const [key, actual] of Object.entries(metrics)) {
  const limit = limits[key];
  let status = 'ok';
  let breached = false;

  if (limit === null || limit === undefined) {
    status = 'info';
  } else if (Array.isArray(actual) && Array.isArray(limit)) {
    breached = compareSpecificity(actual, limit) > 0;
  } else if (typeof actual === 'number' && typeof limit === 'number') {
    breached = actual > limit;
  }

  if (breached) {
    status = 'FAIL';
    failures.push({ key, actual, limit });
  }

  const limitStr = limit === null || limit === undefined ? '(no limit)' : fmt(limit);
  console.log(
    `  ${key.padEnd(32)} ${fmt(actual).padStart(10)}   limit=${limitStr.padEnd(10)}   ${status}`
  );
}

console.log('-'.repeat(64));

if (failures.length > 0) {
  console.error(`\nanalyze-css: ${failures.length} threshold(s) exceeded:`);
  for (const f of failures) {
    console.error(`  - ${f.key}: ${fmt(f.actual)} > limit ${fmt(f.limit)}`);
  }
  console.error(
    '\nFix: trim CSS to bring metric below limit, OR if the increase is justified,' +
      '\nupdate wallace-thresholds.json (this is a ratchet — only loosen with cause).'
  );
  process.exit(1);
}

console.log('All CSS hygiene metrics within thresholds.');
process.exit(0);
