import { describe, it, expect } from 'vitest';
import {
  extractLanguagesFromContent,
  normalizeLanguage,
  getArticleSlug,
  addLanguageDependencies,
  CONFIG
} from '../../../scripts/detect-prism-languages.js';

describe('detect-prism-languages.js', () => {
  describe('extractLanguagesFromContent', () => {
    it('should extract language from simple code blocks', () => {
      const content = '```bash\necho "hello"\n```';
      const languages = extractLanguagesFromContent(content);
      expect(languages).toContain('bash');
    });

    it('should extract multiple languages from content', () => {
      const content = `
\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
x = 1
\`\`\`

\`\`\`bash
echo "test"
\`\`\`
      `;
      const languages = extractLanguagesFromContent(content);
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
      expect(languages).toContain('bash');
    });

    it('should normalize language aliases', () => {
      const content = '```sh\ncommand\n```';
      const languages = extractLanguagesFromContent(content);
      expect(languages).toContain('bash');
    });

    it('should skip mermaid blocks', () => {
      const content = '```mermaid\nflowchart LR\n  A --> B\n```';
      const languages = extractLanguagesFromContent(content);
      expect(languages.size).toBe(0);
    });

    it('should skip plain text blocks', () => {
      const content = `
\`\`\`text
plain text
\`\`\`

\`\`\`plaintext
more plain text
\`\`\`
      `;
      const languages = extractLanguagesFromContent(content);
      expect(languages.size).toBe(0);
    });

    it('should handle code blocks without language specifier', () => {
      const content = '```\nno language specified\n```';
      const languages = extractLanguagesFromContent(content);
      expect(languages.size).toBe(0);
    });

    it('should extract unique languages only', () => {
      const content = `
\`\`\`bash
echo 1
\`\`\`

\`\`\`bash
echo 2
\`\`\`
      `;
      const languages = extractLanguagesFromContent(content);
      expect(Array.from(languages)).toEqual(['bash']);
    });

    it('should handle real-world blog content', () => {
      const content = `
# curl | bash is BAD

You've seen this:

\`\`\`bash
curl -sL https://example.com/install.sh | bash
\`\`\`

Here's the detection logic:

\`\`\`python
def serve_script(connection):
    start = time.time()
    connection.send(detect_payload + padding)
    elapsed = time.time() - start
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant U as User
\`\`\`
      `;
      const languages = extractLanguagesFromContent(content);
      expect(languages).toContain('bash');
      expect(languages).toContain('python');
      expect(languages.has('mermaid')).toBe(false);
    });
  });

  describe('normalizeLanguage', () => {
    it('should normalize shell aliases to bash', () => {
      expect(normalizeLanguage('sh')).toBe('bash');
      expect(normalizeLanguage('shell')).toBe('bash');
      expect(normalizeLanguage('zsh')).toBe('bash');
    });

    it('should normalize yaml alias', () => {
      expect(normalizeLanguage('yml')).toBe('yaml');
    });

    it('should normalize markup aliases', () => {
      expect(normalizeLanguage('html')).toBe('markup');
      expect(normalizeLanguage('xml')).toBe('markup');
      expect(normalizeLanguage('svg')).toBe('markup');
    });

    it('should return unchanged if no alias exists', () => {
      expect(normalizeLanguage('javascript')).toBe('javascript');
      expect(normalizeLanguage('python')).toBe('python');
      expect(normalizeLanguage('rust')).toBe('rust');
    });
  });

  describe('getArticleSlug', () => {
    it('should extract slug from file path', () => {
      expect(getArticleSlug('/some/path/my-post.md')).toBe('my-post');
      expect(getArticleSlug('src/blog/en-us/curl-bash-security.md')).toBe('curl-bash-security');
    });

    it('should handle paths with multiple dots', () => {
      expect(getArticleSlug('/path/my.post.name.md')).toBe('my.post.name');
    });
  });

  describe('addLanguageDependencies', () => {
    it('should always include core languages', () => {
      const result = addLanguageDependencies([]);
      expect(result).toContain('markup');
      expect(result).toContain('css');
      expect(result).toContain('clike');
      expect(result).toContain('javascript');
    });

    it('should add typescript dependency on javascript', () => {
      const result = addLanguageDependencies(['typescript']);
      expect(result).toContain('typescript');
      expect(result).toContain('javascript');
    });

    it('should add bash dependency on clike', () => {
      const result = addLanguageDependencies(['bash']);
      expect(result).toContain('bash');
      expect(result).toContain('clike');
    });

    it('should add cpp dependencies', () => {
      const result = addLanguageDependencies(['cpp']);
      expect(result).toContain('cpp');
      expect(result).toContain('c');
      expect(result).toContain('clike');
    });

    it('should return sorted array', () => {
      const result = addLanguageDependencies(['python', 'bash']);
      expect(result).toEqual([...result].sort());
    });
  });

  describe('CONFIG', () => {
    it('should have required blog directories', () => {
      expect(CONFIG.blogDirs).toContain('src/blog/en-us');
      expect(CONFIG.blogDirs).toContain('src/blog/el');
      expect(CONFIG.blogDirs).toContain('src/blog/tr');
    });

    it('should have mermaid in skip languages', () => {
      expect(CONFIG.skipLanguages).toContain('mermaid');
    });

    it('should have core languages defined', () => {
      expect(CONFIG.coreLanguages).toContain('markup');
      expect(CONFIG.coreLanguages).toContain('css');
      expect(CONFIG.coreLanguages).toContain('clike');
      expect(CONFIG.coreLanguages).toContain('javascript');
    });
  });
});
