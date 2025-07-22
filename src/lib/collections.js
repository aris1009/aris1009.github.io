const { BLOG_GLOBS } = require("./constants");

function postsEn_us(collectionApi) {
  return collectionApi.getFilteredByGlob(BLOG_GLOBS.en).filter(post => !post.data.draft);
}

function postsEl(collectionApi) {
  return collectionApi.getFilteredByGlob(BLOG_GLOBS.el).filter(post => !post.data.draft);
}

function postsTr(collectionApi) {
  return collectionApi.getFilteredByGlob(BLOG_GLOBS.tr).filter(post => !post.data.draft);
}

function allPosts(collectionApi) {
  return [
    ...collectionApi.getFilteredByGlob(BLOG_GLOBS.en),
    ...collectionApi.getFilteredByGlob(BLOG_GLOBS.el),
    ...collectionApi.getFilteredByGlob(BLOG_GLOBS.tr)
  ].filter(post => !post.data.draft).sort((a, b) => b.date - a.date);
}

module.exports = {
  postsEn_us,
  postsEl,
  postsTr,
  allPosts
};