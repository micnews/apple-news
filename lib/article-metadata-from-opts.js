'use strict';

var assert = require('assert');

module.exports = function articleMetadataFromOpts (opts) {
  assert(typeof opts.isPreview === 'undefined' || typeof opts.isPreview === 'boolean');
  assert(typeof opts.isSponsored === 'undefined' || typeof opts.isSponsored === 'boolean');
  assert(typeof opts.accessoryText === 'undefined' || typeof opts.accessoryText === 'string');
  assert(typeof opts.isCandidateToBeFeatured === 'undefined' || typeof opts.isCandidateToBeFeatured === 'boolean');
  assert(typeof opts.isDevelopingStory === 'undefined' || typeof opts.isDevelopingStory === 'boolean');

  var obj = {
    isPreview: typeof opts.isPreview === 'boolean' ? opts.isPreview : true,
    isSponsored: !!opts.isSponsored
  };

  if (opts.sections && opts.sections.length > 0) {
    obj.links = { sections: opts.sections };
  }

  if (opts.accessoryText && opts.accessoryText.length > 0) {
	  obj.accessoryText = opts.accessoryText;
  }

  if (opts.isCandidateToBeFeatured) {
	  obj.isCandidateToBeFeatured = !!opts.isCandidateToBeFeatured;
  }

  if (opts.isDevelopingStory) {
	  obj.isDevelopingStory = !!opts.isDevelopingStory;
  }

  return obj;
};
