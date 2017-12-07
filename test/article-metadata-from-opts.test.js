var test = require('tape');
var articleMetadataFromOpts = require('../lib/article-metadata-from-opts.js');

test('articleMetadataFromOpts()', function (t) {
  t.is(
    typeof articleMetadataFromOpts,
    'function',
    'it is a function'
  );

  t.end();
});
