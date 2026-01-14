import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/_static/js/shoelace-bundle.js',
  output: {
    file: '_site/js/shoelace-bundle.js',
    format: 'esm',
    sourcemap: false
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    terser()
  ]
};