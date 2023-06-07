'use strict';

process.env.NODE_ENV = 'test';
require('./article-metadata-from-opts.test.js');
const createClient = require('../');
const article = require('./article.json');
const channelId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const sectionId = '99999999-9999-9999-9999-999999999999';
const articleId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const revision = 'REV00000011';
const pem = require('pem');
const series = require('async/series');
const https = require('https');
const test = require('tape');
const fs = require('fs');
const path = require('path');
let port = 0;

test('api', function (t) {
  t.plan(12);

  let client = null;
  let server = null;

  function serverHandler (req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
      if (req.url === '/channels/cccccccc-cccc-cccc-cccc-cccccccccccc') {
        return res.end(JSON.stringify({ data: {} }));
      }

      if (req.url === '/channels/cccccccc-cccc-cccc-cccc-cccccccccccc/sections') {
        return res.end(JSON.stringify({ data: [ { id: sectionId } ] }));
      }

      if (req.url === '/sections/99999999-9999-9999-9999-999999999999') {
        return res.end(JSON.stringify({ data: { id: sectionId } }));
      }

      if (req.url === '/articles/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
        return res.end(JSON.stringify({ data: { id: articleId } }));
      }

      if (req.url === '/sections/99999999-9999-9999-9999-999999999999/articles') {
        return res.end(JSON.stringify({ data: [ { id: articleId } ] }));
      }

      if (req.url === '/channels/cccccccc-cccc-cccc-cccc-cccccccccccc/articles') {
        return res.end(JSON.stringify({ data: [ { id: articleId } ] }));
      }

      if (req.url === '/image-1.jpg') {
        res.writeHead(200);
        return fs.createReadStream(path.resolve(__dirname, 'image.jpg')).pipe(res);
      }

      if (req.url === '/image-2.png') {
        res.writeHead(200);
        return fs.createReadStream(path.resolve(__dirname, 'image.png')).pipe(res);
      }

      if (req.url === '/image-3.png') {
        res.writeHead(404);
        return res.end(0);
      }
    }

    if (req.method === 'POST') {
      req.on('data', function () {});

      if (req.url === '/channels/cccccccc-cccc-cccc-cccc-cccccccccccc/articles') {
        return req.on('end', function () {
          res.writeHead(201);
          res.end(JSON.stringify({ data: { id: articleId } }));
        });
      }

      if (req.url === '/articles/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
        return req.on('end', function () {
          res.end(JSON.stringify({ data: { id: articleId } }));
        });
      }
    }

    if (req.method === 'DELETE') {
      if (req.url === '/articles/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
        res.writeHead(204);
        return res.end(JSON.stringify({ data: { id: articleId } }));
      }
    }

    res.end(JSON.stringify({ error: 'unknown test endpoint "' + req.method + ' ' + req.url + '"' }));
  }

  function checkTest (msg, callback) {
    return function (err) {
      if (err) {
        console.error(err);
        t.fail(msg);
      } else {
        t.pass(msg);
      }
      callback(err);
    };
  }

  series([
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
      client.readChannel({ channelId: channelId }, checkTest('read channel', callback));
    },
    function (callback) {
      client.listSections({ channelId: channelId }, checkTest('list sections', callback));
    },
    function (callback) {
      client.readSection({ sectionId: sectionId }, checkTest('read section', callback));
    },
    function (callback) {
      const bundleFiles = {
        'image1': 'https://localhost:' + port + '/image-1.jpg',
        'image2': 'https://localhost:' + port + '/image-2.png'
      };
      client.createArticle({
        channelId: channelId,
        article: article,
        bundleFiles: bundleFiles,
        sections: [
          'https://news-api.apple.com/sections/0a468272-356f-3b61-afa3-c4f989954180',
          'https://news-api.apple.com/sections/5cec0b36-529e-31bc-bc1e-3eaccbc15b97'
        ]
      }, checkTest('create article', callback));
    },
    function (callback) {
      client.updateArticle({ articleId: articleId, revision: revision, article: article }, checkTest('update article', callback));
    },
    function (callback) {
      client.readArticle({ articleId: articleId }, checkTest('read article', callback));
    },
    function (callback) {
      client.searchArticles({ sectionId: sectionId }, checkTest('search articles by section', callback));
    },
    function (callback) {
      client.searchArticles({ channelId: channelId }, checkTest('search articles by channel', callback));
    },
    function (callback) {
      client.deleteArticle({ articleId: articleId }, checkTest('delete article', callback));
    },
    function (callback) {
      const bundleFiles = {
        'image3': 'https://localhost:' + port + '/image-3.png'
      };
      client.createArticle({
        channelId: channelId,
        article: article,
        bundleFiles: bundleFiles,
        sections: [
          'https://news-api.apple.com/sections/0a468272-356f-3b61-afa3-c4f989954180',
          'https://news-api.apple.com/sections/5cec0b36-529e-31bc-bc1e-3eaccbc15b97'
        ]
      }, function (err) {
        t.equal(err.message, 'file not found: https://localhost:' + port + '/image-3.png', 'Error was caught when resource returned 404');
        callback();
      });
    }
  ], function (err) {
    server.close();
    t.error(err);
  });
});
