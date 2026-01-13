const { DateTime } = require("luxon");
const { LOCALE_MAP, DEFAULT_LOCALE, EXCLUDED_TAGS } = require("./constants");

function readableDate(dateObj, locale = DEFAULT_LOCALE) {
  return DateTime.fromJSDate(dateObj, { zone: "utc" })
    .setLocale(LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE])
    .toFormat("dd LLL yyyy");
}

function htmlDateString(dateObj) {
  return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
}

function head(array, n) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }
  if (n < 0) {
    return array.slice(n);
  }
  return array.slice(0, n);
}

function min(...numbers) {
  return Math.min.apply(null, numbers);
}

function filterTagList(tags) {
  return (tags || []).filter(tag => EXCLUDED_TAGS.indexOf(tag) === -1);
}

// Utility function for translation lookup with fallback (shared with shortcodes)
function getTranslatedText(translations, path, locale, fallback) {
  const keys = path.split('.');
  let current = translations;
  
  for (const key of keys) {
    current = current?.[key];
    if (!current) break;
  }
  
  return current?.[locale] || current?.['en-us'] || fallback;
}

function localizedReadingTime(content, locale = DEFAULT_LOCALE, eleventyConfig) {
  const translations = require("../_data/translations.js");
  const readingTimeText = eleventyConfig.getFilter("readingTime")(content);
  const timeMatch = readingTimeText.match(/(\d+)/);
  
  if (!timeMatch) return readingTimeText;
  
  const time = timeMatch[1];
  const readText = getTranslatedText(translations, 'article.readTime', locale, 'read');
  const format = getTranslatedText(translations, 'article.readTimeFormat', locale, '{time} min {readText}');
  
  return format.replace('{time}', time).replace('{readText}', readText);
}

function getDictionaryTerms(dictionaryData, locale = DEFAULT_LOCALE) {
  if (!dictionaryData || typeof dictionaryData !== 'object') {
    return [];
  }

  return Object.keys(dictionaryData)
    .map(key => ({
      key: key,
      definition: dictionaryData[key][locale] || dictionaryData[key][DEFAULT_LOCALE] || ''
    }))
    .filter(term => term.definition)
    .sort((a, b) => a.key.localeCompare(b.key, LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE]));
}

function getBundlePreloads(pageType) {
  const bundles = {
    core: '/js/core.js',
    featureLoader: '/js/feature-loader.js'
  };

  let preloads = [];

  // Always preload core bundle
  preloads.push(`<script type='module' src='${bundles.core}'></script>`);

  // Always load feature loader with defer
  preloads.push(`<script type='module' src='${bundles.featureLoader}' defer></script>`);

  // Add article bundle preload for blog pages
  if (pageType === 'article') {
    preloads.push(`<link rel="modulepreload" href="/js/article.js">`);
  }

  return preloads.join('\n    ');
}

module.exports = {
  readableDate,
  htmlDateString,
  head,
  min,
  filterTagList,
  localizedReadingTime,
  getDictionaryTerms,
  getBundlePreloads
};