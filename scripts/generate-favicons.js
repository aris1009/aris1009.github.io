const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = path.join(__dirname, '..', 'src', '_static', 'favicon-base.svg');
const outputDir = path.join(__dirname, '..', 'src', '_static', 'favicon');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Favicon sizes and formats needed
const faviconConfigs = [
  // Core favicon files
  { name: 'favicon-196.png', size: 196 },
  { name: 'favicon-512.png', size: 512 },
  { name: 'apple-icon-180.png', size: 180 },

  // Microsoft tile icons
  { name: 'mstile-icon-128.png', size: 128 },
  { name: 'mstile-icon-270.png', size: 270 },
  { name: 'mstile-icon-558.png', size: 558 },
  { name: 'mstile-icon-558-270.png', size: 558, height: 270 },

  // Apple splash screen sizes (width x height)
  { name: 'apple-splash-2048-2732.png', width: 2048, height: 2732 },
  { name: 'apple-splash-2732-2048.png', width: 2732, height: 2048 },
  { name: 'apple-splash-1668-2388.png', width: 1668, height: 2388 },
  { name: 'apple-splash-2388-1668.png', width: 2388, height: 1668 },
  { name: 'apple-splash-1536-2048.png', width: 1536, height: 2048 },
  { name: 'apple-splash-2048-1536.png', width: 2048, height: 1536 },
  { name: 'apple-splash-1668-2224.png', width: 1668, height: 2224 },
  { name: 'apple-splash-2224-1668.png', width: 2224, height: 1668 },
  { name: 'apple-splash-1620-2160.png', width: 1620, height: 2160 },
  { name: 'apple-splash-2160-1620.png', width: 2160, height: 1620 },
  { name: 'apple-splash-1284-2778.png', width: 1284, height: 2778 },
  { name: 'apple-splash-2778-1284.png', width: 2778, height: 1284 },
  { name: 'apple-splash-1170-2532.png', width: 1170, height: 2532 },
  { name: 'apple-splash-2532-1170.png', width: 2532, height: 1170 },
  { name: 'apple-splash-1125-2436.png', width: 1125, height: 2436 },
  { name: 'apple-splash-2436-1125.png', width: 2436, height: 1125 },
  { name: 'apple-splash-1242-2688.png', width: 1242, height: 2688 },
  { name: 'apple-splash-2688-1242.png', width: 2688, height: 1242 },
  { name: 'apple-splash-828-1792.png', width: 828, height: 1792 },
  { name: 'apple-splash-1792-828.png', width: 1792, height: 828 },
  { name: 'apple-splash-1242-2208.png', width: 1242, height: 2208 },
  { name: 'apple-splash-2208-1242.png', width: 2208, height: 1242 },
  { name: 'apple-splash-750-1334.png', width: 750, height: 1334 },
  { name: 'apple-splash-1334-750.png', width: 1334, height: 750 },
  { name: 'apple-splash-640-1136.png', width: 640, height: 1136 },
  { name: 'apple-splash-1136-640.png', width: 1136, height: 640 },
];

async function generateFavicons() {
  console.log('Generating favicons from base SVG...');

  // Copy SVG to output directory
  const svgOutputPath = path.join(outputDir, 'safari-pinned-tab.svg');
  fs.copyFileSync(inputSvg, svgOutputPath);
  console.log('✓ Copied SVG to safari-pinned-tab.svg');

  // Generate PNG files
  for (const config of faviconConfigs) {
    const outputPath = path.join(outputDir, config.name);

    let resizeOptions = {};
    if (config.size) {
      // Square images
      resizeOptions = {
        width: config.size,
        height: config.height || config.size,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent background
      };
    } else {
      // Rectangular images (splash screens)
      resizeOptions = {
        width: config.width,
        height: config.height,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent background
      };
    }

    await sharp(inputSvg)
      .resize(resizeOptions)
      .png({ quality: 90 })
      .toFile(outputPath);

    console.log(`✓ Generated ${config.name}`);
  }

  // Generate ICO file with multiple sizes
  const icoSizes = [16, 32, 48];
  const icoBuffers = [];

  for (const size of icoSizes) {
    const buffer = await sharp(inputSvg)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
    icoBuffers.push(buffer);
  }

  // Note: Sharp doesn't directly create ICO files, so we'll create a simple ICO with the largest size
  // In production, you might want to use a dedicated ICO library
  const icoPath = path.join(outputDir, 'favicon.ico');
  await sharp(icoBuffers[2]) // Use 48x48 as base
    .toFile(icoPath);
  console.log('✓ Generated favicon.ico');

  console.log(`\nAll favicons generated successfully in ${outputDir}/`);
  console.log('Files created:', fs.readdirSync(outputDir));
}

generateFavicons().catch(console.error);