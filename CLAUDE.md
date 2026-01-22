# Security & Technology Blog - Claude Development Notes

## Project Overview
This is a multilingual security and technology blog built with modern web technologies, supporting English, Greek, and Turkish languages.

## Technologies Used

### Core Framework
- **Eleventy (11ty) v2.0.1** - Static site generator
- **Nunjucks** - Templating engine for HTML generation
- **Tailwind CSS v3.3.6** - Utility-first CSS framework

### Web Components
- **Shoelace v2.20.1** - Professional web components library
  - Used for dictionary tooltips with built-in accessibility
  - Provides consistent cross-browser behavior
  - Automatic positioning and collision detection

### Testing
- **Vitest v3.2.4** - Unit testing framework
- **Playwright v1.54.1** - End-to-end testing
- **Testing Strategy**:
  - Unit tests for lib functions and shortcodes
  - E2E tests for user interactions and visual behavior
  - Accessibility testing for WCAG compliance

### Internationalization
- **eleventy-plugin-i18n v0.1.3** - Multi-language support
- Supported locales: `en-us`, `el`, `tr`

### Development Tools
- **npm-run-all v4.1.5** - Parallel script execution
- **luxon v3.4.4** - Date handling
- **html-minifier v4.0.0** - HTML optimization

## Development Commands

```bash
# Development (runs CSS and 11ty in parallel)
npm run dev

# Build for production
npm run build

# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Generate new blog post
npm run new-post

# Process links
npm run process-links
```

## Project Structure

```
src/
├── _data/           # Global data files
│   ├── dictionary.js    # Security terms dictionary
│   ├── meta.js         # Site metadata
│   └── translations.js # Multi-language translations
├── _includes/       # Reusable templates
│   ├── components/     # Template components
│   ├── head.njk       # HTML head with Shoelace imports
│   ├── nav.njk        # Navigation
│   └── footer.njk     # Footer
├── _layouts/        # Page layout templates
├── _static/         # Static assets
│   ├── img/           # Images
│   └── js/            # JavaScript files
├── _tailwindCSS/    # Tailwind CSS source
├── blog/           # Blog posts by language
│   ├── en-us/
│   ├── el/
│   └── tr/
├── lib/            # JavaScript utilities
│   ├── collections.js  # 11ty collections
│   ├── filters.js      # Template filters
│   ├── shortcodes.js   # Template shortcodes
│   └── transforms.js   # HTML transforms
└── pages/          # Static pages

scripts/
├── process-links.js       # Link processing automation
└── generate-blog-post.js  # Blog post generation

tests/
├── unit/           # Unit tests
│   ├── lib/           # Tests for lib functions
│   └── scripts/       # Tests for automation scripts
└── e2e/            # End-to-end tests
```

## Dictionary System

The blog features an interactive dictionary system for security terms:

- **Dictionary Data**: Stored in `src/_data/dictionary.js` with translations
- **Shortcode**: `{% dictionaryLink "text", "term" %}` generates tooltips
- **Implementation**: Uses Shoelace tooltips for professional UX
- **Test IDs**: Added for reliable E2E testing

### Test ID Convention
- Dictionary links: `data-testid="dictionary-link-{term}"`
- Dictionary tooltips: `data-testid="dictionary-tooltip-{term}"`
- Dictionary emojis: `data-testid="dictionary-emoji-{term}"`

## Shoelace Integration

Shoelace web components are integrated for enhanced UI components:

### Setup
- CSS theme loaded in `src/_includes/head.njk`
- Base path configured for asset loading
- Only tooltip component imported for performance

### Usage
```html
<sl-tooltip placement="top" data-testid="dictionary-tooltip-encryption">
  <div slot="content" class="dictionary-tooltip-content">
    <div class="tooltip-term">Encryption</div>
    <div class="tooltip-definition">The process of converting...</div>
  </div>
  <button class="dictionary-link" data-testid="dictionary-link-encryption">
    <span>encryption</span>
    <span class="dictionary-emoji" data-testid="dictionary-emoji-encryption">📘</span>
  </button>
</sl-tooltip>
```

## Testing Strategy

### Unit Tests
- **Core Functions**: Test shortcode HTML generation, test ID generation, dictionary term lookup, accessibility attributes
- **Link Processing**: Comprehensive tests for `scripts/process-links.js` functions to prevent regex regressions
- **Library Functions**: Test all functions in `src/lib/` directory for filters, collections, transforms

#### Link Processing Tests (`tests/unit/scripts/process-links.test.js`)
The link processing script has comprehensive unit tests covering:

**Core Functions Tested:**
- `processExternalLinks()` - Convert markdown links to external link shortcodes
- `processInternalLinks()` - Convert internal paths to internal link shortcodes  
- `processDictionaryTerms()` - Wrap dictionary terms in shortcodes
- `isExternalUrl()` - Determine if URL is external vs internal
- `isMarkdownLinkAlreadyProcessed()` - Skip already processed links

**Test Cases Include:**
- Simple external/internal links
- URLs with parentheses (Wikipedia links like `GRU_(Russian_Federation)`)
- Multiple links on same line
- URLs with query parameters and fragments
- Malformed URLs and edge cases
- Multi-language text (Greek, Turkish, English)
- Quote escaping in link text
- Performance tests with many links

**Known Limitations (Documented in Tests):**
- Current regex handles only one level of nested parentheses
- Complex URLs with multiple parentheses in different sections may be truncated
- These limitations are documented as regression tests to prevent breaking changes

**Expanding Test Coverage:**  
When new link processing edge cases are discovered, add them to the test suite immediately. The regex complexity makes comprehensive testing essential to prevent future regressions.

### E2E Tests
- Test tooltip interactions (hover, click)
- Test keyboard navigation (Tab, Escape)
- Test responsive behavior
- Test dark mode compatibility
- Test multi-language support

**IMPORTANT - Blog Post References in E2E Tests:**
- Always use `/blog/en-us/gru-kms-windows/` when E2E tests require a blog post to exist
- This is the oldest committed blog post and guaranteed to exist in CI
- Never reference staged/uncommitted blog posts in tests as they won't exist in CI

### Test Selectors
Use `data-testid` attributes for reliable element selection:
```javascript
// Example E2E test
const dictionaryLink = page.getByTestId('dictionary-link-encryption');
const tooltip = page.getByTestId('dictionary-tooltip-encryption');
```

## Build Process

1. **CSS Generation**: Tailwind processes `src/_tailwindCSS/raw-website.css`
2. **Asset Copying**: Static files and Shoelace assets copied to `_site/`
3. **Template Processing**: Nunjucks templates processed with data
4. **HTML Minification**: HTML optimized for production
5. **Multi-language**: Separate builds for each locale

## Deployment Notes

- Static files output to `_site/` directory
- Shoelace assets included in build
- Service worker registered for PWA functionality
- Dark mode preference stored in localStorage
- Multi-language routing supported

## Accessibility Features

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management
- Semantic HTML structure

## Performance Optimizations

- Font preloading and optimization
- CSS minification
- HTML minification  
- Tree-shaken Shoelace imports (only tooltip component)
- Service worker caching
- Optimized image loading