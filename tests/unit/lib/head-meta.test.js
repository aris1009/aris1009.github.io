import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Tests for head.njk, head-article.njk, and head-website.njk templates.
 * These verify that meta tags and Schema.org markup use correct variable names,
 * URLs, and image paths — catching regressions found in the 2026-04-10 audit.
 */

const headNjk = readFileSync(path.resolve('src/_includes/head.njk'), 'utf-8');
const headArticleNjk = readFileSync(path.resolve('src/_includes/head-article.njk'), 'utf-8');
const headWebsiteNjk = readFileSync(path.resolve('src/_includes/head-website.njk'), 'utf-8');

describe('head.njk template', () => {
  describe('blog-a3z: no variable overwrites in head.njk', () => {
    it('should NOT define pageSocialImg (parent templates set it)', () => {
      // head.njk must only consume pageSocialImg, not set it
      const setStatements = headNjk.match(/\{%-?\s*set\s+pageSocialImg\b/g);
      expect(setStatements).toBeNull();
    });

    it('should NOT define pageUrls (parent templates set it)', () => {
      // head.njk must only consume pageUrls, not set it
      const setStatements = headNjk.match(/\{%-?\s*set\s+pageUrls\b/g);
      expect(setStatements).toBeNull();
    });

    it('should NOT define pageTitle (parent templates set it)', () => {
      const setStatements = headNjk.match(/\{%-?\s*set\s+pageTitle\b/g);
      expect(setStatements).toBeNull();
    });

    it('should NOT define pageDescription (parent templates set it)', () => {
      const setStatements = headNjk.match(/\{%-?\s*set\s+pageDescription\b/g);
      expect(setStatements).toBeNull();
    });
  });

  describe('blog-z48: og:url uses pageUrls not meta.url', () => {
    it('should reference pageUrls in og:url meta tag', () => {
      expect(headNjk).toMatch(/og:url.*\{\{pageUrls\}\}/);
    });

    it('should NOT use bare meta.url for og:url', () => {
      // meta.url alone = homepage on every page
      const ogUrlLine = headNjk.split('\n').find(l => l.includes('og:url'));
      expect(ogUrlLine).toBeDefined();
      expect(ogUrlLine).not.toMatch(/content="\{\{meta\.url\}\}"/);
    });
  });

  describe('blog-d5q: twitter:url is populated', () => {
    it('should have pageUrls as twitter:url content', () => {
      const twitterUrlLine = headNjk.split('\n').find(l => l.includes('twitter:url'));
      expect(twitterUrlLine).toBeDefined();
      expect(twitterUrlLine).toMatch(/content="\{\{pageUrls\}\}"/);
    });

    it('should NOT have empty twitter:url content', () => {
      const twitterUrlLine = headNjk.split('\n').find(l => l.includes('twitter:url'));
      expect(twitterUrlLine).not.toMatch(/content=""\s*>/);
    });
  });

  describe('blog-659: Twitter/Facebook meta tags use correct variable names', () => {
    it('should use meta.twitterUser not meta.twitterUsername', () => {
      expect(headNjk).not.toContain('meta.twitterUsername');
      expect(headNjk).toContain('meta.twitterUser');
    });

    it('should use meta.facebookUser not meta.facebookUsername', () => {
      expect(headNjk).not.toContain('meta.facebookUsername');
      expect(headNjk).toContain('meta.facebookUser');
    });
  });
});

describe('head-article.njk template', () => {
  describe('blog-dgx: Schema.org publisher logo URL', () => {
    it('should use avatar.webp not avatar.webpg', () => {
      expect(headArticleNjk).toContain('avatar.webp');
      expect(headArticleNjk).not.toContain('avatar.webpg');
    });

    it('should have slash between meta.url and img/ in logo URL', () => {
      // Correct: {{meta.url}}/img/avatar.webp
      expect(headArticleNjk).toMatch(/\{\{meta\.url\}\}\/img\/avatar\.webp/);
    });
  });
});

describe('head-website.njk template', () => {
  describe('blog-w58: Schema.org logo references correct image', () => {
    it('should NOT reference marcomicale.webp (placeholder from boilerplate)', () => {
      expect(headWebsiteNjk).not.toContain('marcomicale.webp');
    });

    it('should reference a valid avatar image path', () => {
      // Should use the same avatar as head-article.njk
      expect(headWebsiteNjk).toMatch(/\{\{meta\.url\}\}\/img\/avatar\.webp/);
    });
  });
});
