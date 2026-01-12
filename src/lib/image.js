const Image = require("@11ty/eleventy-img");
const path = require("path");

// Image optimization configurations
const IMAGE_CONFIGS = {
  // Responsive breakpoints for different contexts
  responsive: {
    widths: [320, 640, 768, 1024, 1280, 1536],
    formats: ["avif", "webp", "jpeg"],
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px",
    quality: {
      avif: 50,
      webp: 80,
      jpeg: 85
    }
  },
  
  // Hero/large images
  hero: {
    widths: [640, 960, 1280, 1920],
    formats: ["avif", "webp", "jpeg"],
    sizes: "100vw",
    quality: {
      avif: 45,
      webp: 75,
      jpeg: 80
    }
  },
  
  // Thumbnail/small images
  thumbnail: {
    widths: [64, 128, 256],
    formats: ["avif", "webp", "jpeg"],
    sizes: "64px",
    quality: {
      avif: 60,
      webp: 85,
      jpeg: 90
    }
  }
};

/**
 * Generate optimized responsive images
 * @param {string} src - Source image path
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Image metadata
 */
async function generateResponsiveImages(src, options = {}) {
  const config = IMAGE_CONFIGS[options.type] || IMAGE_CONFIGS.responsive;
  
  // Build full path if relative
  const fullSrc = src.startsWith('/') ? path.join(process.cwd(), 'src', src) : src;
  
  try {
    const stats = await Image(fullSrc, {
      widths: config.widths,
      formats: config.formats,
      outputDir: path.join(process.cwd(), "_site", "img", "optimized"),
      urlPath: "/img/optimized/",
      filenameFormat: function (id, src, width, format, options) {
        const name = path.basename(src, path.extname(src));
        return `${name}-${width}w.${format}`;
      },
      sharpOptions: {
        avif: {
          quality: config.quality.avif,
          effort: 6
        },
        webp: {
          quality: config.quality.webp
        },
        jpeg: {
          quality: config.quality.jpeg,
          progressive: true
        }
      },
      svgShortCircuit: true,
      dryRun: false
    });
    
    return stats;
  } catch (error) {
    console.error(`Error processing image ${src}:`, error);
    throw error;
  }
}

/**
 * Generate low-quality image placeholder
 * @param {string} src - Source image path
 * @returns {Promise<string>} Base64 encoded placeholder
 */
async function generatePlaceholder(src) {
  try {
    const placeholderStats = await Image(src, {
      widths: [32],
      formats: ["jpeg"],
      outputDir: path.join(process.cwd(), "_site", "img", "placeholders"),
      urlPath: "/img/placeholders/",
      filenameFormat: function (id, src, width, format) {
        const name = path.basename(src, path.extname(src));
        return `${name}-${width}w.${format}`;
      },
      sharpOptions: {
        jpeg: {
          quality: 20,
          blur: 3
        }
      }
    });
    
    // Read the placeholder file and convert to base64
    const fs = require('fs').promises;
    const placeholderPath = placeholderStats.jpeg[0].outputPath;
    const buffer = await fs.readFile(placeholderPath);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error generating placeholder for ${src}:`, error);
    return ''; // Return empty string if placeholder generation fails
  }
}

/**
 * Generate HTML for responsive image using eleventy-img generateHTML
 * @param {Object} stats - Image metadata from generateResponsiveImages
 * @param {Object} options - HTML generation options
 * @param {string} options.alt - Alt text for accessibility
 * @param {string} options.sizes - Sizes attribute
 * @param {string} options.loading - Loading strategy (lazy/eager)
 * @param {string} options.decoding - Decoding strategy (async/auto/sync)
 * @param {string} options.className - CSS class names
 * @param {string} options.placeholder - Base64 placeholder
 * @returns {string} Generated HTML
 */
function generateImageHTML(stats, options = {}) {
  const {
    alt = "",
    sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px",
    loading = "lazy",
    decoding = "async",
    className = "",
    placeholder = ""
  } = options;
  
  const htmlOptions = {
    alt,
    sizes,
    loading,
    decoding,
    className
  };
  
  if (placeholder) {
    htmlOptions.style = `background-image: url('${placeholder}'); background-size: cover; background-position: center;`;
  }
  
  return Image.generateHTML(stats, htmlOptions);
}

/**
 * Process image for multilingual context
 * @param {string} src - Source image path
 * @param {string} alt - Alt text
 * @param {string} locale - Current locale (en-us, el, tr)
 * @param {Object} options - Additional options
 */
async function processLocalizedImage(src, alt, locale = 'en-us', options = {}) {
  // Add locale-specific alt text processing if needed
  const localizedAlt = alt;
  
  const stats = await generateResponsiveImages(src, options);
  const placeholder = options.generatePlaceholder ? await generatePlaceholder(src) : "";
  
  return generateImageHTML(stats, {
    alt: localizedAlt,
    ...options,
    placeholder
  });
}

module.exports = {
  generateResponsiveImages,
  generatePlaceholder,
  generateImageHTML,
  processLocalizedImage,
  IMAGE_CONFIGS
};
