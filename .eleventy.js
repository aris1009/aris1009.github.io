const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const readingTime = require("eleventy-plugin-reading-time");

const htmlmin = require("html-minifier");
const { DateTime } = require("luxon");

const supportedLocales = ['en-us', 'el', 'tr'];
const defaultLocale = 'en-us';

module.exports = function (eleventyConfig) {
  eleventyConfig.setBrowserSyncConfig({ open: true });

  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(readingTime);

  eleventyConfig
    .addPassthroughCopy({ "src/_static/img": "img" })
    .addPassthroughCopy({ "src/_static/favicon": "favicon" });

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
    if (outputPath.endsWith(".html")) {
      return htmlmin.minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        useShortDoctype: true,
      });
    }
    return content;
  });

  eleventyConfig.addFilter("readableDate", (dateObj, locale) => {
    const dt = DateTime.fromJSDate(dateObj, { zone: "utc" });
    const localeMap = {
      'en-us': 'en-US',
      'el': 'el-GR',
      'tr': 'tr-TR'
    };
    return dt.setLocale(localeMap[locale] || localeMap[defaultLocale]).toFormat("dd LLL yyyy");
  });

  eleventyConfig.addLiquidFilter("dateToRfc3339", pluginRss.dateToRfc3339);

  eleventyConfig.addGlobalData("supportedLocales", supportedLocales);
  eleventyConfig.addGlobalData("defaultLocale", defaultLocale);

  eleventyConfig.addFilter("localizeUrl", (url, locale) => {
    if (locale === defaultLocale) return url;
    return `/${locale}${url}`;
  });

  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/blog/**/*.md").reverse();
  });

  supportedLocales.forEach(locale => {
    eleventyConfig.addCollection(`posts_${locale.replace('-', '_')}`, function(collectionApi) {
      return collectionApi.getFilteredByGlob(`src/blog/**/${locale}.md`).reverse();
    });
  });

  return {
    passthroughFileCopy: true,
    dir: {
      input: "./src/",
      includes: "/_includes/",
      layouts: "/_layouts/",
      data: "/_data/",
      output: "./_site/",
    },
  };
};