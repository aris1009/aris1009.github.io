import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./constants.js";

export function getLocale() {
  return function() {
    const pathParts = this.page.filePathStem.split('/');
    if (pathParts.includes('el')) return 'el';
    if (pathParts.includes('tr')) return 'tr';
    return DEFAULT_LOCALE;
  };
}

export const supportedLocales = SUPPORTED_LOCALES;
