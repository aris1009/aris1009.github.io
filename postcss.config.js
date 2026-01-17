import { purgeCSSPlugin } from '@fullhuman/postcss-purgecss';
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
          'prose',
          /^prose-/
        ]
      }
    }) : null
  ].filter(Boolean)
};
