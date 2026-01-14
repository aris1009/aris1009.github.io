// Article bundle - combines reading progress, code copy buttons, and dictionary tooltips
import { ReadingProgressBar } from './reading-progress.js';
import { addCopyButtonsToCodeBlocks } from './code-copy-buttons.js';

export default class ArticleBundle {
  static init() {
    // Initialize reading progress for articles
    const readingProgress = new ReadingProgressBar();
    readingProgress.init();

    // Initialize code copy buttons
    addCopyButtonsToCodeBlocks();

    // Dictionary tooltips are handled by the autoloader in the template
  }
}