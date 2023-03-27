const assert = require('assert');
assert(process.env.API_ID, 'API_ID environment variable required');
assert(process.env.API_SECRET, 'API_SECRET environment variable required');
assert(process.env.CHANNEL_ID, 'CHANNEL_ID environment variable required');

const createClient = require('../');
const article = require('../test/article.json');
const channelId = process.env.CHANNEL_ID;
const series = require('async/series');
const http = require('http');
const path = require('path');
const fs = require('fs');

const client = createClient({
  apiId: process.env.API_ID,
  apiSecret: process.env.API_SECRET
});

let server = null;
let port = 0;
let articleId = '';
let revision = '';
let sectionId = '';

series([
  function (callback) {
    server = http.createServer(function (req, res) {
      if (req.url === '/image-1.png') {
        res.writeHead(200);
        fs.createReadStream(path.resolve(__dirname, '..', 'test', 'image.png')).pipe(res);
        return;
      }

      if (req.url === '/image-1.jpg') {
        res.writeHead(200);
        fs.createReadStream(path.resolve(__dirname, '..', 'test', 'image.jpg')).pipe(res);
        return;
      }

      res.writeHead(404);
      res.end();
    }).listen(function () {
      port = server.address().port;
      callback();
    });
  },
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
    const bundleFiles = {
      'image1': 'http://localhost:' + port + '/image-1.png',
      'image2': 'http://localhost:' + port + '/image-1.jpg'
    };

    client.createArticle({ channelId: channelId, article: article, bundleFiles: bundleFiles }, function (err, data) {
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
  server.close();
});
