'use strict';

const FormData = require('form-data');
const stream = require('stream');
const request = require('request');
const seriesEach = require('eachy');
const fileType = require('file-type');
const objectAssign = require('object-assign');

const CRLF = '\r\n';

const validContentTypes = [
  'application/octet-stream', // should be first in this list
  'image/jpeg',
  'image/png',
  'image/gif'
];

function append (form, item, data, contentType) {
  const options = item.options;
  const len = typeof data === 'string' ? Buffer.byteLength(data) : data.length;
  const header = '--' + form.getBoundary() + CRLF +
    'Content-Type: ' + contentType + CRLF +
    'Content-Disposition: form-data' +
    (item.filename ? '; filename=' + encodeURIComponent(options.filename) : '') +
    (item.name ? '; name=' + encodeURIComponent(item.name) : '') +
    '; size=' + len + CRLF + CRLF;

  form.append(item.name || item.filename, data,
    objectAssign({ header: header, knownLength: len }, options));
}

module.exports = function encodeFormData (formData, cb) {
  const form = new FormData();

  seriesEach(formData, function (item, callback) {
    const value = item.value;
    const options = item.options;

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

      const contentObj = fileType(body);
      if (!contentObj) {
        return callback(new Error('filetype error: ' + value));
      }

      let contentType = contentObj.mime;
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

    const converter = new stream.Writable();
    const chunks = [];
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
