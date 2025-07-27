import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

/**
 * Test suite to validate that all code blocks in blog posts have language specifiers
 * 
 * This ensures proper syntax highlighting with Prism.js and prevents unstyled code blocks.
 * The test is blog-agnostic and will work with current and future blog posts.
 */

/**
 * Recursively finds all .md files in a directory
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of markdown file paths
 */
function findMarkdownFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (stat.isFile() && extname(entry) === '.md') {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Validates code blocks in markdown content
 * @param {string} content - Markdown content to validate
 * @param {string} filePath - File path for error reporting
 * @returns {object} Validation result with issues array
 */
function validateCodeBlocks(content, filePath) {
  const lines = content.split('\n');
  const issues = [];
  let inCodeBlock = false;
  let codeBlockStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Check for opening triple backticks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Starting a code block
        inCodeBlock = true;
        codeBlockStart = lineNumber;
        
        // Extract language specifier (everything after ```)
        const languageMatch = line.trim().match(/^```(.*)$/);
        const language = languageMatch ? languageMatch[1].trim() : '';
        
        // Check if language specifier is missing or empty
        if (!language) {
          issues.push({
            line: lineNumber,
            issue: 'Code block missing language specifier',
            codeBlock: line.trim(),
            suggestion: 'Add a language specifier like ```javascript, ```css, ```bash, etc.'
          });
        }
      } else {
        // Ending a code block
        inCodeBlock = false;
        codeBlockStart = -1;
      }
    }
  }
  
  // Check for unclosed code blocks
  if (inCodeBlock) {
    issues.push({
      line: codeBlockStart,
      issue: 'Unclosed code block',
      codeBlock: '```',
      suggestion: 'Add closing ``` to complete the code block'
    });
  }
  
  return {
    filePath,
    issues,
    valid: issues.length === 0
  };
}

describe('Blog Post Code Blocks', () => {
  const blogDir = join(process.cwd(), 'src', 'blog');
  const markdownFiles = findMarkdownFiles(blogDir);
  
  it('should find at least one blog post', () => {
    expect(markdownFiles.length).toBeGreaterThan(0);
  });
  
  describe('Language Specifiers', () => {
    // Create a test for each blog post file
    markdownFiles.forEach(filePath => {
      const relativePath = filePath.replace(process.cwd(), '');
      
      it(`should have language specifiers for all code blocks in ${relativePath}`, () => {
        const content = readFileSync(filePath, 'utf-8');
        const validation = validateCodeBlocks(content, relativePath);
        
        if (!validation.valid) {
          // Create detailed error message
          const errorDetails = validation.issues.map(issue => 
            `Line ${issue.line}: ${issue.issue}\n` +
            `  Code: ${issue.codeBlock}\n` +
            `  Suggestion: ${issue.suggestion}`
          ).join('\n\n');
          
          throw new Error(
            `Code block validation failed for ${relativePath}:\n\n${errorDetails}\n\n` +
            `Found ${validation.issues.length} issue(s). All code blocks must have language specifiers ` +
            `for proper syntax highlighting.`
          );
        }
        
        expect(validation.valid).toBe(true);
      });
    });
  });
  
  describe('Code Block Structure', () => {
    markdownFiles.forEach(filePath => {
      const relativePath = filePath.replace(process.cwd(), '');
      
      it(`should have properly paired code blocks in ${relativePath}`, () => {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        let codeBlockCount = 0;
        const codeBlockLines = [];
        
        lines.forEach((line, index) => {
          if (line.trim().startsWith('```')) {
            codeBlockCount++;
            codeBlockLines.push(index + 1);
          }
        });
        
        // Code blocks should be paired (even number)
        if (codeBlockCount % 2 !== 0) {
          throw new Error(
            `Unpaired code blocks in ${relativePath}. ` +
            `Found ${codeBlockCount} triple backticks at lines: ${codeBlockLines.join(', ')}. ` +
            `Code blocks must be properly opened and closed.`
          );
        }
        
        expect(codeBlockCount % 2).toBe(0);
      });
    });
  });
});