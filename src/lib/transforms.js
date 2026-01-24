import htmlmin from "html-minifier";
import { HTML_MINIFY_OPTIONS } from "./constants.js";

export function htmlminTransform(content, outputPath) {
  if (outputPath && outputPath.endsWith(".html")) {
    try {
      return htmlmin.minify(content, HTML_MINIFY_OPTIONS);
    } catch (error) {
      console.warn(`HTML minification failed for ${outputPath}: ${error.message}`);
      return content; // Return unminified content if minification fails
    }
  }
  return content;
}

export function addHeaderAnchors(content, outputPath) {
  if (!outputPath || !outputPath.endsWith(".html")) {
    return content;
  }

  // Only add anchor links if this is a blog post (has data-blog-post attribute)
  if (!content.includes('data-blog-post')) {
    return content;
  }

  // Add anchor links to h2 headings with IDs (matches both with and without tabindex)
  return content.replace(
    /<h2 id="([^"]+)"([^>]*)>/g,
    (_match, headingId, otherAttrs) => {
      return `<h2 id="${headingId}"${otherAttrs}>
        <a href="#${headingId}" class="header-anchor" data-testid="anchor-link-${headingId}" aria-label="Link to this section">
          <sl-icon name="paragraph" library="default"></sl-icon>
        </a>`;
    }
  );
}

/**
 * Process remaining asterisks that weren't converted to <em>/<strong> tags by markdown-it.
 *
 * THE BUG:
 * When Nunjucks shortcodes (e.g., {% dictionaryLink %}) are used in markdown files,
 * Eleventy processes them BEFORE markdown-it runs (markdownTemplateEngine: "njk").
 * This means shortcodes that output HTML get injected into the markdown source.
 *
 * When markdown-it encounters inline HTML in list items, it treats subsequent content
 * as plain text and stops processing markdown syntax like emphasis markers (*text*).
 *
 * Example markdown:
 *   - {% dictionaryLink "Term", "term" %} capture *why* decisions
 *
 * After Nunjucks processing:
 *   - <sl-tooltip>...</sl-tooltip> capture *why* decisions
 *
 * markdown-it sees the HTML and leaves the asterisks as literal text.
 *
 * ATTEMPTED SOLUTIONS:
 * 1. markdown-it-emphasis-alt plugin - Failed because it operates at the tokenizer
 *    level, which runs AFTER markdown-it decides whether to parse inline elements.
 *    The plugin never gets invoked for text that markdown-it already classified as
 *    "plain text after HTML."
 *
 * 2. Custom markdown-it rules - Failed for the same reason. By the time custom rules
 *    run, markdown-it has already decided not to process the text for inline elements.
 *
 * 3. Restructuring shortcodes - Would require modifying 100+ markdown files and
 *    limiting how authors can write content. Not scalable or user-friendly.
 *
 * FINAL SOLUTION:
 * Post-process the final HTML after all markdown-it processing is complete.
 * This transform runs after markdown-it but before HTML minification, converting
 * any remaining *text* and **text** patterns in text nodes to <em> and <strong> tags.
 *
 * This approach is reliable because:
 * - It operates on the final HTML, after all other processing
 * - It only processes text nodes (content between > and <), never HTML attributes
 * - It only runs on blog posts that use the data-blog-post attribute
 * - It handles both single (*) and double (**) asterisk emphasis
 *
 * @param {string} content - The HTML content to process
 * @param {string} outputPath - The output file path
 * @returns {string} The processed HTML with asterisks converted to emphasis tags
 */
export function processEmphasisInHTML(content, outputPath) {
  if (!outputPath || !outputPath.endsWith(".html")) {
    return content;
  }

  if (!content.includes('data-blog-post')) {
    return content;
  }

  return content.replace(
    />([^<]+)</g,
    (match, textContent) => {
      if (!textContent.includes('*')) {
        return match;
      }

      let processed = textContent.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*([^*]+?)\*/g, '<em>$1</em>');

      return `>${processed}<`;
    }
  );
}
