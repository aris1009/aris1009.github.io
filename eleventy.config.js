import readingTime from "eleventy-plugin-reading-time";
import navigationPlugin from "@11ty/eleventy-navigation";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import i18n from "eleventy-plugin-i18n";
import pluginMermaid from "@kevingimbel/eleventy-plugin-mermaid";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import pluginTOC from "eleventy-plugin-toc";

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

  // Configure markdown-it with anchor plugin for heading IDs
  eleventyConfig.setLibrary(
    'md',
    markdownIt({ html: true, linkify: true, typographer: true })
      .use(markdownItAnchor, {
        slugify: (s) =>
          s.toLowerCase()
           .trim()
           .replace(/[\s+~\/]/g, '-')
           .replace(/[().`,%·'"!?¿:@*]/g, '')
      })
  );

  eleventyConfig.addPlugin(readingTime);
  eleventyConfig.addPlugin(navigationPlugin);
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ['h2'],
    wrapper: 'nav',
    wrapperClass: 'toc-nav',
    ul: true,
    flat: true
  });

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
      theme: 'base',
      themeVariables: {
        // Light mode defaults (matches blog zinc/slate/sky palette)
        background: '#f4f4f5',
        primaryColor: '#e0f2fe',
        secondaryColor: '#f0f9ff',
        tertiaryColor: '#f8fafc',
        primaryTextColor: '#0f172a',
        secondaryTextColor: '#334155',
        lineColor: '#64748b',
        primaryBorderColor: '#94a3b8',
        mainBkg: '#e0f2fe',
        nodeBorder: '#0284c7',
        actorBkg: '#f1f5f9',
        actorBorder: '#64748b',
        actorTextColor: '#0f172a',
        actorLineColor: '#64748b',
        signalColor: '#0f172a',
        signalTextColor: '#0f172a',
        labelBoxBkgColor: '#e0f2fe',
        labelTextColor: '#0f172a',
        loopTextColor: '#0f172a',
        noteBkgColor: '#fef9c3',
        noteTextColor: '#713f12',
        noteBorderColor: '#fbbf24',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
      }
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
  eleventyConfig.addPassthroughCopy({ "src/_static/js": "js" });

  eleventyConfig.addFilter("readableDate", filters.readableDate);
  eleventyConfig.addFilter("htmlDateString", filters.htmlDateString);
  eleventyConfig.addFilter("head", filters.head);
  eleventyConfig.addFilter("min", filters.min);
  eleventyConfig.addFilter("filterTagList", filters.filterTagList);
  eleventyConfig.addFilter("localizedReadingTime", filters.localizedReadingTime);
  eleventyConfig.addFilter("getDictionaryTerms", filters.getDictionaryTerms);
  eleventyConfig.addFilter("getAlternateLanguages", filters.getAlternateLanguages);
  eleventyConfig.addFilter("match", filters.match);

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
