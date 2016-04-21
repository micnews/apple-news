process.env.NODE_ENV = 'test';
var createClient = require('../');
var article = require('./article.json');
var channelId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
var sectionId = '99999999-9999-9999-9999-999999999999';
var articleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
var revision = 'REV00000011';
var pem = require('pem');
var async = require('async');
var https = require('https');
var test = require('tape');
var fs = require('fs');
var path = require('path');
var port = 0;

test('api', function (t) {
  t.plan(13);

  var client = null;
  var server = null;

  function serverHandler (req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
      if (req.url === '/channels/cccccccc-cccc-cccc-cccc-cccccccccccc') {
        res.end(JSON.stringify({ data: {} }));
        t.pass('read channel');
        return;
      }

      if (req.url === '/channels/cccccccc-cccc-cccc-cccc-cccccccccccc/sections') {
        res.end(JSON.stringify({ data: [ { id: sectionId } ] }));
        t.pass('list sections');
        return;
      }

      if (req.url === '/sections/99999999-9999-9999-9999-999999999999') {
        res.end(JSON.stringify({ data: { id: sectionId } }));
        t.pass('read section');
        return;
      }

      if (req.url === '/articles/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
        res.end(JSON.stringify({ data: { id: articleId } }));
        t.pass('read article');
        return;
      }

      if (req.url === '/sections/99999999-9999-9999-9999-999999999999/articles') {
        res.end(JSON.stringify({ data: [ { id: articleId } ] }));
        t.pass('search articles by section');
        return;
      }

      if (req.url === '/channels/cccccccc-cccc-cccc-cccc-cccccccccccc/articles') {
        res.end(JSON.stringify({ data: [ { id: articleId } ] }));
        t.pass('search articles by channel');
        return;
      }

      if (req.url === '/image-1.jpg') {
        res.writeHead(200);
        fs.createReadStream(path.resolve(__dirname, 'image.jpg')).pipe(res);
        t.pass('download image 1');
        return;
      }

      if (req.url === '/image-1.png') {
        res.writeHead(200);
        fs.createReadStream(path.resolve(__dirname, 'image.png')).pipe(res);
        t.pass('download image 2');
        return;
      }
    }

    if (req.method === 'POST') {
      if (req.url === '/channels/cccccccc-cccc-cccc-cccc-cccccccccccc/articles') {
        res.writeHead(201);
        res.end(JSON.stringify({ data: { id: articleId } }));
        t.pass('create article');
        return;
      }

      if (req.url === '/articles/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
        res.end(JSON.stringify({ data: { id: articleId } }));
        t.pass('update article');
        return;
      }
    }

    if (req.method === 'DELETE') {
      if (req.url === '/articles/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
        res.writeHead(204);
        res.end(JSON.stringify({ data: { id: articleId } }));
        t.pass('delete article');
        return;
      }
    }

    res.end(JSON.stringify({ error: 'unknown test endpoint "' + req.method + ' ' + req.url + '"' }));
  }

  async.series([
    function (callback) {
      pem.createCertificate({ days: 5, selfSigned: true }, function (err, keys) {
        t.error(err);
        server = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, serverHandler)
        .listen(function () {
          port = server.address().port;
          client = createClient({
            apiId: 'test-id',
            apiSecret: 'test-secret',
            host: 'localhost',
            port: port
          });
          callback(null);
        });
      });
    },
    function (callback) {
      client.readChannel({ channelId: channelId }, callback);
    },
    function (callback) {
      client.listSections({ channelId: channelId }, callback);
    },
    function (callback) {
      client.readSection({ sectionId: sectionId }, callback);
    },
    function (callback) {
      var bundleFiles = {
        'image1': 'https://localhost:' + port + '/image-1.jpg',
        'image2': 'https://localhost:' + port + '/image-1.png'
      };
      client.createArticle({
        channelId: channelId,
        article: article,
        bundleFiles: bundleFiles,
        sections: [
          'https://news-api.apple.com/sections/0a468272-356f-3b61-afa3-c4f989954180',
          'https://news-api.apple.com/sections/5cec0b36-529e-31bc-bc1e-3eaccbc15b97'
        ]
      }, callback);
    },
    function (callback) {
      client.updateArticle({ articleId: articleId, revision: revision, article: article }, callback);
    },
    function (callback) {
      client.readArticle({ articleId: articleId }, callback);
    },
    function (callback) {
      client.searchArticles({ sectionId: sectionId }, callback);
    },
    function (callback) {
      client.searchArticles({ channelId: channelId }, callback);
    },
    function (callback) {
      client.deleteArticle({ articleId: articleId }, callback);
    }
  ], function (err) {
    server.close();
    t.error(err);
  });
});
