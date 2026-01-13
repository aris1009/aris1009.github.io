#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const purgecss = require('@fullhuman/postcss-purgecss');

/**
 * Component build configuration
 * Maps input CSS files to output files in _site/css/
 */
const components = [
  {
    name: 'base',
    input: 'src/_css/base.css',
    output: '_site/css/base.css'
  },
  {
    name: 'header',
    input: 'src/_css/components/header.css',
    output: '_site/css/header.css'
  },
  {
    name: 'footer',
    input: 'src/_css/components/footer.css',
    output: '_site/css/footer.css'
  },
  {
    name: 'article',
    input: 'src/_css/components/article.css',
    output: '_site/css/article.css'
  },
  {
    name: 'dictionary',
    input: 'src/_css/components/dictionary.css',
    output: '_site/css/dictionary.css'
  },
  {
    name: 'theme',
    input: 'src/_css/components/theme.css',
    output: '_site/css/theme.css'
  },
  {
    name: 'language',
    input: 'src/_css/components/language.css',
    output: '_site/css/language.css'
  },
  {
    name: 'layout',
    input: 'src/_css/utilities/layout.css',
    output: '_site/css/layout.css'
  },
  {
    name: 'typography',
    input: 'src/_css/utilities/typography.css',
    output: '_site/css/typography.css'
  }
];

/**
 * Generate component-specific safelist patterns based on file content
 * @param {string} componentName - Name of the component
 * @param {string} content - CSS content to analyze
 * @returns {string[]} Array of safelist patterns
 */
function getComponentSafelist(componentName, content) {
  const patterns = [];

  // Component-specific patterns
  switch (componentName) {
    case 'dictionary':
      patterns.push(
        /^dictionary-/,
        /^dictionary-tooltip-/,
        /^dictionary-emoji-/,
        /^dictionary-link-/,
        'tooltip-term',
        'tooltip-definition',
        'tooltip-content',
        'emoji-indicator',
        'dictionary-link',
        'dictionary-text',
        'external-link',
        'internal-link'
      );
      break;

    case 'header':
      patterns.push(
        'burger-menu',
        'burger-button',
        'burger-icon',
        'burger-line',
        'burger-overlay',
        'burger-menu-content',
        'burger-branding',
        'burger-title-link',
        'burger-title',
        'burger-motto',
        'burger-nav',
        'burger-nav-links',
        'burger-nav-link',
        'nav-divider',
        'header-controls'
      );
      break;

    case 'theme':
      patterns.push(
        'theme-toggle',
        'theme-button',
        'theme-icon',
        'dark',
        'light'
      );
      break;

    case 'language':
      patterns.push(
        'language-selector',
        'language-button',
        'language-dropdown',
        'language-option'
      );
      break;

    case 'article':
      patterns.push(
        'article',
        'article-content',
        'article-header',
        'article-footer',
        'reading-progress',
        'reading-bar',
        // Prose classes from @tailwindcss/typography
        'prose',
        'prose-sky',
        'dark:prose-invert',
        'dark:prose-p:text-slate-50',
        'dark:prose-li:text-slate-50',
        'dark:prose-lead:text-slate-100',
        'prose-lead:font-light',
        // Prose element selectors
        /^prose/,
        /^prose-/
      );
      break;

    case 'footer':
      patterns.push(
        'footer',
        'footer-content',
        'footer-links',
        'footer-link'
      );
      break;

    case 'base':
      patterns.push(
        'html',
        'body',
        'container',
        'mx-auto',
        'px-5',
        'py-4',
        'bg-zinc-100',
        'dark:bg-zinc-900',
        'text-slate-900',
        'dark:text-slate-100',
        'font-serif',
        'prose',
        'prose-sky',
        'dark:prose-invert',
        // All prose-related classes
        /^prose/,
        /^prose-/
      );
      break;
  }

  // Extract CSS classes from @apply directives
  const applyMatches = content.match(/@apply\s+([^;]+)/g);
  if (applyMatches) {
    applyMatches.forEach(match => {
      const classes = match.replace('@apply', '').trim().split(/\s+/);
      patterns.push(...classes);
    });
  }

  // Extract class selectors
  const classMatches = content.match(/\.\w+(-\w+)*/g);
  if (classMatches) {
    classMatches.forEach(match => {
      patterns.push(match.substring(1)); // Remove the leading dot
    });
  }

  return [...new Set(patterns)]; // Remove duplicates
}

