#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
  const dictionary = require(DICTIONARY_PATH);
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

/**
 * Check if content already has shortcodes (to avoid double processing)
 */
function hasExistingShortcodes(content) {
  const shortcodePatterns = [
    /{%\s*externalLink\s/,
    /{%\s*internalLink\s/,
    /{%\s*dictionaryLink\s/
  ];
  
  return shortcodePatterns.some(pattern => pattern.test(content));
}

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
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+\([^)]*\)[^)]*|[^)]+)\)/g;
  
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
  // Match markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
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
 * Process dictionary terms - find dictionary terms in text and wrap them
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
    
    // Create regex for the term (word boundaries to avoid partial matches)
    const flags = CONFIG.dictionaryDetection.caseSensitive ? 'g' : 'gi';
    const termRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, flags);
    
    // Only replace if not already inside a link or shortcode
    const lines = processedContent.split('\n');
    const processedLines = lines.map(line => {
      // Skip lines that already contain shortcodes or markdown links
      if (/{%.*%}/.test(line) || /\[[^\]]*\]\([^)]*\)/.test(line)) {
        return line;
      }
      
      // Replace the term with dictionaryLink shortcode
      return line.replace(termRegex, (match) => {
        return `{% dictionaryLink "${match}", "${term.toLowerCase()}" %}`;
      });
    });
    
    processedContent = processedLines.join('\n');
  }
  
  return processedContent;
}

/**
 * Process a single blog post file
 */
function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Note: We now process individual links even if file has existing shortcodes
    
    // Process external links first
    content = processExternalLinks(content);
    
    // Process internal links
    content = processInternalLinks(content);
    
    // Process dictionary terms
    content = processDictionaryTerms(content);
    
    // Check if any changes were made
    if (content === originalContent) {
      console.log(`  ↳ No changes needed`);
      return { processed: false, reason: 'no_changes' };
    }
    
    // Write the processed content back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ↳ Updated successfully`);
    
    return { 
      processed: true, 
      changes: {
        hasExternalLinks: content.includes('externalLink'),
        hasInternalLinks: content.includes('internalLink'),
        hasDictionaryLinks: content.includes('dictionaryLink')
      }
    };
    
  } catch (error) {
    console.error(`  ↳ Error processing ${filePath}:`, error.message);
    return { processed: false, reason: 'error', error: error.message };
  }
}

/**
 * Process all blog posts in the specified directories
 */
function processAllPosts(options = {}) {
  const stats = {
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
  
  // Override config with command line options
  if (options.includeDictionary !== undefined) {
    CONFIG.dictionaryDetection.enabled = options.includeDictionary;
  }
  
  console.log('🔗 Processing blog post links...\n');
  console.log('Configuration:');
  console.log(`  - Dictionary detection: ${CONFIG.dictionaryDetection.enabled ? 'enabled' : 'disabled'}`);
  console.log(`  - Skip if has shortcodes: ${CONFIG.skipIfHasShortcodes}`);
  console.log(`  - Dictionary terms available: ${dictionaryTerms.length}\n`);
  
  for (const blogDir of CONFIG.blogDirs) {
    const fullDirPath = path.join(process.cwd(), blogDir);
    
    if (!fs.existsSync(fullDirPath)) {
      console.log(`Directory not found: ${blogDir}`);
      continue;
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
  
  // Print summary
  console.log('\n📊 Processing Summary:');
  console.log(`  Total files: ${stats.totalFiles}`);
  console.log(`  Processed: ${stats.processedFiles}`);
  console.log(`  Skipped: ${stats.skippedFiles}`);
  console.log(`  Errors: ${stats.errorFiles}`);
  console.log('\n🔗 Link Types Processed:');
  console.log(`  External links: ${stats.changes.externalLinks} files`);
  console.log(`  Internal links: ${stats.changes.internalLinks} files`);
  console.log(`  Dictionary links: ${stats.changes.dictionaryLinks} files`);
  
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
module.exports = {
  processExternalLinks,
  processInternalLinks,
  processDictionaryTerms,
  isExternalUrl,
  isMarkdownLinkAlreadyProcessed,
  processFile,
  processAllPosts,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  main();
}