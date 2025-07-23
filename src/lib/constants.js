const SUPPORTED_LOCALES = ["en-us", "el", "tr"];

const LOCALE_MAP = {
  'en-us': 'en-US',
  'el': 'el',
  'tr': 'tr'
};

const FALLBACK_LOCALES = {
  '': 'en-us',
  '404.html': 'en-us',
  'el': 'en-us',
  'tr': 'en-us'
};

const DEFAULT_LOCALE = 'en-us';

const EXCLUDED_TAGS = ["all", "nav", "post", "posts"];

const BLOG_GLOBS = {
  "en-us": "src/blog/en-us/*.md",
  el: "src/blog/el/*.md",
  tr: "src/blog/tr/*.md"
};

const TEMPLATE_FORMATS = [
  "md",
  "njk", 
  "html",
  "liquid"
];

const HTML_MINIFY_OPTIONS = {
  useShortDoctype: true,
  removeComments: true,
  collapseWhitespace: true,
  decodeEntities: true
};

module.exports = {
  SUPPORTED_LOCALES,
  LOCALE_MAP,
  FALLBACK_LOCALES,
  DEFAULT_LOCALE,
  EXCLUDED_TAGS,
  BLOG_GLOBS,
  TEMPLATE_FORMATS,
  HTML_MINIFY_OPTIONS
};