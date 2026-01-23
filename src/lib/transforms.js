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
