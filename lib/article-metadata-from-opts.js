'use strict';

const assert = require('assert');

module.exports = function articleMetadataFromOpts (opts) {
  assert(typeof opts.isPreview === 'undefined' || typeof opts.isPreview === 'boolean');
  assert(typeof opts.isSponsored === 'undefined' || typeof opts.isSponsored === 'boolean');

  const obj = {
    isPreview: typeof opts.isPreview === 'boolean' ? opts.isPreview : true,
    isSponsored: !!opts.isSponsored
  };

  if (opts.sections && opts.sections.length > 0) {
    obj.links = { sections: opts.sections };
  }

  return obj;
};
