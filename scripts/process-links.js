#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Link Processing Helper Script for Blog Posts
 * 
 * This script processes blog posts and transforms links into appropriate shortcodes:
 * - External URLs -> {% externalLink %}
 * - Internal paths -> {% internalLink %}
 * - Dictionary terms -> {% dictionaryLink %}
 */

// Load dictionary terms for dictionary link detection
const DICTIONARY_PATH = path.join(__dirname, '..', 'src', '_data', 'dictionary.js');
let dictionaryTerms = [];

try {
  const dictionary = (await import(DICTIONARY_PATH)).default;
  dictionaryTerms = Object.keys(dictionary);
} catch (error) {
  console.warn('Warning: Could not load dictionary terms:', error.message);
}

// Configuration
const CONFIG = {
  // Blog post directories to process
  blogDirs: ['src/blog/en-us', 'src/blog/el', 'src/blog/tr'],
  
  // Internal domain patterns (for detecting internal vs external links)
  internalDomains: [
    'localhost',
    '127.0.0.1',
    // Add your production domain when available
  ],
  
  // Internal path patterns
  internalPathPatterns: [
    /^\/[^\/]/,  // Paths starting with / but not //
    /^\.\.?\//,  // Relative paths starting with ./ or ../
  ],
  
  // Skip processing if these shortcodes are already present
  skipIfHasShortcodes: true,
  
  // Dictionary term detection settings
  dictionaryDetection: {
    enabled: true,
    caseSensitive: false,
    minWordLength: 3,
    // Words to exclude from dictionary detection (common words that might match)
    excludeWords: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
  }
};

/**
 * Check if a URL is external
 */
function isExternalUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's an internal domain
    return !CONFIG.internalDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (error) {
    // If URL parsing fails, check for internal path patterns
    return !CONFIG.internalPathPatterns.some(pattern => pattern.test(url));
  }
}

// Note: hasExistingShortcodes was removed as individual link processing is now preferred

/**
 * Check if a specific markdown link is already wrapped in any shortcode
 * This now checks the specific match context rather than the entire content
 */
function isMarkdownLinkAlreadyProcessed(match) {
  // Check if this specific match text already contains shortcode syntax
  // This prevents double-processing the same link, but allows duplicate URLs
  // in different contexts (like references in text vs sources section)
  return /{%\s*(externalLink|internalLink|dictionaryLink)\s/.test(match);
}

/**
 * Process external links - convert markdown links to externalLink shortcodes
 */
function processExternalLinks(content) {
  // Match markdown links: [text](url) - handle complex URLs including those with parentheses
  // This regex handles both URLs with and without parentheses by using alternation
  // Important: Uses negative lookbehind (?<!\!) to exclude image links that start with ![
  const markdownLinkRegex = /(?<!\!)\[([^\]]+)\]\(([^)]+\([^)]*\)[^)]*|[^)]+)\)/g;
  
  return content.replace(markdownLinkRegex, (match, text, url) => {
    // Clean up the URL (remove any extra whitespace)
    url = url.trim();
    
    // Handle malformed URLs like <https://example.com) by removing the leading <
    if (url.startsWith('<') && !url.endsWith('>')) {
      url = url.substring(1);
    }
    
    // Skip if this specific link is already processed in a shortcode
    if (isMarkdownLinkAlreadyProcessed(match)) {
      return match;
    }
    
    if (isExternalUrl(url)) {
      // Escape quotes in text to prevent issues
      const escapedText = text.replace(/"/g, '\\"');
      return `{% externalLink "${escapedText}", "${url}" %}`;
    }
    
    // Return original if not external
    return match;
  });
}

/**
 * Process internal links - convert markdown links to internalLink shortcodes
 */
function processInternalLinks(content) {
  // Match markdown links: [text](url) - exclude image links that start with ![
  // Important: Uses negative lookbehind (?<!\!) to exclude image links that start with ![
  const markdownLinkRegex = /(?<!\!)\[([^\]]+)\]\(([^)]+)\)/g;
  
  return content.replace(markdownLinkRegex, (match, text, url) => {
    // Clean up the URL
    url = url.trim();
    
    // Skip if this specific link is already processed in a shortcode
    if (isMarkdownLinkAlreadyProcessed(match)) {
      return match;
    }
    
    if (!isExternalUrl(url)) {
      // Escape quotes in text to prevent issues
      const escapedText = text.replace(/"/g, '\\"');
      return `{% internalLink "${escapedText}", "${url}" %}`;
    }
    
    // Return original if not internal
    return match;
  });
}

/**
 * Regex that matches protected zones within a line — content that should never
 * have dictionary terms injected into it. Matches left-to-right; the first
 * branch that wins is the one we keep verbatim.
 *
 * Order matters — longer/greedier patterns first:
 *   1. Nunjucks shortcodes:  {% ... %}
 *   2. Inline code spans:    `...`
 *   3. Markdown links/images: [text](url) or ![alt](url)
 *   4. Bare URLs:            https://… until whitespace
 */
