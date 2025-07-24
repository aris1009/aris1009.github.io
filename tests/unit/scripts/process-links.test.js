import { describe, it, expect } from 'vitest';
import {
  processExternalLinks,
  processInternalLinks,
  processDictionaryTerms,
  isExternalUrl,
  isMarkdownLinkAlreadyProcessed,
  CONFIG
} from '../../../scripts/process-links.js';

describe('process-links.js', () => {
  describe('isExternalUrl', () => {
    it('should identify external HTTP URLs as external', () => {
      expect(isExternalUrl('https://example.com')).toBe(true);
      expect(isExternalUrl('http://example.com')).toBe(true);
    });

    it('should identify localhost as internal', () => {
      expect(isExternalUrl('http://localhost')).toBe(false);
      expect(isExternalUrl('https://localhost:3000')).toBe(false);
      expect(isExternalUrl('http://127.0.0.1')).toBe(false);
    });

    it('should identify relative paths as internal', () => {
      expect(isExternalUrl('/blog/post')).toBe(false);
      expect(isExternalUrl('./relative')).toBe(false);
      expect(isExternalUrl('../parent')).toBe(false);
    });

    it('should handle malformed URLs gracefully', () => {
      // Malformed URLs that can't be parsed as URLs are treated as external
      // since they don't match internal path patterns
      expect(isExternalUrl('not-a-url')).toBe(true);
      expect(isExternalUrl('')).toBe(true);
    });
  });

  describe('isMarkdownLinkAlreadyProcessed', () => {
    it('should detect already processed links', () => {
      const alreadyProcessed = '{% externalLink "text", "url" %}';
      expect(isMarkdownLinkAlreadyProcessed(alreadyProcessed)).toBe(true);
    });

    it('should detect internal links as processed', () => {
      const internalProcessed = '{% internalLink "text", "url" %}';
      expect(isMarkdownLinkAlreadyProcessed(internalProcessed)).toBe(true);
    });

    it('should detect dictionary links as processed', () => {
      const dictionaryProcessed = '{% dictionaryLink "text", "term" %}';
      expect(isMarkdownLinkAlreadyProcessed(dictionaryProcessed)).toBe(true);
    });

    it('should not detect regular markdown links as processed', () => {
      const regularLink = '[text](url)';
      expect(isMarkdownLinkAlreadyProcessed(regularLink)).toBe(false);
    });
  });

  describe('processExternalLinks', () => {
    it('should convert simple external links to shortcodes', () => {
      const input = 'Check out [Google](https://www.google.com) for search.';
      const expected = 'Check out {% externalLink "Google", "https://www.google.com" %} for search.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle URLs with parentheses correctly', () => {
      const input = 'The [Russian GRU](https://en.wikipedia.org/wiki/GRU_(Russian_Federation)) is a military intelligence agency.';
      const expected = 'The {% externalLink "Russian GRU", "https://en.wikipedia.org/wiki/GRU_(Russian_Federation)" %} is a military intelligence agency.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle multiple URLs with parentheses on the same line', () => {
      const input = 'See [GRU](https://en.wikipedia.org/wiki/GRU_(Russian_Federation)) and [SVR](https://en.wikipedia.org/wiki/Foreign_Intelligence_Service_(Russia)) agencies.';
      const expected = 'See {% externalLink "GRU", "https://en.wikipedia.org/wiki/GRU_(Russian_Federation)" %} and {% externalLink "SVR", "https://en.wikipedia.org/wiki/Foreign_Intelligence_Service_(Russia)" %} agencies.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle nested parentheses in URLs (current limitation)', () => {
      // Note: Current regex only handles one level of parentheses
      // This test documents the current behavior - URLs with multiple levels of 
      // nested parentheses will have the outer closing parenthesis left outside
      const input = 'Complex [URL](https://example.com/path_(with_(nested)_parentheses)) test.';
      const expected = 'Complex {% externalLink "URL", "https://example.com/path_(with_(nested)_parentheses" %}) test.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle URLs with query parameters and fragments', () => {
      const input = 'Search [results](https://example.com/search?q=test&lang=en#results) here.';
      const expected = 'Search {% externalLink "results", "https://example.com/search?q=test&lang=en#results" %} here.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should escape quotes in link text', () => {
      const input = 'Read ["Important" Article](https://example.com) now.';
      const expected = 'Read {% externalLink "\\"Important\\" Article", "https://example.com" %} now.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle URLs with special characters', () => {
      const input = 'Check [special chars](https://example.com/path?query=value&other=test#anchor) link.';
      const expected = 'Check {% externalLink "special chars", "https://example.com/path?query=value&other=test#anchor" %} link.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle malformed URLs starting with <', () => {
      const input = 'Malformed [link](<https://example.com) test.';
      // The function should clean up the < prefix
      const result = processExternalLinks(input);
      expect(result).toContain('https://example.com');
      expect(result).not.toContain('<https://');
    });

    it('should not process internal links', () => {
      const input = 'Internal [link](/blog/post) should remain unchanged.';
      expect(processExternalLinks(input)).toBe(input);
    });

    it('should not process relative links', () => {
      const input = 'Relative [link](./relative/path) should remain unchanged.';
      expect(processExternalLinks(input)).toBe(input);
    });

    it('should not process already processed shortcodes', () => {
      const input = 'Already {% externalLink "processed", "https://example.com" %} link.';
      expect(processExternalLinks(input)).toBe(input);
    });

    it('should handle mixed content with both external and internal links', () => {
      const input = 'External [Google](https://google.com) and internal [blog](/blog) links.';
      const expected = 'External {% externalLink "Google", "https://google.com" %} and internal [blog](/blog) links.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle Greek text correctly', () => {
      const input = 'Στα τέλη του 2023, η [ρωσική GRU](https://en.wikipedia.org/wiki/GRU_(Russian_Federation)) ξεκίνησε μια εκστρατεία.';
      const expected = 'Στα τέλη του 2023, η {% externalLink "ρωσική GRU", "https://en.wikipedia.org/wiki/GRU_(Russian_Federation)" %} ξεκίνησε μια εκστρατεία.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle Turkish text correctly', () => {
      const input = 'Türkçe [bağlantı](https://example.com) metni.';
      const expected = 'Türkçe {% externalLink "bağlantı", "https://example.com" %} metni.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle multiple links in one line', () => {
      const input = 'Visit [Google](https://google.com) and [GitHub](https://github.com) today.';
      const expected = 'Visit {% externalLink "Google", "https://google.com" %} and {% externalLink "GitHub", "https://github.com" %} today.';
      expect(processExternalLinks(input)).toBe(expected);
    });

    it('should handle empty or minimal content', () => {
      expect(processExternalLinks('')).toBe('');
      expect(processExternalLinks('No links here')).toBe('No links here');
    });

    it('should preserve whitespace and formatting', () => {
      const input = '   [Google](https://google.com)   ';
      const expected = '   {% externalLink "Google", "https://google.com" %}   ';
      expect(processExternalLinks(input)).toBe(expected);
    });
  });

  describe('processInternalLinks', () => {
    it('should convert internal paths to internal link shortcodes', () => {
      const input = 'Read my [blog post](/blog/article) here.';
      const expected = 'Read my {% internalLink "blog post", "/blog/article" %} here.';
      expect(processInternalLinks(input)).toBe(expected);
    });

    it('should convert relative paths to internal link shortcodes', () => {
      const input = 'See [relative link](./page) and [parent link](../parent).';
      const expected = 'See {% internalLink "relative link", "./page" %} and {% internalLink "parent link", "../parent" %}.';
      expect(processInternalLinks(input)).toBe(expected);
    });

    it('should not process external URLs', () => {
      const input = 'External [link](https://example.com) unchanged.';
      expect(processInternalLinks(input)).toBe(input);
    });

    it('should not process already processed shortcodes', () => {
      const input = 'Already {% internalLink "processed", "/blog" %} link.';
      expect(processInternalLinks(input)).toBe(input);
    });

    it('should escape quotes in link text', () => {
      const input = 'Internal ["quoted" link](/blog/post) test.';
      const expected = 'Internal {% internalLink "\\"quoted\\" link", "/blog/post" %} test.';
      expect(processInternalLinks(input)).toBe(expected);
    });
  });

  describe('processDictionaryTerms', () => {
    // Note: These tests will need to be updated based on actual dictionary terms
    // For now, we'll test the general functionality
    
    it('should return unchanged content when dictionary detection is disabled', () => {
      const originalEnabled = CONFIG.dictionaryDetection.enabled;
      CONFIG.dictionaryDetection.enabled = false;
      
      const input = 'Some text with potential terms.';
      expect(processDictionaryTerms(input)).toBe(input);
      
      CONFIG.dictionaryDetection.enabled = originalEnabled;
    });

    it('should not process lines that already contain shortcodes', () => {
      const input = 'Line with {% externalLink "link", "url" %} should not be processed.';
      expect(processDictionaryTerms(input)).toBe(input);
    });

    it('should not process lines with markdown links', () => {
      const input = 'Line with [markdown link](url) should not be processed.';
      expect(processDictionaryTerms(input)).toBe(input);
    });

    it('should skip terms shorter than minimum length', () => {
      const originalMinLength = CONFIG.dictionaryDetection.minWordLength;
      CONFIG.dictionaryDetection.minWordLength = 5;
      
      // Assuming we have a short term that would normally match
      const input = 'Short term test.';
      // Should not process terms shorter than 5 characters
      expect(processDictionaryTerms(input)).toBe(input);
      
      CONFIG.dictionaryDetection.minWordLength = originalMinLength;
    });

    it('should skip excluded words', () => {
      const input = 'The word "and" should not be processed even if in dictionary.';
      // "and" is in the excluded words list
      expect(processDictionaryTerms(input)).not.toContain('dictionaryLink');
    });
  });

  describe('Edge Cases and Regression Tests', () => {
    it('should handle the original GRU parentheses bug', () => {
      // This is the exact case that was failing before the fix
      const input = '[ρωσική GRU](https://en.wikipedia.org/wiki/GRU_(Russian_Federation))';
      const result = processExternalLinks(input);
      
      // Should capture the complete URL including the final closing parenthesis
      expect(result).toContain('GRU_(Russian_Federation)"');
      expect(result).not.toContain('GRU_(Russian_Federation"'); // Should not be missing the final )
      expect(result).not.toContain('})'); // Should not have hanging }) outside shortcode
    });

    it('should handle Wikipedia URLs with parentheses in different languages', () => {
      const testCases = [
        {
          input: '[English](https://en.wikipedia.org/wiki/Article_(disambiguation))',
          expected: '{% externalLink "English", "https://en.wikipedia.org/wiki/Article_(disambiguation)" %}'
        },
        {
          input: '[French](https://fr.wikipedia.org/wiki/Article_(homonymie))',
          expected: '{% externalLink "French", "https://fr.wikipedia.org/wiki/Article_(homonymie)" %}'
        },
        {
          input: '[German](https://de.wikipedia.org/wiki/Artikel_(Begriffsklärung))',
          expected: '{% externalLink "German", "https://de.wikipedia.org/wiki/Artikel_(Begriffsklärung)" %}'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(processExternalLinks(input)).toBe(expected);
      });
    });

    it('should handle URLs with multiple levels of parentheses (current limitation)', () => {
      // Note: Current regex handles only one level of parentheses
      // Multiple nested levels will leave outer parentheses outside the shortcode
      const input = '[Complex](https://example.com/path_(level1_(level2)_end)) test.';
      const result = processExternalLinks(input);
      
      expect(result).toContain('path_(level1_(level2)_end"');
      expect(result).toContain('}) test'); // The closing ) is left outside
    });

    it('should handle URLs with parentheses at the very end', () => {
      const input = '[Test](https://example.com/path_(end))';
      const result = processExternalLinks(input);
      
      expect(result).toBe('{% externalLink "Test", "https://example.com/path_(end)" %}');
    });

    it('should handle mixed parentheses and other special characters (current limitation)', () => {
      // Note: Current regex stops at the first unbalanced closing parenthesis
      // Complex URLs with multiple parentheses in different parts may be cut off
      const input = '[Mixed](https://example.com/path_(test)?query=value&other=(param)#section_(1)) content.';
      const result = processExternalLinks(input);
      
      expect(result).toContain('other=(param"');
      expect(result).toContain('#section_(1)) content'); // Fragment with parentheses left outside
    });

    it('should preserve content after links correctly', () => {
      const input = 'Before [link](https://example.com/path_(test)) after text.';
      const result = processExternalLinks(input);
      
      expect(result).toBe('Before {% externalLink "link", "https://example.com/path_(test)" %} after text.');
    });
  });

  describe('Performance and Boundary Cases', () => {
    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000) + '_(test)';
      const input = `[Long URL](${longUrl})`;
      const result = processExternalLinks(input);
      
      expect(result).toContain(longUrl + '"');
    });

    it('should handle many links in one text block', () => {
      const links = Array.from({ length: 50 }, (_, i) => 
        `[Link ${i}](https://example${i}.com/path_(${i}))`
      ).join(' ');
      
      const result = processExternalLinks(links);
      
      // Should process all links
      expect(result.split('externalLink').length - 1).toBe(50);
      
      // Should not have any hanging parentheses
      expect(result).not.toContain('})');
    });

    it('should handle empty parentheses in URLs', () => {
      const input = '[Empty](https://example.com/path_()) test.';
      const result = processExternalLinks(input);
      
      expect(result).toBe('{% externalLink "Empty", "https://example.com/path_()" %} test.');
    });

    it('should handle URLs with only opening parenthesis (malformed)', () => {
      const input = '[Malformed](https://example.com/path_(incomplete) test.';
      const result = processExternalLinks(input);
      
      // Should still process correctly even with malformed parentheses
      expect(result).toContain('externalLink');
    });
  });
});