# Link System Documentation

## Current Link Types

### 1. External Links
- **Shortcode**: `{% externalLink "text", "url", "ariaLabel" %}`  
- **Styling**: Includes external emoji indicator (↗️)
- **Behavior**: Opens in new tab with `target="_blank"` and `rel="noopener noreferrer"`

### 2. Internal Links  
- **Shortcode**: `{% internalLink "text", "url", "ariaLabel" %}`
- **Styling**: Includes internal emoji indicator (➡️)
- **Behavior**: Regular navigation within site

### 3. Dictionary Links
- **Shortcode**: `{% dictionaryLink "text", "term" %}`
- **Styling**: Includes dictionary emoji indicator (📘)
- **Behavior**: Shows tooltip with definition on interaction
- **Data Source**: `/src/_data/dictionary.js` with multilingual definitions

## Usage Examples in Blog Posts
```markdown
- External: {% externalLink "cybersecurity researchers", "https://blog.eclecticiq.com/..." %}
- Internal: {% internalLink "dictionary", "/en-us/dictionary/" %}  
- Dictionary: {% dictionaryLink "malware", "malware" %}
```

## Implementation Location
All link shortcodes are defined in `/src/lib/shortcodes.js`