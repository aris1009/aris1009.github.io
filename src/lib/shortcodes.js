function currentYear() {
  return `${new Date().getFullYear()}`;
}

function externalLink(text, url, ariaLabel = '') {
  const label = ariaLabel || `${text} (opens in new tab)`;
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="external-link inline-flex items-center" aria-label="${label}"><span class="link-text">${text}</span><span class="emoji-indicator external-emoji" aria-hidden="true">↗️</span></a>`;
}

function internalLink(text, url, ariaLabel = '') {
  const label = ariaLabel || text;
  return `<a href="${url}" class="internal-link inline-flex items-center" aria-label="${label}"><span class="link-text">${text}</span><span class="emoji-indicator internal-emoji" aria-hidden="true">➡️</span></a>`;
}

function dictionaryLink(text, term) {
  const dictionary = require('../_data/dictionary.js');
  const definition = dictionary[term];
  let definitionText = 'Term not found in dictionary';

  if (definition) {
    definitionText = definition['en-us'] || 'Definition not available';
  }

  // Use slot="content" for HTML content in tooltip
  return `<sl-tooltip placement="bottom" data-testid="dictionary-tooltip-${term}">
    <div slot="content" class="dictionary-tooltip-content">
      <div class="tooltip-term">${term.charAt(0).toUpperCase() + term.slice(1)}</div>
      <div class="tooltip-definition">${definitionText}</div>
    </div>
    <button class="dictionary-link inline-flex items-center" data-testid="dictionary-link-${term}" aria-label="Definition of ${term}">
      <span class="dictionary-text">${text}</span>
      <span class="emoji-indicator dictionary-emoji" data-testid="dictionary-emoji-${term}" aria-hidden="true">📘</span>
    </button>
  </sl-tooltip>`;
}

module.exports = {
  currentYear,
  externalLink,
  internalLink,
  dictionaryLink
};