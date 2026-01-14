const purgecss = require('@fullhuman/postcss-purgecss').purgeCSSPlugin;

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    process.env.NODE_ENV === 'production' ? purgecss({
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
          'dark',
          'prose',
          /^prose-/
        ]
      }
    }) : null
  ].filter(Boolean)
};
