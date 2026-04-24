import { describe, it, expect, vi } from 'vitest';
import { readableDate, htmlDateString, head, min, filterTagList, localizedReadingTime, languageSwitcherOptions } from 'src/lib/filters.js';

describe('filters', () => {
  describe('readableDate', () => {
    it('should format date for default locale (en-us)', () => {
      const date = new Date('2023-12-25T10:00:00Z');
      const result = readableDate(date);
      expect(result).toBe('25 Dec 2023');
    });

    it('should format date for Greek locale', () => {
      const date = new Date('2023-12-25T10:00:00Z');
      const result = readableDate(date, 'el');
      expect(result).toBe('25 Δεκ 2023');
    });

    it('should format date for Turkish locale', () => {
      const date = new Date('2023-12-25T10:00:00Z');
      const result = readableDate(date, 'tr');
      expect(result).toBe('25 Ara 2023');
    });

    it('should fallback to default locale for unknown locale', () => {
      const date = new Date('2023-12-25T10:00:00Z');
      const result = readableDate(date, 'unknown');
      expect(result).toBe('25 Dec 2023');
    });
  });

  describe('htmlDateString', () => {
    it('should format date as HTML date string', () => {
      const date = new Date('2023-12-25T10:00:00Z');
      const result = htmlDateString(date);
      expect(result).toBe('2023-12-25');
    });
  });

  describe('head', () => {
    it('should return first n elements when n is positive', () => {
      const array = [1, 2, 3, 4, 5];
      expect(head(array, 3)).toEqual([1, 2, 3]);
    });

    it('should return last n elements when n is negative', () => {
      const array = [1, 2, 3, 4, 5];
      expect(head(array, -2)).toEqual([4, 5]);
    });

    it('should return empty array for empty input', () => {
      expect(head([], 3)).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      expect(head('string', 3)).toEqual([]);
      expect(head(null, 3)).toEqual([]);
      expect(head(undefined, 3)).toEqual([]);
    });

    it('should handle n larger than array length', () => {
      const array = [1, 2];
      expect(head(array, 5)).toEqual([1, 2]);
    });
  });

  describe('min', () => {
    it('should return minimum of multiple numbers', () => {
      expect(min(5, 2, 8, 1, 9)).toBe(1);
    });

    it('should handle single number', () => {
      expect(min(42)).toBe(42);
    });

    it('should handle negative numbers', () => {
      expect(min(-5, -2, -8)).toBe(-8);
    });
  });

  describe('filterTagList', () => {
    it('should filter out excluded tags', () => {
      const tags = ['all', 'nav', 'post', 'posts', 'tech', 'security'];
      const result = filterTagList(tags);
      expect(result).toEqual(['tech', 'security']);
    });

    it('should return empty array for null/undefined tags', () => {
      expect(filterTagList(null)).toEqual([]);
      expect(filterTagList(undefined)).toEqual([]);
    });

    it('should return all tags if none are excluded', () => {
      const tags = ['tech', 'security', 'programming'];
      const result = filterTagList(tags);
      expect(result).toEqual(['tech', 'security', 'programming']);
    });
  });

  describe('localizedReadingTime', () => {
    it('should calculate reading time based on word count', () => {
      // ~1000 words at 200 wpm = 5 min
      const longContent = 'word '.repeat(1000);
      const result = localizedReadingTime(longContent, 'en-us');
      expect(result).toBe('5 min read');
    });

    it('should return minimum 1 min for short content', () => {
      const result = localizedReadingTime('short content', 'en-us');
      expect(result).toBe('1 min read');
    });
  });

  describe('languageSwitcherOptions', () => {
    const supportedLocales = ['en-us', 'el', 'tr'];

    it('derives the current locale from the URL, not from a caller-supplied lang', () => {
      const result = languageSwitcherOptions('/blog/el/gru-kms-windows/', supportedLocales, [
        { lang: 'en-us', url: '/blog/en-us/gru-kms-windows/' },
        { lang: 'tr', url: '/blog/tr/gru-kms-windows/' }
      ]);

      expect(result[0]).toMatchObject({ lang: 'en-us', href: '/blog/en-us/gru-kms-windows/', current: false });
      expect(result[1]).toMatchObject({ lang: 'el', href: '/blog/el/gru-kms-windows/', current: true });
      expect(result[2]).toMatchObject({ lang: 'tr', href: '/blog/tr/gru-kms-windows/', current: false });
    });

    it('treats a non-blog page URL like /el/about/ the same way', () => {
      const result = languageSwitcherOptions('/el/about/', supportedLocales, [
        { lang: 'en-us', url: '/en-us/about/' },
        { lang: 'tr', url: '/tr/about/' }
      ]);

      expect(result[0]).toMatchObject({ lang: 'en-us', current: false, href: '/en-us/about/' });
      expect(result[1]).toMatchObject({ lang: 'el', current: true, href: '/el/about/' });
    });

    it('falls back to post-not-translated for locales with no alternate', () => {
      const result = languageSwitcherOptions('/en-us/tools/diceware/', supportedLocales, []);

      expect(result[0].href).toBe('/en-us/tools/diceware/');
      expect(result[1]).toMatchObject({ lang: 'el', href: '/el/post-not-translated/', translated: false });
      expect(result[2]).toMatchObject({ lang: 'tr', href: '/tr/post-not-translated/', translated: false });
    });

    it('mixes real alternates with fallbacks when some translations exist', () => {
      const result = languageSwitcherOptions(
        '/blog/en-us/gru-kms-windows/',
        supportedLocales,
        [{ lang: 'el', url: '/blog/el/gru-kms-windows/' }]
      );

      expect(result[1]).toMatchObject({ lang: 'el', href: '/blog/el/gru-kms-windows/', translated: true });
      expect(result[2]).toMatchObject({ lang: 'tr', href: '/tr/post-not-translated/', translated: false });
    });

    it('tolerates missing altLinks argument', () => {
      const result = languageSwitcherOptions('/en-us/', supportedLocales);
      expect(result.map(o => o.translated)).toEqual([true, false, false]);
    });

    it('defaults the root URL to the first supported locale (en-us)', () => {
      const result = languageSwitcherOptions('/', supportedLocales, []);
      expect(result[0].current).toBe(true);
      expect(result[0].href).toBe('/');
    });

    it('attaches a flag and hreflang to each option', () => {
      const result = languageSwitcherOptions('/en-us/about/', supportedLocales, []);
      expect(result[0].flag).toBe('🇺🇸');
      expect(result[1].flag).toBe('🇬🇷');
      expect(result[2].flag).toBe('🇹🇷');
      expect(result[0].hreflang).toBe('en-US');
    });
  });
});