const PROTECTED_ZONE = /\{%[^%]*%\}|`[^`]+`|!?\[[^\]]*\]\([^)]*\)|https?:\/\/\S+/g;

/**
 * Replace dictionary terms only in the plain-text segments of a line.
 * Protected zones (code spans, URLs, shortcodes, links) are preserved verbatim.
 */
function replaceInPlainText(line, termRegex, replacement) {
  // Split the line into alternating [plain, protected, plain, protected, …] segments
  let lastIndex = 0;
  const parts = [];

  for (const match of line.matchAll(PROTECTED_ZONE)) {
    if (match.index > lastIndex) {
      parts.push({ text: line.slice(lastIndex, match.index), plain: true });
    }
    parts.push({ text: match[0], plain: false });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    parts.push({ text: line.slice(lastIndex), plain: true });
  }

  // Only replace inside plain segments
  let replaced = false;
  const result = parts.map(part => {
    if (!part.plain || replaced) return part.text;
    const after = part.text.replace(termRegex, (m) => {
      replaced = true;
      return replacement(m);
    });
    return after;
  }).join('');

  return { result, replaced };
}

/**
 * Process dictionary terms — find dictionary terms in text and wrap them.
 *
 * Rules:
 *   - Only the first occurrence of each term in the entire content gets a tooltip.
 *   - Terms inside fenced code blocks (``` or ~~~), inline code spans, URLs,
 *     markdown links, shortcodes, or headings are never touched.
 */
