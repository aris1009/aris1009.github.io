import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export const WORDLISTS = [
  {
    id: 'eff_large_v1',
    file: 'src/_static/wordlists/eff_large_wordlist-v1.txt',
    expectedSha256:
      'addd35536511597a02fa0a9ff1e5284677b8883b83e986e43f15a3db996b903e',
    expectedLines: 7776
  }
];

export function sha256Hex(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function verifyWordlist(entry, { rootDir = root } = {}) {
  const abs = path.join(rootDir, entry.file);
  const bytes = readFileSync(abs);
  const actual = sha256Hex(bytes);
  if (actual !== entry.expectedSha256) {
    throw new Error(
      `Wordlist integrity failure: ${entry.file}\n  expected ${entry.expectedSha256}\n  got      ${actual}`
    );
  }
  const lines = bytes.toString('utf8').split('\n').filter((l) => l.length > 0);
  if (lines.length !== entry.expectedLines) {
    throw new Error(
      `Wordlist line-count failure: ${entry.file} expected ${entry.expectedLines}, got ${lines.length}`
    );
  }
  return { ...entry, sha256: actual, lines: lines.length };
}

export function buildWordlistsDataFile(results, outPath) {
  const payload = Object.fromEntries(
    results.map((r) => [
      r.id,
      {
        url: '/' + r.file.replace(/^src\/_static\//, ''),
        sha256: r.sha256,
        words: r.lines
      }
    ])
  );
  writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');
  return payload;
}

function main() {
  const results = WORDLISTS.map((w) => verifyWordlist(w));
  const outPath = path.join(root, 'src/_data/wordlists.json');
  const payload = buildWordlistsDataFile(results, outPath);
  for (const [id, meta] of Object.entries(payload)) {
    console.log(`ok  ${id}  ${meta.sha256}  ${meta.words} words  ${meta.url}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