/**
 * Build CSS for a single component
 * @param {Object} component - Component configuration object
 * @param {Array} globalSafelist - Global safelist to include for all components
 * @returns {Promise<Object>} Build result with success status and file info
 */
async function buildComponentCSS(component, globalSafelist = []) {
  const startTime = Date.now();

  try {
    console.log(`📦 Processing ${component.name}...`);

    // Read input CSS file
    const inputPath = path.resolve(component.input);
    const css = fs.readFileSync(inputPath, 'utf8');

    // Generate component-specific safelist
    const componentSafelist = getComponentSafelist(component.name, css);

    // Combine global and component-specific safelist
    const combinedSafelist = [...globalSafelist, ...componentSafelist];

    // PostCSS plugins configuration
    const plugins = [
      tailwindcss({
        content: ["./src/**/*.{html,njk,md,json,js}", "./.eleventy.js"],
        safelist: combinedSafelist
      }),
      autoprefixer
    ];

    // Add PurgeCSS only in production
    if (process.env.NODE_ENV === 'production') {
      plugins.push(
        purgecss()({
          content: ["./src/**/*.{html,njk,md,json,js}", "./.eleventy.js"],
          safelist: {
            standard: combinedSafelist,
            deep: [/^sl-/], // Shoelace components
            greedy: [/^dictionary-tooltip-/]
          },
          variables: true
        })
      );
    }

    // Process CSS with PostCSS
    const result = await postcss(plugins).process(css, {
      from: inputPath,
      to: path.resolve(component.output)
    });

    // Ensure output directory exists
    const outputDir = path.dirname(path.resolve(component.output));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output file
    fs.writeFileSync(path.resolve(component.output), result.css);

    const duration = Date.now() - startTime;
    const sizeKb = (Buffer.byteLength(result.css, 'utf8') / 1024).toFixed(2);

    console.log(`✅ ${component.name} built successfully (${sizeKb} KB, ${duration}ms)`);

    return {
      success: true,
      component: component.name,
      input: component.input,
      output: component.output,
      size: sizeKb,
      duration: duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to build ${component.name}: ${error.message}`);

    return {
      success: false,
      component: component.name,
      error: error.message,
      duration: duration
    };
  }
}

/**
 * Main build function
 */
async function buildComponents() {
  console.log('🚀 Starting CSS component build...\n');

  const results = [];
  let successCount = 0;
  let totalSize = 0;

  // Global safelist that includes prose classes for all components
  const globalSafelist = [
    // Prose classes from @tailwindcss/typography
    'prose',
    'prose-sky',
    'dark:prose-invert',
    'dark:prose-p:text-slate-50',
    'dark:prose-li:text-slate-50',
    'dark:prose-lead:text-slate-100',
    'prose-lead:font-light',
    /^prose/,
    /^prose-/,
    // Dictionary test IDs
    /^dictionary-/,
    /^dictionary-tooltip-/,
    /^dictionary-emoji-/,
    // Shoelace components
    /^sl-/,
    // Dark mode
    'dark',
    // Responsive breakpoints
    'sm',
    'md',
    'lg',
    'xl',
    '2xl'
  ];

  // Process components sequentially to avoid conflicts
  for (const component of components) {
    const result = await buildComponentCSS(component, globalSafelist);
    results.push(result);

    if (result.success) {
      successCount++;
      totalSize += parseFloat(result.size || 0);
    }
  }

  console.log('\n📊 Build Summary:');
  console.log(`   Components processed: ${components.length}`);
  console.log(`   Successful builds: ${successCount}`);
  console.log(`   Failed builds: ${components.length - successCount}`);
  console.log(`   Total CSS size: ${totalSize.toFixed(2)} KB`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

  if (successCount === components.length) {
    console.log('\n🎉 All components built successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Some components failed to build. Check the errors above.');
    process.exit(1);
  }
}

// Run the build if this script is executed directly
if (require.main === module) {
  buildComponents().catch(error => {
    console.error('💥 Fatal error during build:', error);
    process.exit(1);
  });
}

module.exports = {
  buildComponents,
  buildComponentCSS,
  getComponentSafelist,
  components
};