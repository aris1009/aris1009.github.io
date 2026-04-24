import readingTime from "eleventy-plugin-reading-time";
import navigationPlugin from "@11ty/eleventy-navigation";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import i18n from "eleventy-plugin-i18n";
import { I18nPlugin } from "@11ty/eleventy";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import pluginTOC from "eleventy-plugin-toc";

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

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

  const md = markdownIt({ html: true, linkify: true, typographer: true })
    .use(markdownItAnchor, {
      slugify: (s) =>
        s.toLowerCase()
         .trim()
         .replace(/[\s+~\/]/g, '-')
         .replace(/[().`,%·'"!?¿:@*]/g, '')
    });


  eleventyConfig.setLibrary('md', md);

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

  eleventyConfig.addPlugin(I18nPlugin, {
    defaultLanguage: "en-us"
  });

  // Mermaid: self-hosted. We drop @kevingimbel/eleventy-plugin-mermaid because
  // its mermaid_js shortcode imports from https://unpkg.com/..., which is
  // blocked by the site CSP (script-src 'self' https://cdn.jsdelivr.net ...).
  // Instead, scripts/build-mermaid.js Rollup-bundles mermaid from node_modules
  // into /_static/js/vendor/mermaid/ and we emit a same-origin <script>.
  // Themeing is handled at runtime by src/_static/js/mermaid-theme-sync.js.
  eleventyConfig.addShortcode("mermaid_js", () => {
    return '<script type="module" src="/_static/js/vendor/mermaid/index.js"></script>';
  });

  // Markdown highlighter for fenced ```mermaid blocks: emit <pre class="mermaid">
  // so mermaid.run() picks it up. (Replaces the highlighter the plugin used to
  // register.) Prism language prefixing for other languages is handled below.

  eleventyConfig.addMarkdownHighlighter((str, language) => {
    const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Mermaid fenced blocks → <pre class="mermaid"> for mermaid.run() to pick up.
    if (language === 'mermaid') {
      return `<pre class="mermaid">${escape(str)}</pre>`;
    }

    // Prism.js language-prefixed class for syntax-highlighted blocks.
    if (language) {
      return `<pre class="language-${language}"><code class="language-${language}">${escape(str)}</code></pre>`;
    }

    return `<pre><code>${escape(str)}</code></pre>`;
  });

  eleventyConfig.addPassthroughCopy("src/_static");
  eleventyConfig.addPassthroughCopy({ "src/_static/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/_static/sw.js": "sw.js" });
  eleventyConfig.addPassthroughCopy({ "src/_static/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/_static/pgp.asc": "pgp.asc" });
  eleventyConfig.addPassthroughCopy({ "src/_static/wordlists": "wordlists" });

  eleventyConfig.addFilter("readableDate", filters.readableDate);
  eleventyConfig.addFilter("htmlDateString", filters.htmlDateString);
  eleventyConfig.addFilter("head", filters.head);
  eleventyConfig.addFilter("min", filters.min);
  eleventyConfig.addFilter("filterTagList", filters.filterTagList);
  eleventyConfig.addFilter("localizedReadingTime", filters.localizedReadingTime);
  eleventyConfig.addFilter("getDictionaryTerms", filters.getDictionaryTerms);
  eleventyConfig.addFilter("languageSwitcherOptions", filters.languageSwitcherOptions);
  eleventyConfig.addFilter("match", filters.match);

  eleventyConfig.addGlobalData("supportedLocales", globalData.supportedLocales);
  eleventyConfig.addGlobalData("locale", globalData.getLocale);
  eleventyConfig.addGlobalData("dictionary", dictionary);
  eleventyConfig.addGlobalData("buildVersion", process.env.BUILD_VERSION || "dev");

  eleventyConfig.addCollection("postsEn_us", collections.postsEn_us);
  eleventyConfig.addCollection("postsEl", collections.postsEl);
  eleventyConfig.addCollection("postsTr", collections.postsTr);
  eleventyConfig.addCollection("allPosts", collections.allPosts);
  eleventyConfig.addCollection("dictionary", collections.dictionary);

  eleventyConfig.addTransform("addHeaderAnchors", transforms.addHeaderAnchors);
  eleventyConfig.addTransform("processEmphasisInHTML", transforms.processEmphasisInHTML);
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

  // Inject build hash into service worker for cache busting
  eleventyConfig.on("eleventy.after", () => {
    let buildHash;
    try {
      buildHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    } catch {
      buildHash = Date.now().toString(36);
    }
    const swPath = "./_site/sw.js";
    try {
      const content = readFileSync(swPath, "utf-8");
      writeFileSync(swPath, content.replace("__BUILD_HASH__", buildHash));
    } catch {
      // sw.js may not exist in test environments
    }
  });

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
