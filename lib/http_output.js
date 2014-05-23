/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var express = require('express'),
  methodOverride = require('method-override'),
  bodyParser = require('body-parser'),
  JSONStream = require('JSONStream'),
  JSONPstream = require('./jsonp_stream'),
  csv = require('csv-write-stream'),
  events = require('events'),
  util = require('util'),
  url = require('url');

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

    return responder.express.call(this, req, res);

  };

  util._extend(responder, events.EventEmitter.prototype);
  util._extend(responder, app);
  util._extend(responder, config);

  responder.express = responder.expressInit();

  return responder;

}

/**** Defaults ****/
app.name = 'HTTP output';
app.validator = false;
app.storage = false;
app.keychain = false;

app.expressInit = function() {

  var exp = express(),
    view = this.view.bind(this);

  exp.use(function(req, res, next) {
    res.header('X-Powered-By', 'phant');
    next();
  });

  exp.use(express.compress());
  exp.use(bodyParser.json());
  exp.use(bodyParser.urlencoded());
  exp.use(methodOverride());
  exp.use(this.responseType);

  exp.use(exp.router);

  exp.get('/output/:public/stats', this.stats.bind(this));
  exp.get('/output/:public.:ext', view);
  exp.get('/output/:public', view);
  exp.get('/output/*', view);

  return exp;

};

// noop
app.write = function() {};

// noop
app.clear = function() {};

app.responseType = function(req, res, next) {

  var _acceptParam = req.param('_accept');

  if (_acceptParam) {
    req.headers.accept = _acceptParam;
  } else if (url.parse(req.url).pathname.match(/\.json$/)) {
    req.headers.accept = 'application/json';
  } else if (url.parse(req.url).pathname.match(/\.csv$/)) {
    req.headers.accept = 'text/csv';
  } else if (url.parse(req.url).pathname.match(/\.txt$/)) {
    req.headers.accept = 'text/plain';
  }

  next();

};

app.view = function(req, res) {

  var self = this,
    respond = this.respond.bind(res),
    pub = req.param('public'),
    page = req.param('page'),
    id;

  // check for public key
  if (!pub) {
    return respond(404, false, 'stream not found');
  }

  page = page || false;

  // get the id
  id = this.keychain.getIdFromPublicKey(pub);

  this.validator.exists(id, function(err, stream) {

    if (err) {
      return respond(404, false, err);
    }

    var callback = req.query[self.express.get('jsonp callback name')],
      readStream = self.storage.objectReadStream(id, page);

    if (callback) {
      res.callback = callback;
    }

    res.public_key = pub;

    readStream.on('error', function(err) {
      if (!res.headerSent) {
        respond(404, false, 'no data has been pushed to this stream');
      }
    });

    readStream.once('open', function() {
      respond(200, true, readStream);
    });

  });

};

app.stats = function(req, res) {

  var self = this,
    respond = this.respond.bind(res),
    pub = req.param('public'),
    page = req.param('page'),
    id;

  // check for public key
  if (!pub) {
    respond(404, false, 'stream not found');
    return;
  }

  page = page || false;

  // get the id
  id = this.keychain.getIdFromPublicKey(pub);

  this.validator.exists(id, function(err, stream) {

    if (err) {
      return respond(404, false, err);
    }

    self.storage.stats(id, function(err, stats) {

      if (err) {
        return respond(500, false, 'unable to retreive stats');
      }

      res.status(200).json(stats);

    });

  });

};

app.respond = function(status, success, content) {

  var res = this;

  res.format({

    csv: function() {

      if (!success) {
        return res.send(status, content);
      }

      var headers = {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
        'Accept-Ranges': 'bytes'
      };

      // if we are sending all of the data,
      // force the browser to download the file
      if (content.all) {
        headers['Content-Type'] = 'text/csv';
        headers['Content-disposition'] = 'attachment; filename=stream_' + res.public_key + '.csv';
      }

      res.writeHead(status, headers);

      content.pipe(csv()).pipe(res);

    },

    json: function() {

      if (!success) {
        return res.status(status).json({
          success: false,
          message: content
        });
      }

      var headers = {
        'Transfer-Encoding': 'chunked',
        'Content-Type': 'application/json',
        'Accept-Ranges': 'bytes'
      };

      // if we are sending all of the data,
      // force the browser to download the file
      if (content.all && !res.callback) {
        headers['Content-disposition'] = 'attachment; filename=stream_' + res.public_key + '.json';
      }

      if (res.callback) {
        headers['Content-Type'] = 'text/javascript';
      }

      res.writeHead(status, headers);

      var stream = content.pipe(JSONStream.stringify('[', ',', ']'));

      if (res.callback) {
        stream = stream.pipe(JSONPstream(res.callback));
      }

      stream.pipe(res);

    }

  });

};
