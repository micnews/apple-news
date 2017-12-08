const test = require('tape');
const articleMetadataFromOpts = require('../lib/article-metadata-from-opts.js');

test('articleMetadataFromOpts()', function (t) {
  t.is(
    typeof articleMetadataFromOpts,
    'function',
    'it is a function'
  );

  t.throws(
    function () { articleMetadataFromOpts({ isPreview: 'foo' }); },
    'it throws if isPreview is not a boolean'
  );

  t.throws(
    function () { articleMetadataFromOpts({ isSponsored: 'foo' }); },
    'it throws if isSponsored is not a boolean'
  );

  t.throws(
    function () { articleMetadataFromOpts({ maturityRating: 1 }); },
    'it throws if maturityRating is not a string'
  );

  t.is(
    articleMetadataFromOpts({ isPreview: true }).isPreview,
    true,
    'it returns isPreview=true when opts.isPreview is true'
  );

  t.is(
    articleMetadataFromOpts({ isPreview: false }).isPreview,
    false,
    'it returns isPreview=false when opts.isPreview is false'
  );

  t.is(
    articleMetadataFromOpts({}).isPreview,
    true,
    'it returns isPreview=true when opts.isPreview is missing'
  );

  t.is(
    articleMetadataFromOpts({ isSponsored: true }).isSponsored,
    true,
    'it returns isSponsored=true when opts.isSponsored is true'
  );

  t.is(
    articleMetadataFromOpts({ isSponsored: false }).isSponsored,
    false,
    'it returns isSponsored=false when opts.isSponsored is false'
  );

  t.is(
    articleMetadataFromOpts({}).isSponsored,
    false,
    'it returns isSponsored=false when opts.isSponsored is missing'
  );

  t.is(
    articleMetadataFromOpts({}).sections,
    undefined,
    'it does not return a sections property when sections have not been supplied'
  );

  t.is(
    articleMetadataFromOpts({}).maturityRating,
    undefined,
    'it does not return a maturityRating property when maturityRating has not been supplied'
  );

  const sections = ['foo', 'bar', 'baz'];
  t.deepEqual(
    articleMetadataFromOpts({ sections: sections }).links.sections,
    sections,
    'it sets links.sections to the supplied sections array'
  );

  const maturityRating = 'foobar';
  t.is(
    articleMetadataFromOpts({ maturityRating: maturityRating }).maturityRating,
    maturityRating,
    'it sets maturityRating to the supplied maturity rating'
  );

  t.end();
});
