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

// noop
app.write = function() {};

// noop
app.clear = function() {};

app.view = function(req, res) {

  var self = this,
    respond = this.respond.bind(this, req, res),
    pub = req.publicKey,
    page = req.query.page,
    id;

  // check for public key
  if (!pub) {
    return respond(404, 'stream not found');
  }

  page = page || false;

  // get the id
  id = this.keychain.getIdFromPublicKey(pub);

  this.validator.exists(id, function(err, stream) {

    if (err) {
      return respond(404, err);
    }

    var readStream = self.storage.objectReadStream(id, page);

    readStream.on('error', function(err) {
      respond(404, 'no data has been pushed to this stream');
    });

    readStream.once('open', function() {
      respond(200, true, readStream);
    });

  });

};

app.stats = function(req, res) {

  var self = this,
    respond = this.respond.bind(this, req, res),
    pub = req.query.publicKey,
    id;

  // check for public key
  if (!pub) {
    respond(404, 'stream not found');
    return;
  }

  // get the id
  id = this.keychain.getIdFromPublicKey(pub);

  this.validator.exists(id, function(err, stream) {

    if (err) {
      return respond(404, err);
    }

    self.storage.stats(id, function(err, stats) {

      if (err) {
        return respond(500, 'unable to retreive stats');
      }

      res.status(200).json(stats);

    });

  });

};

app.respond = function(status, content) {

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

app.error = function(req, res, status, message) {

  res.statusCode = status;

  switch(res.getHeader('content-type')) {

    case 'application/json':
      res.end(JSON.stringify({
        success: false,
        message: message
      });
      break;
    case 'text/javascript':
      res.end(
        'typeof ' + req.callback + ' === \'function\' && ' + req.callback + '(' +
        JSON.Stringify({ success: false, message: message}) + ');'
      );
      break;
    case 'text/csv':
    case 'text/plain':
    default:
      res.end(message);
      break;

  }

};
