import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

const bundles = [
  {
    input: 'src/_static/js/core.js',
    output: {
      file: '_site/js/core.js',
      format: 'es',
      sourcemap: !isProduction
    },
    plugins: isProduction ? [terser()] : []
  },
  {
    input: 'src/_static/js/article.js',
    output: {
      file: '_site/js/article.js',
      format: 'es',
      sourcemap: !isProduction
    },
    plugins: isProduction ? [terser()] : []
  },
  {
    input: 'src/_static/js/media.js',
    output: {
      file: '_site/js/media.js',
      format: 'es',
      sourcemap: !isProduction
    },
    plugins: isProduction ? [terser()] : []
  },
  {
    input: 'src/_static/js/prism-loader.js',
    output: {
      file: '_site/js/prism-loader.js',
      format: 'es',
      sourcemap: !isProduction
    },
    plugins: isProduction ? [terser()] : []
  },
  {
    input: 'src/_static/js/shoelace-bundle.js',
    output: {
      file: '_site/js/shoelace-bundle.js',
      format: 'es',
      sourcemap: !isProduction
    },
    plugins: isProduction ? [terser()] : []
  }
];

export default bundles;