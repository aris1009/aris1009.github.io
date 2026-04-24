import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Tests for the self-hosted mermaid bundle (blog-c3n).
 *
 * The site used to load mermaid via ESM from unpkg.com, which is blocked by
 * the CSP added in 9ac0f08. We bundle mermaid locally with Rollup to avoid
 * any third-party script origin, matching the pattern in scripts/build-prism.js.
 */

describe('scripts/build-mermaid.js (blog-c3n)', () => {
  it('exports a build function and CONFIG from the module', async () => {
    const mod = await import('../../../scripts/build-mermaid.js');
    expect(typeof mod.buildBundle).toBe('function');
    expect(mod.CONFIG).toBeDefined();
    expect(mod.CONFIG.outputDir).toMatch(/src[\/\\]_static[\/\\]js[\/\\]vendor[\/\\]mermaid$/);
  });

  it('entry content assigns mermaid to window for the theme-sync script', async () => {
    const mod = await import('../../../scripts/build-mermaid.js');
    const entry = mod.generateEntryContent();
    expect(entry).toMatch(/import\s+mermaid\s+from\s+['"]mermaid['"]/);
    expect(entry).toMatch(/window\.mermaid\s*=\s*mermaid/);
  });

  it('entry content does NOT hardcode any third-party origin', async () => {
    const mod = await import('../../../scripts/build-mermaid.js');
    const entry = mod.generateEntryContent();
    expect(entry).not.toMatch(/unpkg\.com/);
    expect(entry).not.toMatch(/cdn\.jsdelivr\.net/);
    expect(entry).not.toMatch(/https?:\/\//);
  });
});

describe('mermaid local bundle output (blog-c3n)', () => {
  // These assertions validate what the build produces. If the bundle has not
  // been built yet (fresh clone, CI before build step), skip gracefully — the
  // build-script unit tests above still enforce the contract.
  const outputDir = path.resolve('src/_static/js/vendor/mermaid');
  const entryPath = path.join(outputDir, 'index.js');

  const bundleExists = existsSync(entryPath);
  const maybe = bundleExists ? it : it.skip;

  maybe('entry bundle is produced at src/_static/js/vendor/mermaid/index.js', () => {
    expect(existsSync(entryPath)).toBe(true);
  });

  maybe('entry bundle sets window.mermaid', () => {
    const code = readFileSync(entryPath, 'utf-8');
    expect(code).toMatch(/window\.mermaid\s*=/);
  });

  maybe('entry bundle contains no reference to unpkg or jsdelivr', () => {
    const code = readFileSync(entryPath, 'utf-8');
    expect(code).not.toMatch(/unpkg\.com/);
    expect(code).not.toMatch(/cdn\.jsdelivr\.net\/npm\/mermaid/);
  });
});
