// Shoelace bundle - combines all Shoelace web components used in the site
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/copy-button/copy-button.js';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';

// Set the base path for Shoelace assets
setBasePath('./');

export default class ShoelaceBundle {
  static init() {
    // Shoelace components are loaded via ES6 imports above
    // No additional initialization needed
  }
}