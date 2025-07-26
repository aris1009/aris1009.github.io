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

function dictionaryLink(text, term, locale = 'en-us') {
  const dictionary = require('../_data/dictionary.js');
  const definition = dictionary[term];
  let definitionText = 'Term not found in dictionary';

  if (definition) {
    // Try the requested locale first, then fallback to English, then error message
    definitionText = definition[locale] || definition['en-us'] || 'Definition not available';
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

function themeToggle() {
  return `<button 
    class="theme-toggle inline-flex items-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200" 
    onclick="window.themeManager.toggle()" 
    aria-label="Toggle theme"
    data-testid="theme-toggle">
    <span class="theme-icon light-icon" data-testid="light-icon" aria-hidden="true">☀️</span>
    <span class="theme-icon dark-icon" data-testid="dark-icon" aria-hidden="true">🌙</span>
  </button>`;
}

function articleLabels(difficulty, contentType, technologies = [], locale = 'en-us') {
  const translations = require("../_data/translations.js");
  
  if (!difficulty && !contentType && (!technologies || technologies.length === 0)) {
    return '';
  }

  const labels = [];
  
  // Difficulty label (highest priority)
  if (difficulty) {
    const difficultyText = translations.labels.difficulty[difficulty]?.[locale] || 
                          translations.labels.difficulty[difficulty]?.['en-us'] || 
                          difficulty;
    const ariaLabel = `${translations.labels.ariaLabels.difficultyLevel[locale] || 'Difficulty level'}: ${difficultyText}`;
    
    const variants = {
      'beginner': 'success',
      'expert': 'primary'
    };

    const variant = variants[difficulty] || 'neutral';
    
    labels.push(`<sl-tag variant="${variant}" size="small" pill data-testid="difficulty-label-${difficulty}" role="img" aria-label="${ariaLabel}">
      ${difficultyText}
    </sl-tag>`);
  }

  // Content type label 
  if (contentType) {
    const contentTypeText = translations.labels.contentType[contentType]?.[locale] || 
                           translations.labels.contentType[contentType]?.['en-us'] || 
                           contentType;
    const ariaLabel = `${translations.labels.ariaLabels.contentType[locale] || 'Content type'}: ${contentTypeText}`;
    
    labels.push(`<sl-tag sl-tag size="small" pill data-testid="content-type-label-${contentType}" role="img" aria-label="${ariaLabel}">
      ${contentTypeText}
    </sl-tag>`);
  }

  // Technology tags (limit to 5 for UI clarity)
  if (technologies && Array.isArray(technologies)) {
    technologies.slice(0, 5).forEach(tech => {
      const techId = tech.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const ariaLabel = `${translations.labels.ariaLabels.technology[locale] || 'Technology'}: ${tech}`;
      
      labels.push(`<sl-tag size="small" pill data-testid="tech-tag-${techId}" role="img" aria-label="${ariaLabel}">
        ${tech}
      </sl-tag>`);
    });
  }

  if (labels.length === 0) {
    return '';
  }

  const classificationsLabel = translations.labels.ariaLabels.contentClassifications[locale] || 'Content classifications';
  
  return `<div class="article-labels flex flex-wrap gap-2 mb-4" role="group" aria-label="${classificationsLabel}">
    ${labels.join('\n    ')}
  </div>`;
}

module.exports = {
  currentYear,
  externalLink,
  internalLink,
  dictionaryLink,
  themeToggle,
  articleLabels
};