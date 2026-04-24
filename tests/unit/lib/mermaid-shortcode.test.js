import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Integration tests for the local mermaid wiring (blog-c3n).
 *
 * These validate the full surface: the eleventy config must override the
 * plugin's mermaid_js shortcode so that the emitted <script> loads from the
 * same origin, and the CSP must not be loosened to accommodate a CDN.
 */

const eleventyConfig = readFileSync(
  path.resolve('eleventy.config.js'),
  'utf-8'
);

const headNjk = readFileSync(
  path.resolve('src/_includes/head.njk'),
  'utf-8'
);

describe('mermaid_js shortcode override (blog-c3n)', () => {
  it('eleventy.config.js registers a mermaid_js shortcode override after the plugin', () => {
    // The plugin's default shortcode imports from unpkg.com; our override
    // must replace it with a script tag pointing at the local bundle.
    const overrideRegex = /addShortcode\(\s*["']mermaid_js["']/;
    expect(overrideRegex.test(eleventyConfig)).toBe(true);
  });

  it('mermaid_js shortcode emits a script tag pointing at /_static/js/vendor/mermaid/', () => {
    // Find the override body.
    const match = eleventyConfig.match(
      /addShortcode\(\s*["']mermaid_js["'][\s\S]*?\);/
    );
    expect(match, 'mermaid_js shortcode override not found').toBeTruthy();
    const body = match[0];

    expect(body).toMatch(/\/_static\/js\/vendor\/mermaid\//);
    expect(body).toMatch(/<script/);
  });

  it('mermaid_js shortcode override does NOT reference unpkg or jsdelivr', () => {
    const match = eleventyConfig.match(
      /addShortcode\(\s*["']mermaid_js["'][\s\S]*?\);/
    );
    expect(match).toBeTruthy();
    const body = match[0];
    expect(body).not.toMatch(/unpkg\.com/);
    expect(body).not.toMatch(/cdn\.jsdelivr\.net/);
  });
});

describe('CSP script-src keeps mermaid same-origin (blog-c3n)', () => {
  it('script-src does NOT allow unpkg.com', () => {
    const cspMatch = headNjk.match(/Content-Security-Policy[^>]*content="([^"]+)"/);
    expect(cspMatch, 'CSP meta tag not found in head.njk').toBeTruthy();
    const csp = cspMatch[1];
    const scriptSrc = csp.match(/script-src[^;]+/)?.[0] || '';
    expect(scriptSrc).not.toMatch(/unpkg\.com/);
  });

  it('CSP script-src allows self so the local bundle can load', () => {
    const cspMatch = headNjk.match(/Content-Security-Policy[^>]*content="([^"]+)"/);
    const csp = cspMatch[1];
    const scriptSrc = csp.match(/script-src[^;]+/)?.[0] || '';
    expect(scriptSrc).toMatch(/'self'/);
  });
});
