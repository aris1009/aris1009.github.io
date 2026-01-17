import { BLOG_GLOBS } from "./constants.js";

// Factory function to create posts collection for any locale
function createPostsCollection(locale) {
  return function(collectionApi) {
    return collectionApi.getFilteredByGlob(BLOG_GLOBS[locale]).filter(post => !post.data.draft).reverse();
  };
}

// Create locale-specific collection functions
export const postsEn_us = createPostsCollection("en-us");
export const postsEl = createPostsCollection("el");
export const postsTr = createPostsCollection("tr");

export function allPosts(collectionApi) {
  return [
    ...collectionApi.getFilteredByGlob(BLOG_GLOBS["en-us"]),
    ...collectionApi.getFilteredByGlob(BLOG_GLOBS.el),
    ...collectionApi.getFilteredByGlob(BLOG_GLOBS.tr)
  ].filter(post => !post.data.draft).sort((a, b) => b.date - a.date);
}

export function dictionary(collectionApi) {
  return collectionApi.getFilteredByGlob("src/pages/dictionary.njk");
}
