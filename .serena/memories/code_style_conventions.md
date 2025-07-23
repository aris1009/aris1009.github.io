# Code Style and Conventions

## JavaScript
- ES6+ syntax used throughout
- Class-based components for interactive features
- Event delegation for performance
- Semantic HTML with proper ARIA attributes for accessibility
- JSDoc comments for functions

## CSS/TailwindCSS
- Utility-first approach with TailwindCSS
- Custom components defined in `@layer components`
- Responsive design with mobile-first approach
- Dark mode support using `dark:` variants
- BEM-like naming for custom classes

## HTML/Nunjucks Templates
- Semantic HTML structure
- Proper heading hierarchy
- Accessibility attributes (ARIA, alt text, etc.)
- SEO meta tags and structured data
- Multilingual support with i18n plugin

## File Organization
- `src/` - Source files
- `src/_data/` - Global data files
- `src/_includes/` - Reusable templates and components
- `src/_layouts/` - Page layouts
- `src/_static/` - Static assets (JS, CSS, images)
- `src/lib/` - Utility functions and 11ty configuration