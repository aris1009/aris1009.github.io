import { describe, it, expect } from 'vitest';
import { supportedLocales, getLocale } from 'src/lib/global-data.js';

describe('global-data', () => {
  describe('supportedLocales', () => {
    it('should contain expected locales', () => {
      expect(supportedLocales).toEqual(['en-us', 'el', 'tr']);
    });
  });

  describe('getLocale', () => {
    it('should return Greek locale for Greek path', () => {
      const mockContext = {
        page: { filePathStem: '/blog/el/some-post' }
      };
      
      const localeFunction = getLocale();
      const result = localeFunction.call(mockContext);
      
      expect(result).toBe('el');
    });

    it('should return Turkish locale for Turkish path', () => {
      const mockContext = {
        page: { filePathStem: '/blog/tr/some-post' }
      };
      
      const localeFunction = getLocale();
      const result = localeFunction.call(mockContext);
      
      expect(result).toBe('tr');
    });

    it('should return default locale for English path', () => {
      const mockContext = {
        page: { filePathStem: '/blog/en-us/some-post' }
      };
      
      const localeFunction = getLocale();
      const result = localeFunction.call(mockContext);
      
      expect(result).toBe('en-us');
    });

    it('should return default locale for paths without locale', () => {
      const mockContext = {
        page: { filePathStem: '/about/index' }
      };
      
      const localeFunction = getLocale();
      const result = localeFunction.call(mockContext);
      
      expect(result).toBe('en-us');
    });

    it('should handle complex paths correctly', () => {
      const mockContext = {
        page: { filePathStem: '/some/deep/path/el/post' }
      };
      
      const localeFunction = getLocale();
      const result = localeFunction.call(mockContext);
      
      expect(result).toBe('el');
    });
  });
});