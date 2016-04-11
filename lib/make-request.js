'use strict';

var crypto = require('crypto');
var moment = require('moment');
var objectAssign = require('object-assign');
var https = require('https');
var encodeFormData = require('./encode-form-data');

var host = 'news-api.apple.com';

module.exports = function (config) {
  function sendRequest (method, endpoint, post, cb) {
    var date = moment().utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    var canonicalRequest = Buffer(method + 'https://' + (config.host || host) + endpoint + date +
      (post ? post.headers['content-type'] : ''), 'ascii');
    if (post) {
      canonicalRequest = Buffer.concat([canonicalRequest, post.buffer]);
    }

    var key = new Buffer(config.apiSecret, 'base64');
    var signature = crypto.createHmac('sha256', key)
      .update(canonicalRequest, 'utf8')
      .digest('base64');
    var auth = 'HHMAC; key="' + config.apiId +
      '"; signature="' + signature +
      '"; date="' + date + '"';

    var req = https.request({
      method: method,
      host: config.host || host,
      port: config.port || void 0,
      rejectUnauthorized: process.env.NODE_ENV !== 'test',
      path: endpoint,
      headers: objectAssign({
        Accept: 'application/json',
        Authorization: auth
      }, post ? post.headers : {})
    });

    req.on('response', function (res) {
      var result = '';
      var done = false;

      res.on('data', function (chunk) {
        result += chunk.toString();
      });

      res.on('error', function (err) {
        if (!done) {
          done = true;
          cb(err);
        }
      });

      res.on('end', function () {
        if (!done) {
          done = true;
          var parsed = null;

          if (!result) {
            return cb(null, res, null);
          }

          try {
            parsed = JSON.parse(result);
          } catch (e) {
            return cb(e);
          }

          if (parsed.data) {
            return cb(null, res, parsed.data);
          }

          if (parsed.errors && Array.isArray(parsed.errors) &&
              parsed.errors.length > 0 && parsed.errors[0].code) {
            var e = new Error(result);
            e.apiError = parsed.errors[0];
            return cb(e);
          }

          return cb(new Error(result));
        }
      });
    });

    if (post) {
      req.write(post.buffer);
    }

    req.end();
  }

  return function makeRequest (method, endpoint, requestOpts, cb) {
    var done = function (err, res, body) {
      if (err) {
        return cb(err);
      }

      // Endpoint returns 2XX on success
      if (String(res.statusCode)[0] !== '2') {
        return cb(new Error('readChannel error code ' + res.statusCode));
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
