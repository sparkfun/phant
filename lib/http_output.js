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
  FieldStream = require('./field_stream'),
  LimitStream = require('./limit_stream'),
  csv = require('csv-write-stream'),
  events = require('events'),
  url = require('url'),
  Router = require('routes'),
  router = new Router(),
  util = require('util');

/**** PhantOutput prototype ****/
var app = {};

/**** Expose PhantOutput ****/
exports = module.exports = PhantOutput;

/**** Initialize a new PhantOutput ****/
function PhantOutput(config) {

  // create a responder
  var responder = function(req, res) {

    if (!req.url.match(/^\/output\//)) {
      return;
    }

    if (res.headersSent) {
      return;
    }

    var match = router.match(url.parse(req.url).pathname);
    match.fn(req, res, match);

    return responder;

  };

  util._extend(responder, events.EventEmitter.prototype);
  util._extend(responder, app);
  util._extend(responder, config || {});

  router.addRoute('/output/:publicKey/stats.:ext', responder.route.bind(responder, 'stats'));
  router.addRoute('/output/:publicKey/stats', responder.route.bind(responder, 'stats'));
  router.addRoute('/output/:publicKey/latest.:ext', responder.route.bind(responder, 'latest'));
  router.addRoute('/output/:publicKey/latest', responder.route.bind(responder, 'latest'));
  router.addRoute('/output/:publicKey/:field/latest.:ext', responder.route.bind(responder, 'latest'));
  router.addRoute('/output/:publicKey/:field/latest', responder.route.bind(responder, 'latest'));
  router.addRoute('/output/:publicKey/:field.:ext', responder.route.bind(responder, 'view'));
  router.addRoute('/output/:publicKey/:field', responder.route.bind(responder, 'view'));
  router.addRoute('/output/:publicKey.:ext', responder.route.bind(responder, 'view'));
  router.addRoute('/output/:publicKey', responder.route.bind(responder, 'view'));

  return responder;

}

/**** Defaults ****/
app.name = 'HTTP output';
app.validator = false;
app.storage = false;
app.keychain = false;

// noop
app.write = function() {};

// noop
app.clear = function() {};

app.view = function(req, res) {

  var self = this,
    error = this.error.bind(this, req, res),
    pub = req.publicKey,
    page = req.query.page,
    limitStream, fieldStream, id;

  // check for public key
  if (!pub) {
    return error(404, 'stream not found');
  }

  page = page || false;

  if (req.latest) {
    page = 1;
    limitStream = LimitStream(1);
  }

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

      // only return one field
      if (req.field) {

        res.setHeader('Content-Type', 'text/plain');

        // limit results
        if (req.latest) {
          readStream = readStream.pipe(limitStream);
        }

        fieldStream = FieldStream(req.field);

        return readStream.pipe(fieldStream).pipe(csv({
          sendHeaders: false
        })).pipe(res);

      }

      switch (res.getHeader('content-type')) {

        case 'application/json':
          if (readStream.all && !req.latest) {
            res.setHeader('Content-Disposition', 'attachment; filename=stream_' + req.publicKey + '.json');
          }

          if (req.latest) {
            readStream = readStream.pipe(limitStream);
          }

          readStream.pipe(JSONStream.stringify('[', ',', ']')).pipe(res);
          break;
        case 'text/javascript':
          if (req.latest) {
            readStream = readStream.pipe(limitStream);
          }
          readStream.pipe(JSONStream.stringify('[', ',', ']')).pipe(JSONPstream(req.callback)).pipe(res);
          break;
        case 'text/csv':
        case 'text/plain':
        default:
          res.setHeader('Content-Type', 'text/plain');

          if (readStream.all && !req.latest) {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=stream_' + req.publicKey + '.csv');
          }

          if (req.latest) {
            limitStream = LimitStream(2);
            readStream = readStream.pipe(limitStream);
          }

          readStream.pipe(csv()).pipe(res);
          break;

      }

    });

  });

};

app.latest = function(req, res) {

  req.latest = true;

  this.view(req, res);

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

      // ensure that stats are ints
      for (var key in stats) {

        if (stats.hasOwnProperty(key)) {
          stats[key] = parseInt(stats[key]);
        }

      }

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

  var parsed = url.parse(req.url, true),
    valid = ['application/json', 'text/plain', 'text/csv', 'text/javascript'];

  req.query = parsed;

  // grab the callback name for jsonp
  if (parsed.query.callback) {
    req.callback = parsed.query.callback.replace(/[^\[\]\w$.]/g, '');
    return res.setHeader('Content-Type', 'text/javascript');
  }

  if (req.extension === 'json') {
    return res.setHeader('Content-Type', 'application/json');
  }

  if (!req.headers.accept) {
    return res.setHeader('Content-Type', 'text/csv');
  }

  // use the first item in the accept list for a fallback
  var fallback = req.headers.accept.split(',')[0].trim();

  // default to text/plain
  if (valid.indexOf(fallback) === -1) {
    return res.setHeader('Content-Type', 'text/csv');
  }

  res.setHeader('Content-Type', fallback);

};

app.route = function(action, req, res, match) {

  req.extension = match.params.ext;
  req.field = match.params.field;

  // set the response content type
  this.setContentType(req, res);

  // set public key
  req.publicKey = match.params.publicKey;

  this[action].call(this, req, res);

};
