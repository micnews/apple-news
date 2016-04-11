'use strict';

var assert = require('assert');

module.exports = function createArticleUploadFormData (article, bundleFiles, metadata) {
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
};
