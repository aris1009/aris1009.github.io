const readingTime = require("eleventy-plugin-reading-time");
const rssPlugin = require("@11ty/eleventy-plugin-rss");
const navigationPlugin = require("@11ty/eleventy-navigation");
const i18n = require("eleventy-plugin-i18n");

const {
  filters,
  collections,
  transforms,
  shortcodes,
  globalData,
  constants
} = require("./src/lib");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(readingTime);
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(navigationPlugin);

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

  eleventyConfig.addShortcode("currentYear", shortcodes.currentYear);
  eleventyConfig.addShortcode("externalLink", shortcodes.externalLink);
  eleventyConfig.addShortcode("internalLink", shortcodes.internalLink);
  eleventyConfig.addShortcode("dictionaryLink", shortcodes.dictionaryLink);

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