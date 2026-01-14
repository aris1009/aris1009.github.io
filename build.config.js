import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/_static/js/index.js',
  output: {
    file: '_site/js/bundle.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    nodeResolve({
      browser: true
    }),
    commonjs(),
    terser()
  ]
};