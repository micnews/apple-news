var assert = require('assert');
var crypto = require('crypto');
var moment = require('moment');
var objectAssign = require('object-assign');
var FormData = require('form-data');
var stream = require('stream');
var https = require('https');
var request = require('request');
var async = require('async');
var fileType = require('file-type');

var host = 'news-api.apple.com';
var CRLF = '\r\n';

var validContentTypes = [
  'application/octet-stream', // should be first in this list
  'image/jpeg',
  'image/png',
  'image/gif'
];

function encodeFormData (formData, cb) {
  var form = new FormData();

  async.mapSeries(formData, function (item, callback) {
    var value = item.value;
    var options = item.options;

    function append () {
      var len = typeof value === 'string' ? Buffer.byteLength(value) : value.length;
      var header = '--' + form.getBoundary() + CRLF +
        'Content-Type: ' + options.contentType + CRLF +
        'Content-Disposition: form-data' +
        (item.filename ? '; filename=' + encodeURIComponent(options.filename) : '') +
        (item.name ? '; name=' + encodeURIComponent(item.name) : '') +
        '; size=' + len + CRLF + CRLF;

      form.append(item.name || item.filename, value,
        objectAssign({ header: header, knownLength: len }, options));
      callback();
    }

    if (options.contentType === 'application/json') {
      return append();
    }

    request.get(value, {
      timeout: 5000,
      encoding: null,
      rejectUnauthorized: process.env.NODE_ENV !== 'test'
    }, function (err, res, body) {
      if (err) {
        return callback(err);
      }

      var contentType = fileType(body).mime;
      if (validContentTypes.indexOf(contentType) === -1) {
        contentType = validContentTypes[0];
      }

      options.contentType = contentType;
      value = body;
      return append();
    });
  }, function (err, callback) {
    if (err) {
      return cb(err);
    }

    var converter = new stream.Writable();
    var chunks = [];
    converter._write = function (chunk, enc, cb) {
      chunks.push(chunk);
      cb();
    };

    converter.on('finish', function () {
      return cb(null, {
        headers: form.getHeaders(),
        buffer: Buffer.concat(chunks)
      });
    });

    form.pipe(converter);
  });
}

module.exports = function (config) {
  assert(typeof config.apiId === 'string', 'config.apiId: API ID is required');
  assert(typeof config.apiSecret === 'string', 'config.apiSecret: API secret is required');

  function sendRequest (method, endpoint, post, cb) {
    var date = moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    var canonicalRequest = Buffer(method + 'https://' + (config.host || host) + endpoint + date +
      (post ? post.headers['content-type'] : ''), 'ascii');
    if (post) {
      canonicalRequest = Buffer.concat([canonicalRequest, post.buffer]);
    }

    var key = new Buffer(config.apiSecret, 'base64');
    var signature = crypto.createHmac('sha256', key)
      .update(canonicalRequest, 'utf8')
      .digest('base64');
    var auth = 'HHMAC; key="' + config.apiId +
      '"; signature="' + signature +
      '"; date="' + date + '"';

    var req = https.request({
      method: method,
      host: config.host || host,
      port: config.port || void 0,
      rejectUnauthorized: process.env.NODE_ENV !== 'test',
      path: endpoint,
      headers: objectAssign({
        Accept: 'application/json',
        Authorization: auth
      }, post ? post.headers : {})
    });

    req.on('response', function (res) {
      var result = '';
      var done = false;

      res.on('data', function (chunk) {
        result += chunk.toString();
      });

      res.on('error', function (err) {
        if (!done) {
          done = true;
          cb(err);
        }
      });

      res.on('end', function () {
        if (!done) {
          done = true;
          var parsed = null;

          if (!result) {
            return cb(null, res, null);
          }

          try {
            parsed = JSON.parse(result);
          } catch (e) {
            return cb(e);
          }

          if (parsed.data) {
            return cb(null, res, parsed.data);
          }

          if (parsed.errors && Array.isArray(parsed.errors) &&
              parsed.errors.length > 0 && parsed.errors[0].code) {
            var e = new Error(result);
            e.apiError = parsed.errors[0];
            return cb(e);
          }

          return cb(new Error(result));
        }
      });
    });

    if (post) {
      req.write(post.buffer);
    }

    req.end();
  }

  function makeRequest (method, endpoint, requestOpts, cb) {
    if (method === 'POST' && requestOpts.formData) {
      return encodeFormData(requestOpts.formData || {}, function (err, encoded) {
        if (err) {
          return cb(err);
        }

        sendRequest(method, endpoint, encoded, cb);
      });
    }

    sendRequest(method, endpoint, null, cb);
  }

  function createArticleUploadFormData (article, bundleFiles, metadata) {
    bundleFiles = bundleFiles || {};
    assert(typeof bundleFiles['article.json'] === 'undefined', 'bundle cannot contain article.json file');
    assert(typeof bundleFiles['metadata'] === 'undefined', 'bundle cannot contain metadata file');
    metadata = metadata || {};
    var articleJson = JSON.stringify(article);
    var result = [{
      name: 'article.json',
      filename: 'article.json',
      value: articleJson,
      options: {
        filename: 'article.json',
        contentType: 'application/json'
      }
    }, {
      name: 'metadata',
      value: JSON.stringify({ data: metadata }),
      options: {
        filename: 'metadata',
        contentType: 'application/json'
      }
    }];

    Object.keys(bundleFiles).forEach(function (name, index) {
      var url = bundleFiles[name];
      result.push({
        filename: name,
        name: 'file' + index,
        value: url,
        options: {
          filename: name
        }
      });
    });

    return result;
  }

  function articleMetadataFromOpts (opts) {
    assert(typeof opts.isPreview === 'undefined' || typeof opts.isPreview === 'boolean');
    assert(typeof opts.isSponsored === 'undefined' || typeof opts.isSponsored === 'boolean');

    return {
      isPreview: typeof opts.isPreview === 'boolean' ? opts.isPreview : true,
      isSponsored: !!opts.isSponsored
    };
  }

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
