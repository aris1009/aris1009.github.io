import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Tests for sw.js service worker — audit bugs blog-oc6 and blog-g8k.
 */

const swJs = readFileSync(path.resolve('src/_static/sw.js'), 'utf-8');

describe('sw.js service worker', () => {
  describe('blog-oc6: precache assets must exist', () => {
    it('should NOT precache favicon.svg (file does not exist)', () => {
      expect(swJs).not.toContain('favicon.svg');
    });

    it('all precached favicon paths should reference existing files', () => {
      // Extract paths from PRECACHE_ASSETS array
      const assetMatches = swJs.match(/PRECACHE_ASSETS\s*=\s*\[([\s\S]*?)\]/);
      expect(assetMatches).not.toBeNull();

      const assetsBlock = assetMatches[1];
      const faviconPaths = assetsBlock.match(/'([^']*favicon[^']*)'/g) || [];

      for (const quotedPath of faviconPaths) {
        const urlPath = quotedPath.replace(/'/g, '');
        // Map URL path to source file path
        const srcPath = path.resolve('src', urlPath.replace(/^\//, ''));
        // Also check the _static mapping
        const staticPath = path.resolve('src/_static', urlPath.replace(/^\/_static\//, ''));
        const exists = existsSync(srcPath) || existsSync(staticPath);
        expect(exists, `precached file should exist: ${urlPath}`).toBe(true);
      }
    });
  });

  describe('blog-g8k: cache version must not be hardcoded', () => {
    it('should NOT have a hardcoded CACHE_VERSION string literal', () => {
      // A hardcoded version like 'v1' means the cache never invalidates
      const hardcodedVersion = swJs.match(/CACHE_VERSION\s*=\s*'v\d+'/);
      expect(hardcodedVersion, 'CACHE_VERSION should not be a static string like v1').toBeNull();
    });
  });
});
