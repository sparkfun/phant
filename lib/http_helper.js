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

  var obj_url = url.parse(req.url, true);

  // take anything up to a dot
  // TODO bail if no valid path
  var matches = obj_url.pathname.match(/[^.]*/, '');
  var arr_path = matches[0].split('/');
  req.public_key = arr_path[2];

  var command = arr_path[3];

  // the private key might come in the header or as a GET var depending on the method used for sending data.
  req.private_key = (typeof req.headers['phant-private-key'] !== 'undefined') ? req.headers['phant-private-key'] : obj_url.query.private_key;

  // remove private key from stream data
  delete obj_url.query.private_key;

  // add the query to the request object
  req.query = obj_url.query;

  var form = formidable.IncomingForm();
  var body = {};
  form.parse(req, function(err, fields, files) {
    req.body = fields;
    cb(null, command);
  });

};

exports.contentType = function(req) {

  var ext = url.parse(req.url, true).pathname.match(/\.([a-z0-9]*)$/i);

  switch (ext) {

    case 'html':
      return 'text/html';
    case 'json':
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
      return req.headers.accept.split(',')[0].trim();

  }

};