function processDictionaryTerms(content) {
  if (!CONFIG.dictionaryDetection.enabled || dictionaryTerms.length === 0) {
    return content;
  }

  // Sort terms by length (longest first) to avoid partial matches
  const sortedTerms = [...dictionaryTerms].sort((a, b) => b.length - a.length);

  let processedContent = content;

  for (const term of sortedTerms) {
    if (term.length < CONFIG.dictionaryDetection.minWordLength) {
      continue;
    }

    if (CONFIG.dictionaryDetection.excludeWords.includes(term.toLowerCase())) {
      continue;
    }

    // Skip if term is already wrapped in a dictionaryLink shortcode
    const existingPattern = new RegExp(`{%\\s*dictionaryLink\\s[^}]*"${term}"[^}]*%}`, 'gi');
    if (existingPattern.test(processedContent)) {
      continue;
    }

    // Build a regex that matches the term once (no g flag — we only want the first match per line)
    const caseFlag = CONFIG.dictionaryDetection.caseSensitive ? '' : 'i';
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termRegex = new RegExp(`\\b${escapedTerm}\\b`, caseFlag);
    const replacement = (match) => `{% dictionaryLink "${match}", "${term.toLowerCase()}" %}`;

    const lines = processedContent.split('\n');
    let insideCodeBlock = false;
    let found = false;

    const processedLines = lines.map(line => {
      // Fenced code block boundaries (``` or ~~~)
      if (/^\s*(```|~~~)/.test(line)) {
        insideCodeBlock = !insideCodeBlock;
        return line;
      }

      // Skip lines inside code blocks, headers, or if we already placed this term
      if (insideCodeBlock || found || /^\s*#{1,6}\s/.test(line)) {
        return line;
      }

      const { result, replaced } = replaceInPlainText(line, termRegex, replacement);
      if (replaced) found = true;
      return result;
    });

    processedContent = processedLines.join('\n');
  }

  return processedContent;
}

/**
 * Separate frontmatter from body content
 * Returns { frontmatter, body } where frontmatter includes the --- delimiters
 */
function separateFrontmatter(content) {
  const frontmatterMatch = content.match(/^(---\n[\s\S]*?\n---\n)/);
  if (frontmatterMatch) {
    return {
      frontmatter: frontmatterMatch[1],
      body: content.slice(frontmatterMatch[1].length)
    };
  }
  return { frontmatter: '', body: content };
}

/**
 * Process a single blog post file
 */
function processFile(filePath) {
  console.log(`Processing: ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Separate frontmatter from body - only process body
    const { frontmatter, body } = separateFrontmatter(content);

    // Process external links first
    let processedBody = processExternalLinks(body);

    // Process internal links
    processedBody = processInternalLinks(processedBody);

    // Process dictionary terms
    processedBody = processDictionaryTerms(processedBody);

    // Recombine frontmatter and processed body
    const finalContent = frontmatter + processedBody;

    // Check if any changes were made
    if (finalContent === originalContent) {
      console.log(`  ↳ No changes needed`);
      return { processed: false, reason: 'no_changes' };
    }

    // Write the processed content back to file
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`  ↳ Updated successfully`);

    return {
      processed: true,
      changes: {
        hasExternalLinks: finalContent.includes('externalLink'),
        hasInternalLinks: finalContent.includes('internalLink'),
        hasDictionaryLinks: finalContent.includes('dictionaryLink')
      }
    };
    
  } catch (error) {
    console.error(`  ↳ Error processing ${filePath}:`, error.message);
    return { processed: false, reason: 'error', error: error.message };
  }
}

/**
 * Create and initialize statistics tracker
 */
function createStatsTracker() {
  return {
    totalFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    errorFiles: 0,
    changes: {
      externalLinks: 0,
      internalLinks: 0,
      dictionaryLinks: 0
    }
  };
}

/**
 * Print processing configuration to console
 */
function printProcessingConfiguration() {
  console.log('🔗 Processing blog post links...\n');
  console.log('Configuration:');
  console.log(`  - Dictionary detection: ${CONFIG.dictionaryDetection.enabled ? 'enabled' : 'disabled'}`);
  console.log(`  - Skip if has shortcodes: ${CONFIG.skipIfHasShortcodes}`);
  console.log(`  - Dictionary terms available: ${dictionaryTerms.length}\n`);
}

/**
 * Process all files in a single directory
 */
function processDirectoryFiles(blogDir, stats) {
  const fullDirPath = path.join(process.cwd(), blogDir);
  
  if (!fs.existsSync(fullDirPath)) {
    console.log(`Directory not found: ${blogDir}`);
    return;
  }
  
  console.log(`\n📁 Processing directory: ${blogDir}`);
  
  const files = fs.readdirSync(fullDirPath).filter(file => file.endsWith('.md'));
  
  for (const file of files) {
    const filePath = path.join(fullDirPath, file);
    stats.totalFiles++;
    
    const result = processFile(filePath);
    
    if (result.processed) {
      stats.processedFiles++;
      if (result.changes?.hasExternalLinks) stats.changes.externalLinks++;
      if (result.changes?.hasInternalLinks) stats.changes.internalLinks++;
      if (result.changes?.hasDictionaryLinks) stats.changes.dictionaryLinks++;
    } else if (result.reason === 'error') {
      stats.errorFiles++;
    } else {
      stats.skippedFiles++;
    }
  }
}

/**
 * Print processing summary to console
 */
function printProcessingSummary(stats) {
  console.log('\n📊 Processing Summary:');
  console.log(`  Total files: ${stats.totalFiles}`);
  console.log(`  Processed: ${stats.processedFiles}`);
  console.log(`  Skipped: ${stats.skippedFiles}`);
  console.log(`  Errors: ${stats.errorFiles}`);
  console.log('\n🔗 Link Types Processed:');
  console.log(`  External links: ${stats.changes.externalLinks} files`);
  console.log(`  Internal links: ${stats.changes.internalLinks} files`);
  console.log(`  Dictionary links: ${stats.changes.dictionaryLinks} files`);
}

/**
 * Process all blog posts in the specified directories
 */
function processAllPosts(options = {}) {
  const stats = createStatsTracker();
  
  // Override config with command line options
  if (options.includeDictionary !== undefined) {
    CONFIG.dictionaryDetection.enabled = options.includeDictionary;
  }
  
  printProcessingConfiguration();
  
  for (const blogDir of CONFIG.blogDirs) {
    processDirectoryFiles(blogDir, stats);
  }
  
  printProcessingSummary(stats);
  
  return stats;
}

/**
 * CLI Interface
 */
function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        console.log(`
Blog Link Processor

Usage: node scripts/process-links.js [options]

Options:
  --no-dictionary     Disable dictionary term detection
  --dictionary        Enable dictionary term detection (default)
  --dry-run          Show what would be changed without making changes
  --help, -h         Show this help message

Examples:
  node scripts/process-links.js                    # Process all posts
  node scripts/process-links.js --no-dictionary   # Skip dictionary processing
  node scripts/process-links.js --dry-run         # Preview changes only
        `);
        return;
        
      case '--no-dictionary':
        options.includeDictionary = false;
        break;
        
      case '--dictionary':
        options.includeDictionary = true;
        break;
        
      case '--dry-run':
        console.log('Dry run mode not implemented yet. This would show preview of changes.');
        return;
        
      default:
        if (args[i].startsWith('--')) {
          console.error(`Unknown option: ${args[i]}`);
          process.exit(1);
        }
    }
  }
  
  // Run the processing
  try {
    const stats = processAllPosts(options);
    
    if (stats.errorFiles > 0) {
      console.log('\n⚠️  Some files had errors. Check the output above for details.');
      process.exit(1);
    }
    
    if (stats.processedFiles > 0) {
      console.log('\n✅ Processing completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Review the changes with: git diff');
      console.log('2. Test the site with: npm run dev');
      console.log('3. Build for production: npm run build');
    } else {
      console.log('\n✅ No changes were needed.');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Export functions for testing
export {
  processExternalLinks,
  processInternalLinks,
  processDictionaryTerms,
  isExternalUrl,
  isMarkdownLinkAlreadyProcessed,
  separateFrontmatter,
  processFile,
  processAllPosts,
  createStatsTracker,
  printProcessingConfiguration,
  processDirectoryFiles,
  printProcessingSummary,
  CONFIG
};

// Run main only when executed directly (not when imported for testing)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
