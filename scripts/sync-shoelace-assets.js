#!/usr/bin/env node
// Copies the Shoelace icon SVGs we actually use from node_modules into
// src/_static/vendor/shoelace/icons/ so the runtime icon library can resolve
// them same-origin. Keeps CSP connect-src tight (no cdn.jsdelivr.net needed
// for icon fetches) and pins the icon set to the installed Shoelace version.
//
// To add a new icon: add its name to ICON_NAMES and re-run `npm run build`
// (prebuild calls this script). The list is intentionally explicit so we
// never ship icons we don't use.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ICON_NAMES = [
  'arrow-clockwise', // diceware regenerate button
  'copy',            // sl-copy-button default copy icon
  'check',           // sl-copy-button default success icon
  'x-lg',            // sl-copy-button default error icon
  'paragraph',       // header-anchor pilcrow (src/lib/transforms.js)
  'chevron-right',   // sl-details summary chevron (LTR + RTL fallback)
  'chevron-left',    // sl-details summary chevron (RTL primary)
  'chevron-down',    // sl-details open-state chevron (some Shoelace builds)
];

const SRC_DIR = join(ROOT, 'node_modules/@shoelace-style/shoelace/cdn/assets/icons');
const DST_DIR = join(ROOT, 'src/_static/vendor/shoelace/icons');

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`[sync-shoelace-assets] missing source dir: ${SRC_DIR}`);
    console.error('Run `npm install` first — @shoelace-style/shoelace is a devDependency.');
    process.exit(1);
  }
  await mkdir(DST_DIR, { recursive: true });
  for (const name of ICON_NAMES) {
    const src = join(SRC_DIR, `${name}.svg`);
    const dst = join(DST_DIR, `${name}.svg`);
    const buf = await readFile(src);
    await writeFile(dst, buf);
  }
  console.log(`[sync-shoelace-assets] synced ${ICON_NAMES.length} icons → ${DST_DIR}`);
}

main().catch((err) => {
  console.error('[sync-shoelace-assets] failed:', err);
  process.exit(1);
});
