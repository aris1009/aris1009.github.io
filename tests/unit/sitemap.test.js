import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import meta from '../../src/_data/meta.js';

describe('sitemap', () => {
  let sitemapContent;

  beforeAll(() => {
    // Read the generated sitemap file
    const sitemapPath = resolve('_site/sitemap.xml');
    sitemapContent = readFileSync(sitemapPath, 'utf8');
  });

  describe('XML structure', () => {
    it('should be valid XML with proper declaration', () => {
      expect(sitemapContent).toMatch(/^<\?xml version="1.0" encoding="utf-8"\?>/);
    });

    it('should have urlset element with correct namespace', () => {
      expect(sitemapContent).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    });

    it('should contain url elements', () => {
      expect(sitemapContent).toMatch(/<url>/g);
      expect(sitemapContent).toMatch(/<\/url>/g);
    });

    it('should have matching opening and closing urlset tags', () => {
      const urlsetOpenCount = (sitemapContent.match(/<urlset/g) || []).length;
      const urlsetCloseCount = (sitemapContent.match(/<\/urlset>/g) || []).length;
      expect(urlsetOpenCount).toBe(1);
      expect(urlsetCloseCount).toBe(1);
    });
  });

  describe('URL content', () => {
    let urls;

    beforeAll(() => {
      // Extract all URLs from the sitemap
      const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
      urls = urlMatches ? urlMatches.map(match => match.replace(/<\/?loc>/g, '')) : [];
    });

    it('should contain URLs', () => {
      expect(urls.length).toBeGreaterThan(0);
    });

    it('should include homepage URL', () => {
      const expectedUrl = `${meta.url}/`;
      expect(urls).toContain(expectedUrl);
    });

    it('should include some main pages', () => {
      const expectedUrls = [
        `${meta.url}/en-us/dictionary/`,
        `${meta.url}/en-us/about/`,
        `${meta.url}/en-us/ai-toolset/`,
        `${meta.url}/en-us/ai-disclaimer/`,
        `${meta.url}/en-us/acknowledgements/`
      ];

      expectedUrls.forEach(expectedUrl => {
        expect(urls).toContain(expectedUrl);
      });
    });

    it('should include all blog posts for all locales', () => {
      // Posts that exist in all locales
      const postsInAllLocales = [
        'gru-kms-windows'
      ];

      // Posts that only exist in en-us
      const postsInEnUsOnly = [
        'dealing-with-rate-limits',
        'get-most-out-of-claude-code',
        'great-firewall-wallbleed'
      ];

      // Check posts in all locales
      postsInAllLocales.forEach(post => {
        ['en-us', 'el', 'tr'].forEach(locale => {
          const expectedUrl = `${meta.url}/blog/${locale}/${post}/`;
          expect(urls).toContain(expectedUrl);
        });
      });

      // Check en-us only posts
      postsInEnUsOnly.forEach(post => {
        const expectedUrl = `${meta.url}/blog/en-us/${post}/`;
        expect(urls).toContain(expectedUrl);
      });
    });

    it('should not include the sitemap itself', () => {
      const sitemapUrl = `${meta.url}/sitemap.xml`;
      expect(urls).not.toContain(sitemapUrl);
    });

    it('should have valid URLs (no double slashes except after protocol)', () => {
      urls.forEach(url => {
        // Should start with https://
        expect(url).toMatch(/^https:\/\//);
        // Should not have double slashes except after https://
        // Check for double slashes not at the beginning of the URL
        const pathPart = url.replace(/^https?:\/\//, '');
        expect(pathPart).not.toMatch(/\/\//);
      });
    });
  });

  describe('sitemap metadata', () => {
    it('should include changefreq for each URL', () => {
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      const changefreqCount = (sitemapContent.match(/<changefreq>weekly<\/changefreq>/g) || []).length;
      expect(changefreqCount).toBe(urlCount);
    });

    it('should include priority for each URL', () => {
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      const priorityCount = (sitemapContent.match(/<priority>0\.8<\/priority>/g) || []).length;
      expect(priorityCount).toBe(urlCount);
    });

    it('should include lastmod for URLs that have dates', () => {
      // Blog posts should have lastmod dates
      const blogPostUrls = sitemapContent.match(/<loc>https?:\/\/[^\/]+\/blog\/[^\/]+\/[^\/]+\/<\/loc>/g) || [];
      blogPostUrls.forEach(blogUrl => {
        const urlElement = sitemapContent.substring(
          sitemapContent.indexOf(blogUrl),
          sitemapContent.indexOf('</url>', sitemapContent.indexOf(blogUrl)) + 6
        );
        expect(urlElement).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
      });
    });
  });
});