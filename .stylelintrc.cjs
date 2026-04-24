// Stylelint config for the Tailwind-authored CSS in src/_tailwindCSS/.
// Goal: catch real bugs (duplicate properties, invalid hex, empty blocks, unknown
// properties) without fighting Tailwind/PostCSS idioms.
module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Tailwind directives + @apply etc. are not standard at-rules.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'screen',
          'variants',
          'responsive',
          'layer',
          'config',
        ],
      },
    ],

    // Load-bearing rules we explicitly want enforced.
    'declaration-block-no-duplicate-properties': [
      true,
      { ignore: ['consecutive-duplicates-with-different-values'] },
    ],
    'color-no-invalid-hex': true,
    'length-zero-no-unit': true,
    'block-no-empty': true,
    'property-no-unknown': true,
    'selector-pseudo-element-no-unknown': true,

    // theme() and screen() are Tailwind-injected functions resolved at build time.
    'function-no-unknown': [true, { ignoreFunctions: ['theme', 'screen'] }],

    // --- Disabled because they fight Tailwind / @apply or are stylistic noise. ---

    // @apply-heavy rulesets unavoidably reorder; cross-cutting specificity check
    // produces too many false positives in a Tailwind codebase.
    'no-descending-specificity': null,
    // Tailwind layer cascade legitimately re-targets the same selector.
    'no-duplicate-selectors': null,

    // Tailwind class names and CSS custom property names follow our own conventions,
    // not stylelint's default kebab-case enforcement.
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,

    // Stylistic notations — let the source stay as authored.
    'alpha-value-notation': null,
    'color-function-notation': null,
    'color-function-alias-notation': null,
    'hue-degree-notation': null,
    'media-feature-range-notation': null,
    'shorthand-property-no-redundant-values': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'value-keyword-case': null,
    'selector-not-notation': null,
    'import-notation': null,

    // Whitespace/empty-line rules; reformatter's job, not the gate's.
    'comment-empty-line-before': null,
    'rule-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'no-empty-source': null,

    // Cross-browser vendor prefixes (e.g. -webkit-backdrop-filter) are deliberate.
    'property-no-vendor-prefix': null,
    'media-feature-name-no-vendor-prefix': null,

    // prefers-contrast: high is a real spec value; older stylelint data lags.
    'media-feature-name-value-no-unknown': null,

    // theme('colors.x') resolves at build time but stylelint can't see that.
    'declaration-property-value-no-unknown': null,

    // page-break-inside is intentional for print-stylesheet legacy support.
    'property-no-deprecated': null,
  },
};
