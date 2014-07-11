/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var JSONStream = require('JSONStream'),
  JSONPstream = require('./jsonp_stream'),
  csv = require('csv-write-stream'),
  http_helper = require('./http_helper'),
  events = require('events'),
  util = require('util');

/**** PhantOutput prototype ****/
var app = {};

/**** Expose PhantOutput ****/
exports = module.exports = PhantOutput;

/**** Initialize a new PhantOutput ****/
function PhantOutput(config) {

  config = config || {};

  // create a responder
  var responder = function(req, res) {

    if (!req.url.match(/^\/output\//)) {
      return;
    }

    if (res.headersSent) {
      return;
    }

    responder.route(req, res);

    return responder;

  };

  util._extend(responder, events.EventEmitter.prototype);
  util._extend(responder, app);
  util._extend(responder, config);


  return responder;

}

/**** Defaults ****/
app.name = 'HTTP output';
app.validator = false;
app.storage = false;
app.keychain = false;
app.mimeTypes = [
  'application/json',
  'text/plain',
  'text/csv',
  'text/javascript'
];

// noop
app.write = function() {};

// noop
app.clear = function() {};

app.view = function(req, res) {

  var self = this,
    error = this.error.bind(this, req, res),
    pub = req.publicKey,
    page = req.query.page,
    id;

  // check for public key
  if (!pub) {
    return error(404, 'stream not found');
  }

  page = page || false;

  // get the id
  id = this.keychain.getIdFromPublicKey(pub);

  this.validator.exists(id, function(err, stream) {

    if (err) {
      return error(404, err);
    }

    var readStream = self.storage.objectReadStream(id, page);

    readStream.on('error', function(err) {
      error(404, 'no data has been pushed to this stream');
    });

    readStream.once('open', function() {

      if (res.headersSent) {
        return;
      }

      res.statusCode = 200;
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Accept-Ranges', 'bytes');

      switch (res.getHeader('content-type')) {

        case 'application/json':
          if (readStream.all) {
            res.setHeader('Content-Disposition', 'attachment; filename=stream_' + req.publicKey + '.json');
          }
          readStream.pipe(JSONStream.stringify('[', ',', ']')).pipe(res);
          break;
        case 'text/javascript':
          readStream.pipe(JSONStream.stringify('[', ',', ']')).pipe(JSONPstream(req.callback)).pipe(res);
          break;
        case 'text/csv':
        case 'text/plain':
        default:
          res.setHeader('Content-Type', 'text/plain');
          if (readStream.all) {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=stream_' + req.publicKey + '.csv');
          }
          readStream.pipe(csv()).pipe(res);
          break;

      }

    });

  });

};

app.stats = function(req, res) {

  var self = this,
    error = this.error.bind(this, req, res),
    pub = req.publicKey,
    id;

  // check for public key
  if (!pub) {
    error(404, 'stream not found');
    return;
  }

  // get the id
  id = this.keychain.getIdFromPublicKey(pub);

  this.validator.exists(id, function(err, stream) {

    if (err) {
      return error(404, err);
    }

    self.storage.stats(id, function(err, stats) {

      if (err) {
        return error(500, 'unable to retrieve stats');
      }

      if (res.headersSent) {
        return;
      }

      res.statusCode = 200;
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Accept-Ranges', 'bytes');

      switch (res.getHeader('content-type')) {

        case 'application/json':
          res.end(JSON.stringify(stats));
          break;
        case 'text/javascript':
          res.end(
            'typeof ' + req.callback + ' === \'function\' && ' + req.callback + '(' +
            JSON.stringify(stats) + ');'
          );
          break;
        case 'text/csv':
        case 'text/plain':
        default:
          var keys = Object.keys(stats).sort(),
            values = [];

          res.write(keys.join(',') + '\n');

          keys.forEach(function(key) {
            values.push(stats[key]);
          });

          res.end(values.join(',') + '\n');

          break;

      }

    });

  });

};

app.error = function(req, res, status, message) {

  if (res.headersSent) {
    return;
  }

  res.statusCode = status;

  switch (res.getHeader('content-type')) {

    case 'application/json':
      res.end(JSON.stringify({
        success: false,
        message: message
      }));
      break;
    case 'text/javascript':
      // force a status of 200 for jsonp
      // or the browser won't pay attention
      // to the response
      res.statusCode = 200;

      res.end(
        'typeof ' + req.callback + ' === \'function\' && ' + req.callback + '(' +
        JSON.stringify({
          success: false,
          message: message
        }) + ');'
      );
      break;
    case 'text/csv':
    case 'text/plain':
    default:
      res.end(message + '\n');
      break;

  }

};

app.setContentType = function(req, res) {

  var type = http_helper.contentType(req);

  // default to text/plain
  if (app.mimeTypes.indexOf(type) === -1) {
    return res.setHeader('Content-Type', 'text/plain');
  }

  res.setHeader('Content-Type', type);

};

app.route = function(req, res) {

  var self = this;

  // set the response content type
  self.setContentType(req, res);

  http_helper.route(req, function(err, command) {

    if (err) {
      return self.error(req, res, 400, err);
    }

    switch (command) {
      case 'stats':
        self.stats(req, res);
        break;
      case 'view':
      default:
        self.view(req, res);
    }

  });

};
