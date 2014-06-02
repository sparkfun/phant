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

exports.get_content_type = function(req) {

  var obj_url = url.parse(req.url, true);

  var content_type = null;

  // if there's a last bit after a dot use that for file ext
  var matches = obj_url.pathname.match(/\.([a-z0-9]*)$/i);
  if (matches) {
    var extension = matches[1];
    if (extension === 'json') {
      content_type = 'application/json';
    } else if (extension === 'txt') {
      content_type = 'text/plain';
    } else if (extension === 'csv') {
      content_type = 'text/csv';
    }
  }

  if (!content_type) {
    if (typeof req.headers.accept !== 'undefined') {
      content_type = req.headers.accept;
    }
  }

  return content_type;
};
