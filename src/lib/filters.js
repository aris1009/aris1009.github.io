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

function localizedReadingTime(content, locale = DEFAULT_LOCALE, eleventyConfig) {
  const translations = require("../_data/translations.js");
  const readingTimeText = eleventyConfig.getFilter("readingTime")(content);
  const timeMatch = readingTimeText.match(/(\d+)/);
  
  if (!timeMatch) return readingTimeText;
  
  const time = timeMatch[1];
  const readText = translations.article.readTime[locale] || 'read';
  const format = translations.article.readTimeFormat[locale] || '{time} min {readText}';
  
  return format.replace('{time}', time).replace('{readText}', readText);
}

module.exports = {
  readableDate,
  htmlDateString,
  head,
  min,
  filterTagList,
  localizedReadingTime
};