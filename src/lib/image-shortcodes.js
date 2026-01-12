const Image = require("@11ty/eleventy-img");
const path = require("path");

// Default configurations for different image types
const IMAGE_CONFIGS = {
  article: {
    widths: [640, 960, 1280, 1536],
    formats: ["avif", "webp", "jpeg"],
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px",
    quality: {
      avif: 50,
      webp: 80,
      jpeg: 85
    },
    loading: "lazy"
  },
  
  hero: {
    widths: [960, 1280, 1920, 2560],
    formats: ["avif", "webp", "jpeg"],
    sizes: "100vw",
    quality: {
      avif: 45,
      webp: 75,
      jpeg: 80
    },
    loading: "eager"
  },
  
  thumbnail: {
    widths: [64, 128, 256],
    formats: ["avif", "webp", "jpeg"],
    sizes: "256px",
    quality: {
      avif: 60,
      webp: 85,
      jpeg: 90
    },
    loading: "lazy"
  }
};

/**
 * Generate responsive image shortcode
 */
async function responsiveImage(src, alt, options = {}) {
  const {
    type = "article",
    className = "",
    loading,
    sizes,
    widths,
    formats
  } = options;

  const config = IMAGE_CONFIGS[type];
  
  // Build full path
  const fullSrc = src.startsWith("/") 
    ? path.join(process.cwd(), "src", src) 
    : src;

  try {
    const stats = await Image(fullSrc, {
      widths: widths || config.widths,
      formats: formats || config.formats,
      outputDir: path.join(process.cwd(), "_site", "img", "optimized"),
      urlPath: "/img/optimized/",
      filenameFormat: function (id, src, width, format) {
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
      svgShortCircuit: true
    });

    // Generate HTML with proper attributes
    const htmlOptions = {
      alt,
      sizes: sizes || config.sizes,
      loading: loading || config.loading,
      decoding: "async",
      class: className
    };

    return Image.generateHTML(stats, htmlOptions);
  } catch (error) {
    console.error(`Error processing image ${src}:`, error);
    // Fallback to basic img tag
    return `<img src="${src}" alt="${alt}" class="${className}" loading="lazy">`;
  }
}

/**
 * Generate hero image with eager loading
 */
async function heroImage(src, alt, options = {}) {
  return await responsiveImage(src, alt, {
    type: "hero",
    ...options
  });
}

/**
 * Generate thumbnail image
 */
async function thumbnail(src, alt, options = {}) {
  return await responsiveImage(src, alt, {
    type: "thumbnail",
    className: `thumbnail ${options.className || ""}`,
    ...options
  });
}

module.exports = {
  responsiveImage,
  heroImage,
  thumbnail,
  IMAGE_CONFIGS
};
