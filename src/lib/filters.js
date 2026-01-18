import { DateTime } from "luxon";
import { LOCALE_MAP, DEFAULT_LOCALE, EXCLUDED_TAGS } from "./constants.js";
import translations from "../_data/translations.js";

export function readableDate(dateObj, locale = DEFAULT_LOCALE) {
  return DateTime.fromJSDate(dateObj, { zone: "utc" })
    .setLocale(LOCALE_MAP[locale] || LOCALE_MAP[DEFAULT_LOCALE])
    .toFormat("dd LLL yyyy");
}

export function htmlDateString(dateObj) {
  return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
}

export function head(array, n) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }
  if (n < 0) {
    return array.slice(n);
  }
  return array.slice(0, n);
}

export function min(...numbers) {
  return Math.min.apply(null, numbers);
}

export function filterTagList(tags) {
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

// Calculate reading time from content (avg 200 words per minute)
function calculateReadingTime(content) {
  if (!content) return 1;
  const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = plainText.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function localizedReadingTime(content, locale = DEFAULT_LOCALE) {
  const time = calculateReadingTime(content);
  const readText = getTranslatedText(translations, 'article.readTime', locale, 'read');
  const format = getTranslatedText(translations, 'article.readTimeFormat', locale, '{time} min {readText}');
  
  return format.replace('{time}', time).replace('{readText}', readText);
}

export function getDictionaryTerms(dictionaryData, locale = DEFAULT_LOCALE) {
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

export function getAlternateLanguages(allPosts, pageUrl) {
  if (!pageUrl?.startsWith('/blog/') || !Array.isArray(allPosts)) {
    return [];
  }

  const urlParts = pageUrl.split('/').filter(Boolean);
  const slug = urlParts[urlParts.length - 1];

  return allPosts
    .filter(post => {
      const postSlug = post.url.split('/').filter(Boolean).pop();
      return postSlug === slug;
    })
    .map(post => ({
      locale: post.data.locale,
      hreflang: LOCALE_MAP[post.data.locale] || post.data.locale,
      url: post.url
    }));
}
