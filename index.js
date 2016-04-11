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

      makeRequest('GET', '/channels/' + channelId, {}, function (err, res, body) {
        if (err) {
          return cb(err);
        }

        // Endpoint returns 200 on success
        if (res.statusCode !== 200) {
          return cb(new Error('readChannel error code ' + res.statusCode));
        }

        return cb(null, body);
      });
    },
    listSections: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.channelId === 'string', 'opts.channelId required');
      var channelId = opts.channelId;

      makeRequest('GET', '/channels/' + channelId + '/sections', {}, function (err, res, body) {
        if (err) {
          return cb(err);
        }

        // Endpoint returns 200 on success
        if (res.statusCode !== 200) {
          return cb(new Error('readChannel error code ' + res.statusCode));
        }

        return cb(null, body);
      });
    },
    readSection: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.sectionId === 'string', 'opts.sectionId required');
      var sectionId = opts.sectionId;

      makeRequest('GET', '/sections/' + sectionId, {}, function (err, res, body) {
        if (err) {
          return cb(err);
        }

        // Endpoint returns 200 on success
        if (res.statusCode !== 200) {
          return cb(new Error('readChannel error code ' + res.statusCode));
        }

        return cb(null, body);
      });
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
      }, function (err, res, body) {
        if (err) {
          return cb(err);
        }

        // Endpoint returns 201 on success
        if (res.statusCode !== 201) {
          return cb(new Error('createArticle error code ' + res.statusCode));
        }

        return cb(null, body);
      });
    },
    readArticle: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.articleId === 'string', 'opts.articleId required');
      var articleId = opts.articleId;

      makeRequest('GET', '/articles/' + articleId, {}, function (err, res, body) {
        if (err) {
          return cb(err);
        }

        // Endpoint returns 200 on success
        if (res.statusCode !== 200) {
          return cb(new Error('readChannel error code ' + res.statusCode));
        }

        return cb(null, body);
      });
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
      }, function (err, res, body) {
        if (err) {
          return cb(err);
        }

        // Endpoint returns 200 on success
        if (res.statusCode !== 200) {
          return cb(new Error('updateArticle error code ' + res.statusCode));
        }

        return cb(null, body);
      });
    },
    deleteArticle: function (opts, cb) {
      assert(Object(opts) === opts, 'opts required');
      assert(typeof cb === 'function', 'cb required');
      assert(typeof opts.articleId === 'string', 'opts.articleId required');
      var articleId = opts.articleId;

      makeRequest('DELETE', '/articles/' + articleId, {}, function (err, res, body) {
        if (err) {
          return cb(err);
        }

        // Endpoint returns 204 No Content on success, with no response body
        if (res.statusCode !== 204) {
          return cb(new Error('deleteArticle error code ' + res.statusCode));
        }

        return cb(null);
      });
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

      makeRequest('GET', endpoint, {}, function (err, res, body) {
        if (err) {
          return cb(err);
        }

        // Endpoint returns 200 on success
        if (res.statusCode !== 200) {
          return cb(new Error('searchArticles error code ' + res.statusCode));
        }

        return cb(null, body);
      });
    }
  };
};
