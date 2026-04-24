#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Mermaid Bundle Builder
 *
 * Bundles mermaid from node_modules into a same-origin ESM bundle with
 * per-diagram chunks. Mermaid's entry uses dynamic imports for each diagram
 * type, which Rollup preserves as separate chunk files — so users only pay
 * for the diagrams actually on the page.
 *
 * The output is consumed by the mermaid_js shortcode in eleventy.config.js,
 * which emits a <script type="module"> pointing at the entry. Because the
 * script is same-origin, it satisfies the CSP's script-src 'self'.
 */
const CONFIG = {
  outputDir: path.join(__dirname, '..', 'src', '_static', 'js', 'vendor', 'mermaid'),
  tempEntryPath: path.join(__dirname, '.mermaid-entry.js'),
};

function generateEntryContent() {
  return [
    "// Auto-generated mermaid entry — do not edit",
    "// Exposes mermaid on window so mermaid-theme-sync.js can drive rendering.",
    "import mermaid from 'mermaid';",
    "window.mermaid = mermaid;",
    "",
  ].join('\n');
}

async function buildBundle() {
  fs.writeFileSync(CONFIG.tempEntryPath, generateEntryContent(), 'utf8');

  try {
    if (fs.existsSync(CONFIG.outputDir)) {
      fs.rmSync(CONFIG.outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });

    const bundle = await rollup({
      input: CONFIG.tempEntryPath,
      plugins: [
        nodeResolve({ browser: true, preferBuiltins: false }),
        commonjs(),
        terser({ format: { comments: false } }),
      ],
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        if (warning.code === 'EVAL') return;
        warn(warning);
      },
    });

    const { output } = await bundle.write({
      dir: CONFIG.outputDir,
      format: 'es',
      entryFileNames: 'index.js',
      chunkFileNames: 'chunks/[name]-[hash].js',
      sourcemap: false,
    });

    await bundle.close();

    const total = output.reduce((sum, f) => sum + (f.code?.length || 0), 0);
    return { files: output.length, bytes: total };
  } finally {
    if (fs.existsSync(CONFIG.tempEntryPath)) {
      fs.unlinkSync(CONFIG.tempEntryPath);
    }
  }
}

async function main() {
  console.log('Building local mermaid bundle…');
  const { files, bytes } = await buildBundle();
  console.log(`  ${files} files, ${(bytes / 1024).toFixed(1)} KB total`);
  console.log(`  Output: ${CONFIG.outputDir}`);
}

export { generateEntryContent, buildBundle, CONFIG };

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((err) => {
    console.error('mermaid build failed:', err);
    process.exit(1);
  });
}
