const { DateTime } = require("luxon");
const htmlmin = require("html-minifier");
const readingTime = require("eleventy-plugin-reading-time");
const rssPlugin = require("@11ty/eleventy-plugin-rss");
const navigationPlugin = require("@11ty/eleventy-navigation");
const i18n = require("eleventy-plugin-i18n");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(readingTime);
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(navigationPlugin);
  
  eleventyConfig.addPlugin(i18n, {
    translations: require("./src/_data/translations.js"),
    fallbackLocales: {
      '': 'en-us',
      '404.html': 'en-us',
      'el': 'en-us',
      'tr': 'en-us'
    },
    markdownIteration: true
  });

  eleventyConfig.addPassthroughCopy("src/_static");
  eleventyConfig.addPassthroughCopy({"src/_static/img": "img"});

  eleventyConfig.addFilter("readableDate", (dateObj, locale = "en-us") => {
    const localeMap = {
      'en-us': 'en-US',
      'el': 'el',
      'tr': 'tr'
    };
    return DateTime.fromJSDate(dateObj, { zone: "utc" })
      .setLocale(localeMap[locale] || 'en-US')
      .toFormat("dd LLL yyyy");
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("head", (array, n) => {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if (n < 0) {
      return array.slice(n);
    }
    return array.slice(0, n);
  });

  eleventyConfig.addFilter("min", (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
  });

  eleventyConfig.addFilter("localizedReadingTime", function(content, locale = "en-us") {
    const translations = require("./src/_data/translations.js");
    const readingTimeText = eleventyConfig.getFilter("readingTime")(content);
    const timeMatch = readingTimeText.match(/(\d+)/);
    
    if (!timeMatch) return readingTimeText;
    
    const time = timeMatch[1];
    const readText = translations.article.readTime[locale] || 'read';
    const format = translations.article.readTimeFormat[locale] || '{time} min {readText}';
    
    return format.replace('{time}', time).replace('{readText}', readText);
  });

  eleventyConfig.addGlobalData("supportedLocales", ["en-us", "el", "tr"]);

  eleventyConfig.addGlobalData("locale", () => {
    return function() {
      const pathParts = this.page.filePathStem.split('/');
      if (pathParts.includes('el')) return 'el';
      if (pathParts.includes('tr')) return 'tr';
      return 'en-us';
    };
  });

  eleventyConfig.addCollection("postsEn_us", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/blog/en/*.md").filter(post => !post.data.draft);
  });

  eleventyConfig.addCollection("postsEl", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/blog/el/*.md").filter(post => !post.data.draft);
  });

  eleventyConfig.addCollection("postsTr", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/blog/tr/*.md").filter(post => !post.data.draft);
  });

  eleventyConfig.addCollection("allPosts", function(collectionApi) {
    return [
      ...collectionApi.getFilteredByGlob("src/blog/en/*.md"),
      ...collectionApi.getFilteredByGlob("src/blog/el/*.md"),
      ...collectionApi.getFilteredByGlob("src/blog/tr/*.md")
    ].filter(post => !post.data.draft).sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
      return minified;
    }
    return content;
  });

  eleventyConfig.addShortcode("currentYear", () => `${new Date().getFullYear()}`);

  return {
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ],
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