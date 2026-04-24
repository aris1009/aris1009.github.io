// Manual regeneration utility — not part of `npm run build`.
// Rerun when src/_static/img/og-default-master.jpg changes, then commit the
// derivative PNGs under src/_static/img/social/.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const SRC = 'src/_static/img/og-default-master.jpg';
const OUT_DIR = 'src/_static/img/social';

const VARIANTS = [
  { file: 'og-default.png',            w: 1200, h: 630,  fit: 'cover' },
  { file: 'og-default@2x.png',         w: 2400, h: 1260, fit: 'cover' },
  { file: 'og-default-1280x720.png',   w: 1280, h: 720,  fit: 'cover' },
  { file: 'og-default-square.png',     w: 1200, h: 1200, fit: 'cover' },
];

await mkdir(OUT_DIR, { recursive: true });

for (const v of VARIANTS) {
  const out = `${OUT_DIR}/${v.file}`;
  await sharp(SRC)
    .resize(v.w, v.h, { fit: v.fit, position: 'center' })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${out} (${v.w}x${v.h})`);
}
