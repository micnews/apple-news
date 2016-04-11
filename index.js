'use strict';

var assert = require('assert');
var setupMakeRequest = require('./lib/make-request');
var createArticleUploadFormData = require('./lib/create-article-upload-form-data');
var articleMetadataFromOpts = require('./lib/article-metadata-from-opts');

module.exports = function (config) {
  assert(typeof config.apiId === 'string', 'config.apiId: API ID is required');
  assert(typeof config.apiSecret === 'string', 'config.apiSecret: API secret is required');

  var makeRequest = setupMakeRequest(config);

  return {
    readChannel: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.channelId === 'string', 'opts.channelId required');
      var channelId = opts.channelId;

      makeRequest('GET', '/channels/' + channelId, {}, cb);
    },
    listSections: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.channelId === 'string', 'opts.channelId required');
      var channelId = opts.channelId;

      makeRequest('GET', '/channels/' + channelId + '/sections', {}, cb);
    },
    readSection: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.sectionId === 'string', 'opts.sectionId required');
      var sectionId = opts.sectionId;

      makeRequest('GET', '/sections/' + sectionId, {}, cb);
    },
    createArticle: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.channelId === 'string', 'opts.channelId required');
      assert(Object(opts.article) === opts.article, 'opts.article required');
      var channelId = opts.channelId;
      var bundleFiles = opts.bundleFiles || [];
      var meta = articleMetadataFromOpts(opts);
      var fd = createArticleUploadFormData(opts.article, bundleFiles, meta);

      makeRequest('POST', '/channels/' + channelId + '/articles', {
        formData: fd
      }, cb);
    },
    readArticle: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.articleId === 'string', 'opts.articleId required');
      var articleId = opts.articleId;

      makeRequest('GET', '/articles/' + articleId, {}, cb);
    },
    updateArticle: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.articleId === 'string', 'opts.articleId required');
      assert(typeof opts.revision === 'string', 'opts.revision required');
      assert(Object(opts.article) === opts.article, 'opts.article required');
      var articleId = opts.articleId;
      var bundleFiles = opts.bundleFiles || [];
      var meta = articleMetadataFromOpts(opts);
      meta.revision = opts.revision;
      var fd = createArticleUploadFormData(opts.article, bundleFiles, meta);

      makeRequest('POST', '/articles/' + articleId, {
        formData: fd
      }, cb);
    },
    deleteArticle: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.articleId === 'string', 'opts.articleId required');
      var articleId = opts.articleId;

      makeRequest('DELETE', '/articles/' + articleId, {}, cb);
    },
    searchArticles: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.channelId === 'string' || typeof opts.sectionId === 'string',
        'opts.channelId or opts.sectionId required');
      var channelId = opts.channelId;
      var sectionId = opts.sectionId;
      var endpoint = channelId
        ? '/channels/' + channelId + '/articles'
        : '/sections/' + sectionId + '/articles';

      makeRequest('GET', endpoint, {}, cb);
    }
  };
};
