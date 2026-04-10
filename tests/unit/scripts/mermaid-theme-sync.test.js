import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Tests for mermaid-theme-sync.js — audit bug blog-y0y.
 * The script should not call updateMermaidTheme twice per theme toggle.
 */

const mermaidJs = readFileSync(
  path.resolve('src/_static/js/mermaid-theme-sync.js'),
  'utf-8'
);

describe('mermaid-theme-sync.js (blog-y0y)', () => {
  it('should have a guard against double-firing on theme toggle', () => {
    const hasEventListener = /addEventListener\s*\(\s*'themeChanged'/.test(mermaidJs);
    const hasMutationObserver = /MutationObserver/.test(mermaidJs);

    if (hasEventListener && hasMutationObserver) {
      // Both listeners exist — there MUST be an explicit deduplication guard.
      // A flag variable that suppresses MutationObserver when themeChanged just fired,
      // or a debounce/timeout that coalesces rapid calls.
      const hasGuardFlag = /handledByEvent|skipObserver|suppressObserver|fromToggle|recentlyUpdated/.test(mermaidJs);
      const hasDebounce = /clearTimeout.*updateMermaid|debounce/.test(mermaidJs);

      expect(
        hasGuardFlag || hasDebounce,
        'Both themeChanged listener and MutationObserver exist without a guard — updateMermaidTheme fires twice per toggle'
      ).toBe(true);
    }
    // If only one listener mechanism exists, no guard needed — test passes.
  });

  it('should still handle initial page load theme detection', () => {
    // The MutationObserver or an equivalent must still handle the initial
    // class set by the inline script (which doesn't dispatch themeChanged)
    const handlesInitialLoad = /load|DOMContentLoaded|readyState|getCurrentTheme/.test(mermaidJs);
    expect(handlesInitialLoad).toBe(true);
  });
});
