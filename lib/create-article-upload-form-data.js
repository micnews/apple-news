'use strict';

const assert = require('assert');

module.exports = function createArticleUploadFormData (article, bundleFiles, metadata) {
  bundleFiles = bundleFiles || {};
  assert(typeof bundleFiles['article.json'] === 'undefined', 'bundle cannot contain article.json file');
  assert(typeof bundleFiles['metadata'] === 'undefined', 'bundle cannot contain metadata file');
  metadata = metadata || {};
  const articleJson = JSON.stringify(article);
  const result = [{
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
    const url = bundleFiles[name];
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
