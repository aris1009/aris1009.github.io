export const SUPPORTED_LOCALES = ["en-us", "el", "tr"];

export const LOCALE_MAP = {
  'en-us': 'en-US',
  'el': 'el',
  'tr': 'tr'
};

export const FALLBACK_LOCALES = {
  '*': 'en-us'
};

export const DEFAULT_LOCALE = 'en-us';

export const EXCLUDED_TAGS = ["all", "nav", "post", "posts"];

export const BLOG_GLOBS = {
  "en-us": "src/blog/en-us/*.md",
  el: "src/blog/el/*.md",
  tr: "src/blog/tr/*.md"
};

export const TEMPLATE_FORMATS = [
  "md",
  "njk",
  "html",
  "liquid",
  "webmanifest"
];

export const HTML_MINIFY_OPTIONS = {
  useShortDoctype: true,
  removeComments: true,
  collapseWhitespace: true,
  conservativeCollapse: true,
  decodeEntities: true
};
