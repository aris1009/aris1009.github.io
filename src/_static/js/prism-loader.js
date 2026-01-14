// Prism loader bundle - combines syntax highlighting and code features
import Prism from './prism.js';
import { addCopyButtonsToCodeBlocks } from './code-copy-buttons.js';

export default class PrismLoaderBundle {
  static init() {
    // Initialize Prism syntax highlighting
    Prism.highlightAll();

    // Initialize code copy buttons (integrated with Prism)
    addCopyButtonsToCodeBlocks();
  }

  // Re-highlight code blocks after dynamic content changes
  static highlightCodeBlocks() {
    Prism.highlightAll();
  }
}