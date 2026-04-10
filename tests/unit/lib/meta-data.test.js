import { describe, it, expect } from 'vitest';
import meta from 'src/_data/meta.js';

/**
 * Tests for meta.js data file — catches typos in property names.
 * Audit bug blog-0y7.
 */

describe('meta.js data', () => {
  describe('blog-0y7: property name typos', () => {
    it('should have telegramUser (not telegramkUser)', () => {
      expect(meta).toHaveProperty('telegramUser');
      expect(meta).not.toHaveProperty('telegramkUser');
    });

    it('should have linkedinUser (not linkedinkUser)', () => {
      expect(meta).toHaveProperty('linkedinUser');
      expect(meta).not.toHaveProperty('linkedinkUser');
    });
  });

  describe('social property names are consistent', () => {
    it('should have twitterUser property', () => {
      expect(meta).toHaveProperty('twitterUser');
    });

    it('should have facebookUser property', () => {
      expect(meta).toHaveProperty('facebookUser');
    });

    it('should have githubUser property', () => {
      expect(meta).toHaveProperty('githubUser');
    });
  });
});
