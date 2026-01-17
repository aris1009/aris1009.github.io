import { describe, it, expect } from 'vitest';
import {
  processExternalLinks,
  processInternalLinks,
  processDictionaryTerms,
  isExternalUrl,
  isMarkdownLinkAlreadyProcessed,
  separateFrontmatter,
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

  describe('separateFrontmatter', () => {
    it('should separate standard frontmatter from body', () => {
      const content = `---
title: "Test Post"
date: 2024-01-01
---
This is the body content.`;

      const { frontmatter, body } = separateFrontmatter(content);

      expect(frontmatter).toBe(`---
title: "Test Post"
date: 2024-01-01
---
`);
      expect(body).toBe('This is the body content.');
    });

    it('should handle content without frontmatter', () => {
      const content = 'Just body content without frontmatter.';

      const { frontmatter, body } = separateFrontmatter(content);

      expect(frontmatter).toBe('');
      expect(body).toBe(content);
    });

    it('should preserve frontmatter with permalink containing terms', () => {
      const content = `---
title: "Great Firewall Article"
permalink: /blog/el/great-firewall-wallbleed/
locale: el
---
Body text with firewall term.`;

      const { frontmatter, body } = separateFrontmatter(content);

      expect(frontmatter).toContain('permalink: /blog/el/great-firewall-wallbleed/');
      expect(frontmatter).not.toContain('dictionaryLink');
      expect(body).toBe('Body text with firewall term.');
    });

    it('should not process dictionary terms in frontmatter', () => {
      const content = `---
title: "Encryption Best Practices"
description: "Learn about encryption and firewall security"
permalink: /blog/encryption-guide/
---
This article covers encryption basics.`;

      const { frontmatter, body } = separateFrontmatter(content);

      // Frontmatter should remain untouched
      expect(frontmatter).toContain('title: "Encryption Best Practices"');
      expect(frontmatter).toContain('description: "Learn about encryption and firewall security"');
      expect(frontmatter).not.toContain('dictionaryLink');

      // Only body should be processed
      const processedBody = processDictionaryTerms(body);
      expect(processedBody).toContain('dictionaryLink');
    });

    it('should handle frontmatter with complex YAML values', () => {
      const content = `---
title: "API Security"
tags:
  - security
  - api
  - encryption
keywords: firewall, malware, phishing
---
Article body here.`;

      const { frontmatter, body } = separateFrontmatter(content);

      expect(frontmatter).toContain('keywords: firewall, malware, phishing');
      expect(body).toBe('Article body here.');
    });

    it('should handle frontmatter with multiline strings', () => {
      const content = `---
title: "Test"
description: |
  This is a multiline
  description with encryption
  and firewall terms.
---
Body content.`;

      const { frontmatter, body } = separateFrontmatter(content);

      expect(frontmatter).toContain('encryption');
      expect(frontmatter).toContain('firewall');
      expect(body).toBe('Body content.');
    });

    it('should handle empty frontmatter as no frontmatter', () => {
      // Edge case: empty frontmatter (---\n---) doesn't match the regex pattern
      // This is acceptable as empty frontmatter is not meaningful
      const content = `---
---
Body only.`;

      const { frontmatter, body } = separateFrontmatter(content);

      // Empty frontmatter is treated as no frontmatter
      expect(frontmatter).toBe('');
      expect(body).toBe(content);
    });

    it('should not be confused by --- in body content', () => {
      const content = `---
title: "Test"
---
Body with --- horizontal rule.

---

More content.`;

      const { frontmatter, body } = separateFrontmatter(content);

      expect(frontmatter).toBe(`---
title: "Test"
---
`);
      expect(body).toContain('Body with --- horizontal rule.');
      expect(body).toContain('More content.');
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

    describe('Image Link Exclusion', () => {
      it('should not process external image links', () => {
        const input = 'Check out this image: ![Claude Code in action](https://example.com/image.png "Title")';
        expect(processExternalLinks(input)).toBe(input);
      });

      it('should not process internal image links', () => {
        const input = 'Local image: ![Local image](/_static/img/claude-code.png "Claude Code in action")';
        expect(processExternalLinks(input)).toBe(input);
      });

      it('should process regular links but ignore image links in same content', () => {
        const input = 'Visit [Google](https://google.com) and see ![Image](https://example.com/img.png).';
        const expected = 'Visit {% externalLink "Google", "https://google.com" %} and see ![Image](https://example.com/img.png).';
        expect(processExternalLinks(input)).toBe(expected);
      });

      it('should handle multiple image links without processing them', () => {
        const input = '![First](https://example.com/1.png) and ![Second](https://example.com/2.jpg)';
        expect(processExternalLinks(input)).toBe(input);
      });

      it('should handle image links with complex URLs (parentheses)', () => {
        const input = '![Wikipedia Image](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/GRU_(Russian_Federation).svg/220px-GRU_(Russian_Federation).svg.png)';
        expect(processExternalLinks(input)).toBe(input);
      });

      it('should handle mixed content with both images and regular links', () => {
        const input = `Check out this article [about security](https://security.com) and see this diagram:
![Security Diagram](https://example.com/diagram.png "Security Overview")
Also visit [another resource](https://resource.com).`;
        
        const expected = `Check out this article {% externalLink "about security", "https://security.com" %} and see this diagram:
![Security Diagram](https://example.com/diagram.png "Security Overview")
Also visit {% externalLink "another resource", "https://resource.com" %}.`;
        
        expect(processExternalLinks(input)).toBe(expected);
      });

      it('should handle image links with alt text containing brackets', () => {
        const input = '![Image [with brackets]](https://example.com/image.png)';
        expect(processExternalLinks(input)).toBe(input);
      });

      it('should handle image links with special characters in alt text', () => {
        const input = '![Image "with quotes" & special chars](https://example.com/image.png)';
        expect(processExternalLinks(input)).toBe(input);
      });

      it('should handle relative image paths', () => {
        const input = '![Relative image](./images/local.png)';
        expect(processExternalLinks(input)).toBe(input);
      });

      it('should handle absolute internal image paths', () => {
        const input = '![Internal image](/_static/img/screenshot.png)';
        expect(processExternalLinks(input)).toBe(input);
      });
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

    describe('Image Link Exclusion for Internal Links', () => {
      it('should not process internal image links', () => {
        const input = 'Local image: ![Local image](/_static/img/claude-code.png "Claude Code in action")';
        expect(processInternalLinks(input)).toBe(input);
      });

      it('should not process relative image links', () => {
        const input = 'Relative image: ![Relative image](./images/local.png)';
        expect(processInternalLinks(input)).toBe(input);
      });

      it('should process regular internal links but ignore image links', () => {
        const input = 'Visit [my blog](/blog) and see ![screenshot](/_static/img/screen.png).';
        const expected = 'Visit {% internalLink "my blog", "/blog" %} and see ![screenshot](/_static/img/screen.png).';
        expect(processInternalLinks(input)).toBe(expected);
      });

      it('should handle multiple internal image links without processing them', () => {
        const input = '![First](/_static/img/1.png) and ![Second](./images/2.jpg)';
        expect(processInternalLinks(input)).toBe(input);
      });

      it('should handle mixed internal content with both images and regular links', () => {
        const input = `Read [my article](/blog/article) and see this image:
![Article Image](/_static/img/article.png "Article Overview")
Also check [another page](./other).`;
        
        const expected = `Read {% internalLink "my article", "/blog/article" %} and see this image:
![Article Image](/_static/img/article.png "Article Overview")
Also check {% internalLink "another page", "./other" %}.`;
        
        expect(processInternalLinks(input)).toBe(expected);
      });
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

    it('should not process dictionary terms inside code blocks', () => {
      const input = `Text with encryption term.

\`\`\`javascript
function encrypt(data) {
  return encryption.encode(data);
}
\`\`\`

More encryption text.`;
      
      const result = processDictionaryTerms(input);
      
      // Should process terms outside code blocks
      expect(result).toContain('{% dictionaryLink "encryption", "encryption" %}');
      
      // Should NOT process terms inside code blocks
      const codeBlockMatch = result.match(/```javascript[\s\S]*?```/);
      expect(codeBlockMatch).toBeTruthy();
      expect(codeBlockMatch[0]).not.toContain('dictionaryLink');
      expect(codeBlockMatch[0]).toContain('return encryption.encode(data);');
    });

    it('should handle multiple code blocks correctly', () => {
      const input = `First encryption text.

\`\`\`bash
# This encryption should not be processed
openssl enc -aes-256-cbc -in file.txt
\`\`\`

Middle encryption text.

\`\`\`python
def encrypt_data(data):
    # encryption logic here
    return encrypted
\`\`\`

Final encryption text.`;
      
      const result = processDictionaryTerms(input);
      
      // Should process terms outside all code blocks (3 occurrences)
      const outsideMatches = result.match(/{% dictionaryLink "encryption", "encryption" %}/g);
      expect(outsideMatches).toHaveLength(3);
      
      // Should not process terms inside either code block
      const bashBlock = result.match(/```bash[\s\S]*?```/);
      const pythonBlock = result.match(/```python[\s\S]*?```/);
      
      expect(bashBlock[0]).not.toContain('dictionaryLink');
      expect(pythonBlock[0]).not.toContain('dictionaryLink');
      expect(bashBlock[0]).toContain('# This encryption should not be processed');
      expect(pythonBlock[0]).toContain('# encryption logic here');
    });

    it('should handle code blocks with languages specified', () => {
      const input = `Text with encryption.

\`\`\`typescript
interface EncryptionService {
  encrypt(data: string): string;
}
\`\`\`

More encryption text.`;
      
      const result = processDictionaryTerms(input);
      
      const codeBlock = result.match(/```typescript[\s\S]*?```/);
      expect(codeBlock[0]).not.toContain('dictionaryLink');
      expect(codeBlock[0]).toContain('encrypt(data: string)');
    });

    it('should handle nested code blocks and mixed content', () => {
      const input = `Regular encryption text.

\`\`\`markdown
# Documentation

Some text about encryption here.

\`\`\`javascript
const encryption = require('crypto');
\`\`\`
\`\`\`

Final encryption text.`;
      
      const result = processDictionaryTerms(input);
      
      // Should process terms outside code blocks
      expect(result).toContain('Regular {% dictionaryLink "encryption", "encryption" %} text.');
      expect(result).toContain('Final {% dictionaryLink "encryption", "encryption" %} text.');
      
      // Should not process terms inside the code block
      const codeBlock = result.match(/```markdown[\s\S]*?```/);
      expect(codeBlock[0]).not.toContain('dictionaryLink');
      expect(codeBlock[0]).toContain('Some text about encryption here.');
    });

    it('should handle code blocks without language specification', () => {
      const input = `Text with encryption.

\`\`\`
function processEncryption() {
  // encryption code
}
\`\`\`

More encryption text.`;
      
      const result = processDictionaryTerms(input);
      
      const codeBlock = result.match(/```\n[\s\S]*?```/);
      expect(codeBlock[0]).not.toContain('dictionaryLink');
      expect(codeBlock[0]).toContain('// encryption code');
    });

    it('should handle single-line code blocks', () => {
      const input = `Text with encryption.
\`\`\`
const key = generateEncryptionKey();
\`\`\`
More encryption text.`;
      
      const result = processDictionaryTerms(input);
      
      const codeBlock = result.match(/```[\s\S]*?```/);
      expect(codeBlock[0]).not.toContain('dictionaryLink');
      expect(codeBlock[0]).toContain('generateEncryptionKey()');
    });

    it('should handle malformed code blocks gracefully', () => {
      const input = `Text with encryption.

\`\`\`javascript
function test() {
  return encryption;
}
// Missing closing backticks

More encryption text.`;
      
      const result = processDictionaryTerms(input);
      
      // Should still process the first occurrence
      expect(result).toContain('Text with {% dictionaryLink "encryption", "encryption" %}.');
      
      // The malformed block should not be processed as it's considered inside the code block
      expect(result).toContain('return encryption;');
      expect(result).not.toContain('return {% dictionaryLink "encryption", "encryption" %};');
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

    it('should not process the Claude Code image link mentioned in the bug report', () => {
      // This is the exact case that was failing - image links being incorrectly processed
      const input = '![Claude Code in action](/_static/img/claude-code.png "Claude Code in action")';
      
      // Should remain completely unchanged
      expect(processExternalLinks(input)).toBe(input);
      expect(processInternalLinks(input)).toBe(input);
      
      // Should not contain any shortcode syntax
      expect(processExternalLinks(input)).not.toContain('externalLink');
      expect(processExternalLinks(input)).not.toContain('internalLink');
      expect(processInternalLinks(input)).not.toContain('externalLink');
      expect(processInternalLinks(input)).not.toContain('internalLink');
    });

    it('should handle content with both Claude Code image and regular links', () => {
      const input = `Here's how to use Claude Code:

![Claude Code in action](/_static/img/claude-code.png "Claude Code in action")

You can read more about it in the [documentation](https://docs.anthropic.com) or visit [our website](https://anthropic.com).`;

      const expectedExternal = `Here's how to use Claude Code:

![Claude Code in action](/_static/img/claude-code.png "Claude Code in action")

You can read more about it in the {% externalLink "documentation", "https://docs.anthropic.com" %} or visit {% externalLink "our website", "https://anthropic.com" %}.`;

      expect(processExternalLinks(input)).toBe(expectedExternal);
      
      // The image should still be unchanged after processing
      expect(processExternalLinks(input)).toContain('![Claude Code in action](/_static/img/claude-code.png "Claude Code in action")');
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