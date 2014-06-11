/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

/**** Module dependencies ****/
var formidable = require('formidable'),
  util = require('util'),
  url = require('url');

exports.route = function(req, cb) {

  var parsed = url.parse(req.url, true),
    path = parsed.pathname.match(/[^.]*/, ''),
    form = formidable.IncomingForm();

  if (!path) {
    return cb('Route could not be parsed');
  }

  // split the path up into chunks
  path = path[0].split('/');

  // grab the public key from the parsed url
  req.publicKey = path[2];

  // the private key might come in the header or as a GET var depending on the method used for sending data.
  req.privateKey = req.headers['phant-private-key'] ? req.headers['phant-private-key'] : parsed.query.private_key;

  // add the query to the request
  req.query = parsed.query;

  // strip out cruft
  delete req.query.callback;
  delete req.query.private_key;

  form.parse(req, function(err, fields, files) {

    // add the parsed body to the request
    req.body = fields;

    // pass back the action if there is one
    cb(null, path[3]);

  });

};

exports.contentType = function(req) {

  var parsed = url.parse(req.url, true),
    ext;

  try {
    // try to grab the ext from parsed url
    ext = url.parse(req.url, true).pathname.match(/\.([a-z0-9]*)$/i)[1];
  } catch (err) {
    ext = null;
  }

  // grab the callback name for jsonp
  if (parsed.query.callback) {
    req.callback = parsed.query.callback.replace(/[^\[\]\w$.]/g, '');
  }

  switch (ext) {

    case 'html':
      return 'text/html';
    case 'json':
      if (req.callback) {
        return 'text/javascript';
      }
      return 'application/json';
    case 'txt':
      return 'text/plain';
    case 'xml':
      return 'application/xml';
    case 'csv':
      return 'text/csv';
    case 'atom':
      return 'application/atom+xml';
    case 'rss':
      return 'application/rss+xml';
    default:

      if (!req.headers.accept) {
        return 'text/html';
      }

      // use the first item in the accept list for a fallback
      return req.headers.accept.split(',')[0].trim();

  }

};
