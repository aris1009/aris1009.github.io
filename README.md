# Security & Technology Blog

A multilingual security and technology blog built with Eleventy, supporting English, Greek, and Turkish.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Eleventy v2.0.1 | Static site generator |
| Nunjucks | Templating engine |
| Tailwind CSS v3.4 | Utility-first styling |
| Shoelace v2.20 | Web components (tooltips) |
| Prism.js v1.30 | Syntax highlighting |
| Vitest v4.0 | Unit testing |
| Playwright v1.57 | E2E testing |

## Features

### Reading Experience
- **Reading Progress Bar** - Scroll-based progress indicator on articles
- **Reading Time** - Localized time estimate per article
- **Code Copy Buttons** - One-click copy with Shoelace feedback
- **Syntax Highlighting** - Prism.js for JS, TS, CSS, HTML, Docker, Git, Markdown

### Navigation
- **Responsive Burger Menu** - Mobile-optimized with overlay
- **Language Selector** - Flag-based dropdown (🇺🇸🇬🇷🇹🇷)
- **Dark Mode Toggle** - System preference detection, localStorage persistence

### Content
- **Interactive Dictionary** - 30+ security terms with Shoelace tooltips
- **Article Labels** - Difficulty badges, content type, technology tags
- **External Links** - Auto `target="_blank"`, `rel="noopener noreferrer"`
- **Internal Links** - Locale-aware relative routing

### Internationalization
- **3 Locales** - English (en-us), Greek (el), Turkish (tr)
- **150+ Translations** - UI strings, ARIA labels, metadata
- **Locale Collections** - Separate post collections per language
- **Fallback Chain** - Graceful degradation to English

### SEO & Performance
- **RSS Feeds** - Per-locale feed generation
- **Meta Tags** - Open Graph, description, keywords
- **HTML Minification** - Production optimization
- **Tailwind Purge** - Unused CSS removal

### Accessibility
- **ARIA Labels** - All interactive elements
- **Keyboard Navigation** - Focus management, escape handlers
- **Semantic HTML** - Proper heading hierarchy, landmarks
- **Test IDs** - Reliable E2E test selectors

### Testing
- **13 Unit Test Files** - Filters, shortcodes, collections, transforms
- **6 E2E Test Files** - Tooltips, theme toggle, code blocks, labels

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Unit tests
npm run test:watch   # Unit tests (watch mode)
npm run test:e2e     # E2E tests
npm run new-post     # Generate blog post scaffold
```

## Project Structure

```
src/
├── _data/           # dictionary.js, meta.js, translations.js
├── _includes/       # nav.njk, footer.njk, head.njk
├── _layouts/        # article.njk, blog.njk, page.njk
├── _static/         # js/, img/
├── _tailwindCSS/    # raw-website.css
├── blog/            # en-us/, el/, tr/
├── lib/             # collections, filters, shortcodes, transforms
└── pages/           # about, dictionary, 404, etc.

tests/
├── unit/            # Vitest tests
└── e2e/             # Playwright tests
```

## Content Statistics

| Metric | Count |
|--------|-------|
| Blog Posts | 12 |
| Static Pages | 5 |
| Dictionary Terms | 30+ |
| Supported Languages | 3 |

## Shortcodes

```nunjucks
{% currentYear %}
{% externalLink "text", "url", "ariaLabel" %}
{% internalLink "text", "url", "ariaLabel" %}
{% dictionaryLink "text", "term" %}
{% themeToggle %}
{% articleLabels difficulty, contentType, technologies %}
```

## License

- **Code**: GPL-3.0 - see [LICENSE-CONTENT](https://www.gnu.org/licenses/gpl-3.0.en.html#license-text)
- **Content**: CC BY-NC-SA 4.0 - see [LICENSE-CONTENT](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en)