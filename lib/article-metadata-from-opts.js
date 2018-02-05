'use strict';

const assert = require('assert');

module.exports = function articleMetadataFromOpts (opts) {
  assert(typeof opts.isPreview === 'undefined' || typeof opts.isPreview === 'boolean');
  assert(typeof opts.isSponsored === 'undefined' || typeof opts.isSponsored === 'boolean');
  assert(typeof opts.maturityRating === 'undefined' || typeof opts.maturityRating === 'string');
  assert(typeof opts.accessoryText === 'undefined' || typeof opts.accessoryText === 'string');
  assert(typeof opts.isCandidateToBeFeatured === 'undefined' || typeof opts.isCandidateToBeFeatured === 'boolean');

  const obj = {
    isPreview: typeof opts.isPreview === 'boolean' ? opts.isPreview : true,
    isSponsored: !!opts.isSponsored,
    isCandidateToBeFeatured: !!opts.isCandidateToBeFeatured
  };

  if (opts.sections && opts.sections.length > 0) {
    obj.links = { sections: opts.sections };
  }

  if (opts.accessoryText) {
    obj.accessoryText = opts.accessoryText;
  }

  if (opts.maturityRating) {
    obj.maturityRating = opts.maturityRating;
  }

  return obj;
};
