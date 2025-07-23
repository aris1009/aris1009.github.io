# Code Style and Conventions

## JavaScript/Node.js Style
- **Module System**: CommonJS (`require`/`module.exports`)
- **Naming**: camelCase for functions and variables
- **Constants**: UPPER_SNAKE_CASE for module-level constants
- **No Type Hints**: Plain JavaScript, no TypeScript
- **String Quotes**: Mixed usage of single and double quotes

## File Structure
- **Lib modules**: Exported as objects with multiple functions
- **Configuration**: Centralized in `src/lib/constants.js`
- **Data files**: Located in `src/_data/`

## Eleventy Conventions
- **Shortcodes**: Used for reusable HTML components (links, etc.)
- **Filters**: Used for data transformation
- **Collections**: Used for grouping content
- **Templates**: Nunjucks (.njk) for layouts and components

## Content Conventions
- **Blog posts**: Markdown with frontmatter
- **Multilingual**: Content duplicated per language (en-us, el, tr)
- **Permalinks**: Include language code in URL structure
- **Frontmatter**: Consistent fields (layout, title, description, date, locale, etc.)

## No Specific Linting/Formatting
- No ESLint or Prettier configuration found
- Code style appears to follow standard Node.js practices