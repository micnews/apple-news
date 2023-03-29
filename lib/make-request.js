'use strict';

const crypto = require('crypto');
const https = require('https');
const encodeFormData = require('./encode-form-data');

const defaultHost = 'news-api.apple.com';

module.exports = function (config) {
  function sendRequest (method, endpoint, post, callback) {
    const host = config.host || defaultHost;
    const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); // remove milliseconds
    let canonicalRequest = Buffer.from(method + 'https://' + host + endpoint + date +
      (post ? post.headers['content-type'] : ''));
    if (post) {
      canonicalRequest = Buffer.concat([canonicalRequest, post.buffer]);
    }

    const key = Buffer.from(config.apiSecret, 'base64');
    const signature = crypto.createHmac('sha256', key)
      .update(canonicalRequest, 'utf8')
      .digest('base64');
    const auth = 'HHMAC; key="' + config.apiId +
      '"; signature="' + signature +
      '"; date="' + date + '"';

    let done = false;
    function cb (err, res, body) {
      if (done) return;
      done = true;
      callback(err, res, body);
    }

    const req = https.request({
      method: method,
      host: host,
      port: config.port || void 0,
      rejectUnauthorized: process.env.NODE_ENV !== 'test',
      path: endpoint,
      headers: Object.assign({
        Accept: 'application/json',
        Authorization: auth
      }, post ? post.headers : {})
    }, function (res) {
      let result = '';

      res.setEncoding('utf8');

      res.on('data', function (chunk) {
        result += chunk;
      });

      res.on('error', cb);

      res.on('end', function () {
        let parsed = null;

        if (!result) {
          return cb(null, res, null);
        }

        try {
          parsed = JSON.parse(result);
        } catch (e) {
          return cb(e);
        }

        if (parsed.data) {
          parsed.data.meta = parsed.meta;
          const data = parsed.data;
          const links = parsed.links;
          const returnBody = {data, links};

          return cb(null, res, returnBody);
        }

        if (parsed.errors && Array.isArray(parsed.errors) &&
            parsed.errors.length > 0 && parsed.errors[0].code) {
          const e = new Error(result);
          e.apiError = parsed.errors[0];
          return cb(e);
        }

        return cb(new Error(result));
      });
    });

    req.on('error', cb);

    if (post) {
      req.write(post.buffer);
    }

    req.end();
  }

  return function makeRequest (method, endpoint, requestOpts, cb) {
    const done = function (err, res, body) {
      if (err) {
        return cb(err);
      }

      // Endpoint returns 2XX on success
      if (String(res.statusCode)[0] !== '2') {
        return cb(new Error(method + ' ' + endpoint + ' code ' + res.statusCode));
      }

      return cb(null, body);
    };

    if (method === 'POST' && requestOpts.formData) {
      return encodeFormData(requestOpts.formData || {}, function (err, encoded) {
        if (err) {
          return done(err);
        }

        sendRequest(method, endpoint, encoded, done);
      });
    }

    sendRequest(method, endpoint, null, done);
  };
};
