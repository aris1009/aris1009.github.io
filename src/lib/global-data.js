const { SUPPORTED_LOCALES, DEFAULT_LOCALE } = require("./constants");

function getLocale() {
  return function() {
    const pathParts = this.page.filePathStem.split('/');
    if (pathParts.includes('el')) return 'el';
    if (pathParts.includes('tr')) return 'tr';
    return DEFAULT_LOCALE;
  };
}

module.exports = {
  supportedLocales: SUPPORTED_LOCALES,
  getLocale
};