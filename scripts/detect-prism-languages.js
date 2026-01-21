#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load Prism's official components.json for dependency information
 */
function loadPrismComponents() {
  const componentsPath = path.join(process.cwd(), 'node_modules', 'prismjs', 'components.json');
  try {
    const content = fs.readFileSync(componentsPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Could not load Prism components.json:', error.message);
    return null;
  }
}

/**
 * PrismJS Language Detection Script
 *
 * Scans blog posts for code blocks and outputs detected languages
 * to src/_data/detectedLanguages.json for build-time optimization.
 */

// Configuration
const CONFIG = {
  blogDirs: ['src/blog/en-us', 'src/blog/el', 'src/blog/tr'],
  outputPath: path.join(__dirname, '..', 'src', '_data', 'detectedLanguages.json'),

  // Language aliases - map common names to Prism language identifiers
  languageAliases: {
    'sh': 'bash',
    'shell': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'py': 'python',
    'rb': 'ruby',
    'js': 'javascript',
    'ts': 'typescript',
    'dockerfile': 'docker',
    'html': 'markup',
    'xml': 'markup',
    'svg': 'markup',
    'njk': 'markup',
    'nunjucks': 'markup',
    'md': 'markdown',
    'plaintext': 'text',
    'plain': 'text',
    'txt': 'text',
  },

  // Languages that don't need Prism (handled as plain text)
  skipLanguages: ['mermaid', 'text', 'plaintext', 'plain', 'txt', 'none', ''],

  // Core Prism languages always included (required dependencies)
  coreLanguages: ['markup', 'css', 'clike', 'javascript'],
};

/**
 * Extract language from code block fence
 * Handles: ```bash, ```python, etc.
 */
function extractLanguagesFromContent(content) {
  const languages = new Set();
  const codeBlockRegex = /```(\w+)?/g;

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const lang = match[1];
    if (lang) {
      // Normalize the language name
      const normalized = normalizeLanguage(lang.toLowerCase());
      if (normalized && !CONFIG.skipLanguages.includes(normalized)) {
        languages.add(normalized);
      }
    }
  }

  return languages;
}

/**
 * Normalize language name using aliases
 */
function normalizeLanguage(lang) {
  return CONFIG.languageAliases[lang] || lang;
}

/**
 * Get article slug from file path
 * e.g., "src/blog/en-us/curl-bash-security.md" -> "curl-bash-security"
 */
function getArticleSlug(filePath) {
  const basename = path.basename(filePath, '.md');
  return basename;
}

/**
 * Scan a single markdown file for code block languages
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const languages = extractLanguagesFromContent(content);
    return {
      slug: getArticleSlug(filePath),
      languages: Array.from(languages),
    };
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return { slug: getArticleSlug(filePath), languages: [] };
  }
}

/**
 * Scan all blog directories for code block languages
 */
function scanAllPosts() {
  const allLanguages = new Set();
  const articleMap = {};
  const seenSlugs = new Set(); // Track unique articles (avoid duplicates across locales)

  for (const blogDir of CONFIG.blogDirs) {
    const fullDirPath = path.join(process.cwd(), blogDir);

    if (!fs.existsSync(fullDirPath)) {
      console.log(`Directory not found: ${blogDir}`);
      continue;
    }

    const files = fs.readdirSync(fullDirPath).filter(file => file.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(fullDirPath, file);
      const result = scanFile(filePath);

      // Add languages to global set
      result.languages.forEach(lang => allLanguages.add(lang));

      // Only add to articleMap if not already seen (same content across locales)
      if (!seenSlugs.has(result.slug)) {
        seenSlugs.add(result.slug);
        if (result.languages.length > 0) {
          articleMap[result.slug] = result.languages;
        }
      }
    }
  }

  return {
    languages: Array.from(allLanguages).sort(),
    articleMap,
  };
}

/**
 * Recursively resolve all dependencies for a language from Prism's components.json
 */
function resolveDependencies(lang, componentsData, resolved = new Set()) {
  // Avoid circular dependencies
  if (resolved.has(lang)) {
    return;
  }

  resolved.add(lang);

  // Get language metadata
  const languages = componentsData?.languages;
  if (!languages || !languages[lang]) {
    return;
  }

  const langData = languages[lang];
  const requires = langData.require;

  // Handle different require formats (string or array)
  if (requires) {
    const deps = Array.isArray(requires) ? requires : [requires];
    for (const dep of deps) {
      // Recursively resolve dependencies of dependencies
      resolveDependencies(dep, componentsData, resolved);
    }
  }

  return resolved;
}

/**
 * Add required Prism dependencies for detected languages
 * Reads dependencies from Prism's official components.json
 */
function addLanguageDependencies(languages) {
  const withDeps = new Set(CONFIG.coreLanguages);
  const componentsData = loadPrismComponents();

  if (!componentsData) {
    // Fallback: just add the languages without dependency resolution
    console.warn('Using languages without dependency resolution');
    languages.forEach(lang => withDeps.add(lang));
    return Array.from(withDeps).sort();
  }

  // Resolve dependencies for each detected language
  for (const lang of languages) {
    const allDeps = resolveDependencies(lang, componentsData);
    if (allDeps) {
      allDeps.forEach(dep => withDeps.add(dep));
    } else {
      // Language not found in components.json, add it anyway
      withDeps.add(lang);
    }
  }

  return Array.from(withDeps).sort();
}

/**
 * Write detection results to JSON file
 */
function writeResults(results) {
  const languagesWithDeps = addLanguageDependencies(results.languages);

  const output = {
    // Metadata
    generatedAt: new Date().toISOString(),

    // All unique languages detected (normalized)
    detectedLanguages: results.languages,

    // Languages to include in bundle (with dependencies)
    bundleLanguages: languagesWithDeps,

    // Per-article language mapping (for potential future use)
    articleMap: results.articleMap,
  };

  // Ensure _data directory exists
  const dataDir = path.dirname(CONFIG.outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(CONFIG.outputPath, JSON.stringify(output, null, 2), 'utf8');

  return output;
}

/**
 * Main entry point
 */
function main() {
  console.log('Detecting Prism languages from blog posts...\n');

  const results = scanAllPosts();
  const output = writeResults(results);

  console.log('Detected languages:', output.detectedLanguages.join(', ') || '(none)');
  console.log('Bundle languages:', output.bundleLanguages.join(', '));
  console.log(`\nArticles with code: ${Object.keys(output.articleMap).length}`);

  // Show per-article breakdown
  for (const [slug, langs] of Object.entries(output.articleMap)) {
    console.log(`  - ${slug}: ${langs.join(', ')}`);
  }

  console.log(`\nOutput written to: ${CONFIG.outputPath}`);

  return output;
}

// Export for testing
export {
  loadPrismComponents,
  resolveDependencies,
  extractLanguagesFromContent,
  normalizeLanguage,
  getArticleSlug,
  scanFile,
  scanAllPosts,
  addLanguageDependencies,
  writeResults,
  CONFIG,
};

// Run main only when executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}
