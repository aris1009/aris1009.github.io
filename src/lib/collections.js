const { BLOG_GLOBS } = require("./constants");

// Factory function to create posts collection for any locale
function createPostsCollection(locale) {
  return function(collectionApi) {
    return collectionApi.getFilteredByGlob(BLOG_GLOBS[locale]).filter(post => !post.data.draft).reverse();
  };
}

// Create locale-specific collection functions
const postsEn_us = createPostsCollection("en-us");
const postsEl = createPostsCollection("el");
const postsTr = createPostsCollection("tr");

function allPosts(collectionApi) {
  return [
    ...collectionApi.getFilteredByGlob(BLOG_GLOBS["en-us"]),
    ...collectionApi.getFilteredByGlob(BLOG_GLOBS.el),
    ...collectionApi.getFilteredByGlob(BLOG_GLOBS.tr)
  ].filter(post => !post.data.draft).sort((a, b) => b.date - a.date);
}

function dictionary(collectionApi) {
  return collectionApi.getFilteredByGlob("src/pages/dictionary.njk");
}

module.exports = {
  postsEn_us,
  postsEl,
  postsTr,
  allPosts,
  dictionary
};