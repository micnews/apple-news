'use strict';

var FormData = require('form-data');
var stream = require('stream');
var request = require('request');
var async = require('async');
var fileType = require('file-type');
var objectAssign = require('object-assign');

var CRLF = '\r\n';

var validContentTypes = [
  'application/octet-stream', // should be first in this list
  'image/jpeg',
  'image/png',
  'image/gif'
];

module.exports = function encodeFormData (formData, cb) {
  var form = new FormData();

  async.mapSeries(formData, function (item, callback) {
    var value = item.value;
    var options = item.options;

    function append () {
      var len = typeof value === 'string' ? Buffer.byteLength(value) : value.length;
      var header = '--' + form.getBoundary() + CRLF +
        'Content-Type: ' + options.contentType + CRLF +
        'Content-Disposition: form-data' +
        (item.filename ? '; filename=' + encodeURIComponent(options.filename) : '') +
        (item.name ? '; name=' + encodeURIComponent(item.name) : '') +
        '; size=' + len + CRLF + CRLF;

      form.append(item.name || item.filename, value,
        objectAssign({ header: header, knownLength: len }, options));
      callback();
    }

    if (options.contentType === 'application/json') {
      return append();
    }

    request.get(value, {
      timeout: 5000,
      encoding: null,
      rejectUnauthorized: process.env.NODE_ENV !== 'test'
    }, function (err, res, body) {
      if (err) {
        return callback(err);
      }

      var contentType = fileType(body).mime;
      if (validContentTypes.indexOf(contentType) === -1) {
        contentType = validContentTypes[0];
      }

      options.contentType = contentType;
      value = body;
      return append();
    });
  }, function (err, callback) {
    if (err) {
      return cb(err);
    }

    var converter = new stream.Writable();
    var chunks = [];
    converter._write = function (chunk, enc, cb) {
      chunks.push(chunk);
      cb();
    };

    converter.on('finish', function () {
      return cb(null, {
        headers: form.getHeaders(),
        buffer: Buffer.concat(chunks)
      });
    });

    form.pipe(converter);
  });
};
