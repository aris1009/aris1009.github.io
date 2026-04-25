import purgeCSSPlugin from '@fullhuman/postcss-purgecss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
    process.env.NODE_ENV === 'production' ? purgeCSSPlugin({
      content: [
        '_site/**/*.html'
      ],
      // Custom extractor: keeps Tailwind variant prefixes (dark:foo, md:foo,
      // hover:foo, dark:bg-zinc-900, etc.) intact as single class candidates.
      // The default PurgeCSS extractor splits on `:` and discards the variant
      // halves, which silently strips every `dark:*` utility from prod CSS —
      // that's the cause of the dark-mode regressions we kept hitting after
      // unrelated CSS work.
      defaultExtractor: (content) => content.match(/[\w-/:%.]+(?<!:)/g) || [],
      safelist: {
        standard: [
          /^dictionary-/,
          /^sl-/,
          /^back-to-top/,
          /^theme-toggle/,
          /^toggle-/,
          /^burger-/,
          /^reading-progress/,
          /^mermaid/,
          'dark',
          'sl-theme-dark',
          'prose',
          /^prose-/
        ],
        // Variant prefixes: even with the extractor fix, keep these as a
        // belt-and-braces guard so a future extractor regression doesn't
        // silently strip dark mode again.
        deep: [/^dark$/, /:is\(\.dark/]
      }
    }) : null
  ].filter(Boolean)
};
