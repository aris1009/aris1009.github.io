# Testing notes

## Dictionary system

Interactive security-term tooltips powered by Shoelace's `<sl-tooltip>`.

- **Data**: `src/_data/dictionary.js` (with translations)
- **Shortcode**: `{% dictionaryLink "text", "term" %}`
- **Setup**: Shoelace CSS + tooltip component imported in `src/_includes/head.njk` (only the tooltip is bundled, for size)

### Test ID convention

- Link button: `data-testid="dictionary-link-{term}"`
- Tooltip: `data-testid="dictionary-tooltip-{term}"`
- Emoji: `data-testid="dictionary-emoji-{term}"`

Use `page.getByTestId(...)` in Playwright; do not select on classes.

## Link processing (`scripts/process-links.js`)

Converts markdown links into 11ty shortcodes. Regex-heavy and historically fragile, so it has dedicated unit tests at `tests/unit/scripts/process-links.test.js`.

### Functions covered

- `processExternalLinks` — markdown → external link shortcode
- `processInternalLinks` — internal paths → internal link shortcode
- `processDictionaryTerms` — wraps known terms in `dictionaryLink`
- `isExternalUrl`, `isMarkdownLinkAlreadyProcessed` — helpers

### Cases the suite locks down

Simple internal/external links, URLs with parentheses (e.g. `GRU_(Russian_Federation)`), multiple links per line, query strings + fragments, malformed URLs, multi-language text (en/el/tr), quote escaping in link text, bulk performance.

### Known regex limits (regression-guarded)

- Handles only one level of nested parentheses.
- URLs with parentheses in multiple sections may truncate.

These are intentional pin points — when you find a new edge case, add a test before changing the regex.

## E2E

- Test interactions (hover/click), keyboard (Tab/Esc), responsive, dark mode, multi-language.
- **Blog post reference**: always use `/blog/en-us/gru-kms-windows/`. It's the oldest committed post and guaranteed to exist in CI. Never reference a staged or uncommitted post.

## CSS-trim safety net

Trim-PR authors run `npm run test:e2e -- layout-invariants a11y-axe prose-contracts` first; the visual-regression suite (`tests/e2e/visual-regression.spec.js`) is the structural backstop. Layer 1 (`tests/e2e/layout-invariants.spec.js`) and Layer 2 (`tests/e2e/a11y-axe.spec.js`, axe-core color-contrast + target-size) assert invariants and never need editing for normal trim work. Layer 3 (`tests/e2e/prose-contracts.spec.js`) reads hardcoded RGB values from `tests/e2e/fixtures/style-tokens.js` — any intentional contract change (Trim A drops dark prose-p modifiers, Trim B drops prose-lg, Trim C inlines link colors, etc.) MUST edit that fixture in the same PR so the contract change is visible in code review.
