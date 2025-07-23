# Dictionary Implementation

## Overview
The blog includes an interactive dictionary feature for technical terms with multilingual support.

## Components

### 1. Dictionary Data
- **File**: `src/_data/dictionary.js`
- **Structure**: Object with term keys and language-specific definitions
- **Languages**: English (en-us), Greek (el), Turkish (tr)

### 2. Dictionary Shortcode
- **File**: `src/lib/shortcodes.js` 
- **Function**: `dictionaryLink(text, term)`
- **Generates**: Button with tooltip HTML structure
- **Usage**: `{% dictionaryLink "malware", "malware" %}`

### 3. JavaScript Component
- **File**: `src/_static/js/link-component.js`
- **Class**: `LinkComponent`
- **Features**: 
  - Click handling for dictionary links
  - Tooltip positioning and visibility
  - Keyboard accessibility (Escape key)
  - Focus management

### 4. CSS Styles
- **File**: `src/_tailwindCSS/raw-website.css`
- **Classes**: `.dictionary-link`, `.dictionary-tooltip`, `.tooltip-content`
- **Features**: Responsive design, dark mode support, hover effects

### 5. Dictionary Page
- **File**: `src/pages/dictionary.njk`
- **Features**: Search functionality, multilingual terms display