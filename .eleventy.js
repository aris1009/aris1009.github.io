const readingTime = require("eleventy-plugin-reading-time");
const navigationPlugin = require("@11ty/eleventy-navigation");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const i18n = require("eleventy-plugin-i18n");

const {
  filters,
  collections,
  transforms,
  shortcodes,
  globalData,
  constants,
  imageShortcodes
} = require("./src/lib");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(readingTime);
  eleventyConfig.addPlugin(navigationPlugin);

  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: require("./src/_data/meta.js").url
    }
  });

  eleventyConfig.addPlugin(i18n, {
    translations: {
      ...require("./src/_data/translations.js")
    },
    fallbackLocales: constants.FALLBACK_LOCALES,
    markdownIteration: true
  });

  eleventyConfig.addPassthroughCopy("src/_static");
  eleventyConfig.addPassthroughCopy({ "src/_static/img": "img" });

  eleventyConfig.addFilter("readableDate", filters.readableDate);
  eleventyConfig.addFilter("htmlDateString", filters.htmlDateString);
  eleventyConfig.addFilter("head", filters.head);
  eleventyConfig.addFilter("min", filters.min);
  eleventyConfig.addFilter("filterTagList", filters.filterTagList);
  eleventyConfig.addFilter("localizedReadingTime", function (content, locale) {
    return filters.localizedReadingTime(content, locale, eleventyConfig);
  });
  eleventyConfig.addFilter("getDictionaryTerms", filters.getDictionaryTerms);

  eleventyConfig.addGlobalData("supportedLocales", globalData.supportedLocales);
  eleventyConfig.addGlobalData("locale", globalData.getLocale);
  eleventyConfig.addGlobalData("dictionary", require("./src/_data/dictionary.js"));

  eleventyConfig.addCollection("postsEn_us", collections.postsEn_us);
  eleventyConfig.addCollection("postsEl", collections.postsEl);
  eleventyConfig.addCollection("postsTr", collections.postsTr);
  eleventyConfig.addCollection("allPosts", collections.allPosts);
  eleventyConfig.addCollection("dictionary", collections.dictionary);

  eleventyConfig.addTransform("htmlmin", transforms.htmlminTransform);

  // Existing shortcodes
  eleventyConfig.addShortcode("currentYear", shortcodes.currentYear);
  eleventyConfig.addShortcode("externalLink", shortcodes.externalLink);
  eleventyConfig.addShortcode("internalLink", shortcodes.internalLink);
  
  // Add image shortcodes
  eleventyConfig.addAsyncShortcode("responsiveImage", imageShortcodes.responsiveImage);
  eleventyConfig.addAsyncShortcode("heroImage", imageShortcodes.heroImage);
  eleventyConfig.addAsyncShortcode("thumbnail", imageShortcodes.thumbnail);
  
  eleventyConfig.addShortcode("dictionaryLink", function (text, term) {
    let locale = this && this.ctx && this.ctx.locale
      ? this.ctx.locale
      : 'en-us'

    return shortcodes.dictionaryLink(text, term, locale);
  });
  eleventyConfig.addShortcode("themeToggle", shortcodes.themeToggle);
  eleventyConfig.addShortcode("articleLabels", function (difficulty, contentType, technologies) {
    let locale = this && this.ctx && this.ctx.locale
      ? this.ctx.locale
      : 'en-us'

    return shortcodes.articleLabels(difficulty, contentType, technologies, locale);
  });

  // Add passthrough copy for optimized images
  eleventyConfig.addPassthroughCopy({ "img/optimized": "img/optimized" });
  eleventyConfig.addPassthroughCopy({ "img/placeholders": "img/placeholders" });

  return {
    templateFormats: constants.TEMPLATE_FORMATS,
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
      output: "_site"
    }
  };
};
