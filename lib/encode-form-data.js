'use strict';

var FormData = require('form-data');
var stream = require('stream');
var request = require('request');
var seriesEach = require('eachy');
var fileType = require('file-type');
var objectAssign = require('object-assign');

var CRLF = '\r\n';

var validContentTypes = [
  'application/octet-stream', // should be first in this list
  'image/jpeg',
  'image/png',
  'image/gif'
];

function append (form, item, data, contentType) {
  var options = item.options;
  var len = typeof data === 'string' ? Buffer.byteLength(data) : data.length;
  var header = '--' + form.getBoundary() + CRLF +
    'Content-Type: ' + contentType + CRLF +
    'Content-Disposition: form-data' +
    (item.filename ? '; filename=' + encodeURIComponent(options.filename) : '') +
    (item.name ? '; name=' + encodeURIComponent(item.name) : '') +
    '; size=' + len + CRLF + CRLF;

  form.append(item.name || item.filename, data,
    objectAssign({ header: header, knownLength: len }, options));
}

module.exports = function encodeFormData (formData, cb) {
  var form = new FormData();

  seriesEach(formData, function (item, callback) {
    var value = item.value;
    var options = item.options;

    if (options.contentType === 'application/json') {
      append(form, item, value, 'application/json');
      callback();
      return;
    }

    request.get(value, {
      timeout: 5000,
      encoding: null,
      rejectUnauthorized: process.env.NODE_ENV !== 'test'
    }, function (err, res, body) {
      if (err) {
        return callback(err);
      }

      if (!body || !body.length) {
        return callback(new Error('file not found: ' + value));
      }

      var contentObj = fileType(body);
      if (!contentObj) {
        return callback(new Error('filetype error: ' + value));
      }

      var contentType = contentObj.mime;
      if (validContentTypes.indexOf(contentType) === -1) {
        contentType = validContentTypes[0];
      }

      append(form, item, body, contentType);
      callback();
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
