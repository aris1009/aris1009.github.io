# Project Overview

This is a multilingual security & technology blog built with:

- **11ty (Eleventy)** - Static site generator
- **TailwindCSS** - For styling
- **Nunjucks** - Templating engine
- **JavaScript** - For interactive components
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Key Features
- Multilingual support (English, Greek, Turkish)
- Dictionary functionality with interactive tooltips
- Blog posts with reading time estimation
- Responsive design with dark mode
- SEO optimized with RSS feeds

## Dictionary Functionality
The blog includes a dictionary feature for technical terms:
- Dictionary terms defined in `src/_data/dictionary.js`
- `dictionaryLink` shortcode generates interactive dictionary links
- JavaScript component handles tooltip interactions
- Tooltips show term definitions on click