import readingTime from "eleventy-plugin-reading-time";
import navigationPlugin from "@11ty/eleventy-navigation";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import i18n from "eleventy-plugin-i18n";
import pluginMermaid from "@kevingimbel/eleventy-plugin-mermaid";

import {
  filters,
  collections,
  transforms,
  shortcodes,
  globalData,
  constants,
  imageShortcodes
} from "./src/lib/index.js";

import meta from "./src/_data/meta.js";
import translations from "./src/_data/translations.js";
import dictionary from "./src/_data/dictionary.js";

export default function (eleventyConfig) {
  // Configure .webmanifest files to use Nunjucks template engine
  eleventyConfig.addExtension("webmanifest", {
    key: "njk",
    extension: "webmanifest"
  });

  eleventyConfig.addPlugin(readingTime);
  eleventyConfig.addPlugin(navigationPlugin);

  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: meta.url
    }
  });

  eleventyConfig.addPlugin(i18n, {
    translations: {
      ...translations
    },
    fallbackLocales: constants.FALLBACK_LOCALES,
    markdownIteration: true
  });

  eleventyConfig.addPlugin(pluginMermaid, {
    mermaid_config: {
      startOnLoad: true,
      theme: 'default'
    }
  });

  // Add language- prefix to code blocks for Prism.js compatibility
  // This must come AFTER mermaid plugin so mermaid blocks are handled first
  const existingHighlighter = eleventyConfig.markdownHighlighter;
  eleventyConfig.addMarkdownHighlighter((str, language) => {
    // Let previous highlighters (like mermaid) handle their languages first
    if (existingHighlighter) {
      const result = existingHighlighter(str, language);
      // If the previous highlighter returned something other than the default,
      // use that result (e.g., mermaid's <pre class="mermaid">)
      if (result && !result.includes(`class="${language}"`)) {
        return result;
      }
    }

    // Add language- prefix for Prism.js
    if (language) {
      const escaped = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre class="language-${language}"><code class="language-${language}">${escaped}</code></pre>`;
    }

    // No language specified
    const escaped = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><code>${escaped}</code></pre>`;
  });

  eleventyConfig.addPassthroughCopy("src/_static");
  eleventyConfig.addPassthroughCopy({ "src/_static/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/_static/sw.js": "sw.js" });

  eleventyConfig.addFilter("readableDate", filters.readableDate);
  eleventyConfig.addFilter("htmlDateString", filters.htmlDateString);
  eleventyConfig.addFilter("head", filters.head);
  eleventyConfig.addFilter("min", filters.min);
  eleventyConfig.addFilter("filterTagList", filters.filterTagList);
  eleventyConfig.addFilter("localizedReadingTime", filters.localizedReadingTime);
  eleventyConfig.addFilter("getDictionaryTerms", filters.getDictionaryTerms);

  eleventyConfig.addGlobalData("supportedLocales", globalData.supportedLocales);
  eleventyConfig.addGlobalData("locale", globalData.getLocale);
  eleventyConfig.addGlobalData("dictionary", dictionary);

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
    webmanifestTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
      output: "_site"
    }
  };
}
