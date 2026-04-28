#!/usr/bin/env node
// Build-time guard: every Shoelace icon referenced in source must be
// vendored under src/_static/vendor/shoelace/icons/. Production CSP blocks
// fetches from cdn.jsdelivr.net (connect-src), so any unvendored icon
// renders as an empty <sl-icon> on the live site (selfhosted-h0ws).
//
// What we scan:
//   - explicit <sl-icon name="X"> references in src/**/*.{njk,html,js}
//   - implicit icons used by Shoelace components when they appear in
//     source (sl-details → chevron-right/-left; sl-copy-button → copy,
//     check, x-lg). These are hard-coded by Shoelace's own templates and
//     resolved through the 'system' icon library, which we override to
//     point at the same vendored dir.
//
// Failure prints the missing icons + where they were referenced, and
// exits non-zero so `npm run build` halts.

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'src');
const VENDOR_DIR = join(ROOT, 'src/_static/vendor/shoelace/icons');

const SCAN_EXTENSIONS = new Set(['.njk', '.html', '.js', '.mjs']);

// Components → icons they fetch internally via library="system". When the
// component appears in source, those icons must be vendored even though no
// <sl-icon name="..."> tag references them directly.
const COMPONENT_INTERNAL_ICONS = {
  'sl-details': ['chevron-right', 'chevron-left'],
  'sl-copy-button': ['copy', 'check', 'x-lg'],
};

const ICON_NAME_RE = /<sl-icon\b[^>]*\bname=["']([^"']+)["']/g;
const COMPONENT_USE_RE = /<(sl-[a-z-]+)\b/g;

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip vendored Shoelace assets — the guard is for source code, not
      // the vendor dir we're checking against.
      if (full.includes(`${VENDOR_DIR}`)) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.');
      const ext = dot === -1 ? '' : entry.name.slice(dot);
      if (SCAN_EXTENSIONS.has(ext)) yield full;
    }
  }
}

async function collectReferences() {
  const referenced = new Map(); // icon → [{ file, line }]
  const componentsSeen = new Set();

  for await (const file of walk(SRC_DIR)) {
    const text = await readFile(file, 'utf8');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m;

      ICON_NAME_RE.lastIndex = 0;
      while ((m = ICON_NAME_RE.exec(line)) !== null) {
        const name = m[1];
        const list = referenced.get(name) ?? [];
        list.push({ file: relative(ROOT, file), line: i + 1 });
        referenced.set(name, list);
      }

      COMPONENT_USE_RE.lastIndex = 0;
      while ((m = COMPONENT_USE_RE.exec(line)) !== null) {
        componentsSeen.add(m[1]);
      }
    }
  }

  for (const [component, icons] of Object.entries(COMPONENT_INTERNAL_ICONS)) {
    if (!componentsSeen.has(component)) continue;
    for (const name of icons) {
      const list = referenced.get(name) ?? [];
      list.push({ file: `(implicit: ${component} system icon)`, line: 0 });
      referenced.set(name, list);
    }
  }

  return referenced;
}

async function main() {
  if (!existsSync(VENDOR_DIR)) {
    console.error(`[check-shoelace-icons] vendor dir missing: ${VENDOR_DIR}`);
    console.error('Run `npm run sync:shoelace` first.');
    process.exit(1);
  }
  const vendoredEntries = await readdir(VENDOR_DIR);
  const vendored = new Set(
    vendoredEntries
      .filter((n) => n.endsWith('.svg'))
      .map((n) => n.slice(0, -'.svg'.length)),
  );

  const referenced = await collectReferences();
  const missing = [];
  for (const [name, refs] of referenced) {
    if (!vendored.has(name)) missing.push({ name, refs });
  }

  if (missing.length) {
    console.error('[check-shoelace-icons] FAIL — referenced icons are not vendored:');
    for (const { name, refs } of missing) {
      console.error(`  - ${name}`);
      for (const r of refs) console.error(`      at ${r.file}${r.line ? `:${r.line}` : ''}`);
    }
    console.error('');
    console.error('Add each missing icon to ICON_NAMES in scripts/sync-shoelace-assets.js');
    console.error('and re-run `npm run sync:shoelace`. Production CSP blocks the cdn.jsdelivr.net');
    console.error('fallback, so unvendored icons render as empty <sl-icon> on the live site.');
    process.exit(1);
  }

  console.log(
    `[check-shoelace-icons] OK — ${referenced.size} referenced icon(s) all present in ${relative(ROOT, VENDOR_DIR)}`,
  );
}

main().catch((err) => {
  console.error('[check-shoelace-icons] failed:', err);
  process.exit(1);
});
