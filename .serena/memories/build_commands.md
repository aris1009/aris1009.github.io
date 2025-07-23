# Build and Development Commands

## Development
- `npm run dev` - Start development server (parallel CSS watch + Eleventy serve)
- `npm run start` - Alias for `npm run dev`

## Building
- `npm run build` - Full production build (clean + CSS + Eleventy)
- `npm run clean` - Remove _site directory

## CSS
- `npm run css:website` - Build production CSS with TailwindCSS
- `npm run dev:css` - Watch CSS changes in development

## Testing
- `npm test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:ui` - Run e2e tests with UI
- `npm run test:e2e:headed` - Run e2e tests in headed mode

## Content
- `npm run new-post` - Generate new blog post

## Output
Built site goes to `_site/` directory