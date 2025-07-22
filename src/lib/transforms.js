const htmlmin = require("html-minifier");
const { HTML_MINIFY_OPTIONS } = require("./constants");

function htmlminTransform(content, outputPath) {
  if (outputPath && outputPath.endsWith(".html")) {
    let minified = htmlmin.minify(content, HTML_MINIFY_OPTIONS);
    return minified;
  }
  return content;
}

module.exports = {
  htmlminTransform
};