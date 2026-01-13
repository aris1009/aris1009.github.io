module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    process.env.NODE_ENV === 'production' ? require('@fullhuman/postcss-purgecss').default({
      content: [
        'src/**/*.{html,njk,md,json,js}',
        '.eleventy.js'
      ],
      safelist: {
        standard: [
          // Dictionary test IDs
          /^dictionary-/,
          /^dictionary-tooltip-/,
          /^dictionary-emoji-/,
          // Shoelace components
          /^sl-/,
          // Dark mode
          'dark',
          // Prose styles
          'prose',
          /^prose-/,
          // Responsive breakpoints
          'sm',
          'md',
          'lg',
          'xl',
          '2xl'
        ]
      },
      variables: true
    }) : null
  ].filter(Boolean)
};