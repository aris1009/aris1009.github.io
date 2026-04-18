#!/usr/bin/env node
// Drift detection between obsidian-vault/Blog Seeds/ state and src/blog/en-us/.
// Run locally: VAULT_DIR=~/projects/obsidian-vault node scripts/check-seed-drift.js
// Exits 0 if consistent, 1 on drift, 2 on usage/IO error. See selfhosted-v9pi.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    fm[m[1]] = v;
  }
  return fm;
}

export function checkDrift(seedsDir, postsDir) {
  const drift = [];
  const seedFiles = readdirSync(seedsDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => join(seedsDir, f))
    .filter((p) => statSync(p).isFile());

  for (const path of seedFiles) {
    const raw = readFileSync(path, 'utf8');
    const fm = parseFrontmatter(raw);
    if (!fm) {
      drift.push({ path, reason: 'missing frontmatter' });
      continue;
    }
    if (fm.status !== 'Drafted') continue;
    if (!fm.slug) {
      drift.push({ path, reason: 'Drafted seed missing slug' });
      continue;
    }
    if (!fm.pr_url) {
      drift.push({ path, reason: 'Drafted seed missing pr_url (atomicity violation)' });
    }
    const postPath = join(postsDir, `${fm.slug}.md`);
    try {
      statSync(postPath);
    } catch {
      drift.push({
        path,
        reason: `Drafted seed has no matching post at src/blog/en-us/${fm.slug}.md`,
      });
    }
  }

  return { scanned: seedFiles.length, drift };
}

function main() {
  const VAULT_DIR = process.env.VAULT_DIR;
  if (!VAULT_DIR) {
    console.error('VAULT_DIR env var is required (path to obsidian-vault clone)');
    process.exit(2);
  }

  let result;
  try {
    result = checkDrift(join(VAULT_DIR, 'Blog Seeds'), resolve('src/blog/en-us'));
  } catch (e) {
    console.error(`scan failed: ${e.message}`);
    process.exit(2);
  }

  if (result.drift.length === 0) {
    console.log(`OK — ${result.scanned} seeds scanned, no drift.`);
    process.exit(0);
  }

  console.error(`DRIFT — ${result.drift.length} issue(s):`);
  for (const d of result.drift) {
    console.error(`  ${d.path}\n    ${d.reason}`);
  }
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
