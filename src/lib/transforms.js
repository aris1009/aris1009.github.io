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
