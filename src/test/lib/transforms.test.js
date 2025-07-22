import { describe, it, expect } from 'vitest';
import { htmlminTransform } from '../../lib/transforms.js';

describe('transforms', () => {
  describe('htmlminTransform', () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <!-- This is a comment -->
          <title>Test</title>
        </head>
        <body>
          <h1>Hello World</h1>
        </body>
      </html>
    `;

    it('should minify HTML content for .html files', () => {
      const result = htmlminTransform(htmlContent, '/path/to/file.html');
      
      expect(result).not.toContain('<!-- This is a comment -->');
      expect(result).not.toContain('\n      ');
      expect(result).toContain('<!doctype html>');
      expect(result).toContain('<title>Test</title>');
    });

    it('should return content unchanged for non-HTML files', () => {
      const result = htmlminTransform(htmlContent, '/path/to/file.css');
      expect(result).toBe(htmlContent);
    });

    it('should return content unchanged when outputPath is null', () => {
      const result = htmlminTransform(htmlContent, null);
      expect(result).toBe(htmlContent);
    });

    it('should return content unchanged when outputPath is undefined', () => {
      const result = htmlminTransform(htmlContent, undefined);
      expect(result).toBe(htmlContent);
    });

    it('should handle empty content', () => {
      const result = htmlminTransform('', '/path/to/file.html');
      expect(result).toBe('');
    });
  });
});