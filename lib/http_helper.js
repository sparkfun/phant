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

  // if there's a last bit after a period use that for file ext
  req._extension = null;
  var regexp = /\.([a-z0-9]*)$/i;
  var matches = obj_url.pathname.match(regexp);
  if (matches) {
    req._extension = matches[1];
  }

  var arr_path = obj_url.pathname.replace(regexp, '').split('/');

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
