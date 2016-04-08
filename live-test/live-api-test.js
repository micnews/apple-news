var assert = require('assert');
assert(process.env.API_ID, 'API_ID environment variable required');
assert(process.env.API_SECRET, 'API_SECRET environment variable required');
assert(process.env.CHANNEL_ID, 'CHANNEL_ID environment variable required');

var createClient = require('../');
var article = require('../test/article.json');
var channelId = process.env.CHANNEL_ID;
var async = require('async');

var client = createClient({
  apiId: process.env.API_ID,
  apiSecret: process.env.API_SECRET
});

var articleId = '';
var revision = '';
var sectionId = '';

async.series([
  function (callback) {
    client.readChannel({ channelId: channelId }, function (err, data) {
      if (err) {
        return callback(err);
      }

      console.log('READ CHANNEL ' + channelId);
      return callback(null);
    });
  },
  function (callback) {
    client.listSections({ channelId: channelId }, function (err, data) {
      if (err) {
        return callback(err);
      }

      sectionId = data[0].id;
      console.log('LIST SECTIONS ' + data.map(function (section) {
        return section.id;
      }).join(', '));
      return callback(null);
    });
  },
  function (callback) {
    client.readSection({ sectionId: sectionId }, function (err, data) {
      if (err) {
        return callback(err);
      }

      console.log('READ SECTION ' + sectionId);
      return callback(null);
    });
  },
  function (callback) {
    client.createArticle({ channelId: channelId, article: article }, function (err, data) {
      if (err) {
        return callback(err);
      }

      articleId = data.id;
      revision = data.revision;
      console.log('CREATE ARTICLE ' + articleId + '(rev ' + revision + ')');
      return callback(null);
    });
  },
  function (callback) {
    client.updateArticle({ articleId: articleId, revision: revision, article: article }, function (err, data) {
      if (err) {
        return callback(err);
      }

      console.log('UPDATE ARTICLE ' + articleId + '(rev ' + revision + ' -> ' + data.revision + ')');
      revision = data.revision;
      return callback(null);
    });
  },
  function (callback) {
    client.readArticle({ articleId: articleId }, function (err, data) {
      if (err) {
        return callback(err);
      }

      revision = data.revision;
      console.log('READ ARTICLE ' + articleId + '(rev ' + revision + ')');
      return callback(null);
    });
  },
  function (callback) {
    client.searchArticles({ sectionId: sectionId }, function (err, data) {
      if (err) {
        return callback(err);
      }

      console.log('SEARCH ARTICLES BY SECTION ' + data.map(function (a) {
        return a.id;
      }).join(', '));
      return callback(null);
    });
  },
  function (callback) {
    client.searchArticles({ channelId: channelId }, function (err, data) {
      if (err) {
        return callback(err);
      }

      console.log('SEARCH ARTICLES BY CHANNEL ' + data.map(function (a) {
        return a.id;
      }).join(', '));
      return callback(null);
    });
  },
  function (callback) {
    client.deleteArticle({ articleId: articleId }, function (err, data) {
      if (err) {
        return callback(err);
      }

      console.log('DELETE ARTICLE ' + articleId);
      return callback(null);
    });
  }
], function (err) {
  if (err) {
    throw err;
  }

  console.log('OK');
});
