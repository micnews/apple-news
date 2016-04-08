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

test('api', function (t) {
  t.plan(11);

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
          var port = server.address().port;
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
      client.createArticle({ channelId: channelId, article: article }, callback);
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
