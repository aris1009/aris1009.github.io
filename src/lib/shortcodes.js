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
  
  return `<button class="dictionary-link inline-flex items-center" data-dictionary-term="${term}" aria-expanded="false" aria-describedby="tooltip-${term}" title="Click to see definition">
    <span class="dictionary-text">${text}</span>
    <span class="emoji-indicator dictionary-emoji" aria-hidden="true">📘</span>
  </button>
  <div id="tooltip-${term}" class="dictionary-tooltip hidden" role="tooltip" aria-live="polite">
    <div class="tooltip-content">
      <button class="tooltip-close" aria-label="Close definition">×</button>
      <div class="tooltip-term">${term.charAt(0).toUpperCase() + term.slice(1)}</div>
      <div class="tooltip-definition">${definitionText}</div>
    </div>
  </div>`;
}

module.exports = {
  currentYear,
  externalLink,
  internalLink,  
  dictionaryLink
};