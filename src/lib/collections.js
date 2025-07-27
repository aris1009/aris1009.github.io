const { BLOG_GLOBS } = require("./constants");

function postsEn_us(collectionApi) {
  return collectionApi.getFilteredByGlob(BLOG_GLOBS["en-us"]).filter(post => !post.data.draft).reverse();
}

function postsEl(collectionApi) {
  return collectionApi.getFilteredByGlob(BLOG_GLOBS.el).filter(post => !post.data.draft).reverse();
}

function postsTr(collectionApi) {
  return collectionApi.getFilteredByGlob(BLOG_GLOBS.tr).filter(post => !post.data.draft).reverse();
}

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