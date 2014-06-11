/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

/**** Module dependencies ****/
var events = require('events'),
  util = require('util'),
  http_helper = require('./http_helper');

/**** PhantInput prototype ****/
var app = {};

/**** Expose PhantInput ****/
exports = module.exports = PhantInput;

/**** Initialize a new PhantInput ****/
function PhantInput(config) {

  config = config || {};

  // create a responder
  var responder = function(req, res) {

    if (!req.url.match(/^\/input\//)) {
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
app.name = 'HTTP input';
app.metadata = false;
app.validator = false;
app.keychain = false;
app.requestLimit = 51200; // 50k
app.mimeTypes = [
  'application/json',
  'text/plain'
];

/**** Default throttler ****/
app.throttler = {
  available: function(key, cb) {

    var now = Math.round((new Date()).getTime() / 1000);

    cb(true, 0, 100, now);

  }
};

app.log = function(req, res) {

  var data = {},
    pub = req.publicKey,
    prv = req.privateKey,
    input = this,
    id = false;

  // get post body or query string params
  if (req.method === 'POST') {
    data = util._extend(req.body, req.query);
  }

  // get query string params
  if (req.method === 'GET') {
    data = req.query;
  }

  // check for public key
  if (!pub) {
    return this.respond(res, 404, 'stream not found');
  }

  // check for private key
  if (!prv) {
    return this.respond(res, 403, 'forbidden: missing private key');
  }

  // make sure they sent some data
  if (!data || data.length === 0) {
    return this.respond(res, 400, 'no data received');
  }

  // validate keys
  if (!this.keychain.validate(pub, prv)) {
    return this.respond(res, 401, 'forbidden: invalid key');
  }

  // get the id
  id = this.keychain.getIdFromPrivateKey(prv);

  // add timestamp
  data.timestamp = new Date().toISOString();

  this.throttler.available(pub, function(ready, used, limit, reset) {

    var now = (new Date()).getTime() / 1000;

    if (!ready) {

      res.setHeader('X-Rate-Limit-Limit', limit);
      res.setHeader('X-Rate-Limit-Remaining', limit - used);
      res.setHeader('X-Rate-Limit-Reset', reset);

      return input.respond(res, 429, 'rate limit exceeded. try again in ' + Math.round(reset - now) + ' seconds.');

    }

    input.validator.fields(id, data, function(err, valid) {

      if (!valid || res.headersSent) {
        return input.respond(res, 400, err);
      }

      input.emit('data', id, data);

      res.setHeader('X-Rate-Limit-Limit', limit);
      res.setHeader('X-Rate-Limit-Remaining', limit - used);
      res.setHeader('X-Rate-Limit-Reset', reset);

      return input.respond(res, 200, 'success');

    });

  });

};

app.clear = function(req, res) {

  var data = {},
    pub = req.publicKey,
    prv = req.privateKey,
    input = this,
    id = false;

  // check for public key
  if (!pub) {
    return this.respond(res, 404, 'stream not found');
  }

  // check for private key
  if (!prv) {
    return this.respond(res, 403, 'forbidden: missing private key');
  }

  // validate keys
  if (!this.keychain.validate(pub, prv)) {
    return this.respond(res, 401, 'forbidden: invalid key');
  }

  // get the id
  id = this.keychain.getIdFromPrivateKey(prv);

  this.validator.exists(id, function(err, valid) {

    if (!valid) {
      return input.respond(res, 400, err);
    }

    input.emit('clear', id);

    input.respond(res, 200, 'success');

  });

};

app.respond = function(res, status, message) {

  var success = status === 200;

  if (res.headersSent) {
    return;
  }

  res.statusCode = status;

  if (res.getHeader('content-type') === 'application/json') {
    res.end(JSON.stringify({
      'success': success,
      'message': message
    }));
  } else {
    res.end(Number(success) + ' ' + message + '\n');
  }

};

app.limit = function(req, res) {

  var size = 0,
    self = this;

  // GET limit
  if (req.url.length > self.requestLimit) {
    this.respond(res, 414, 'URL size limit exceeded.\ncurrent limit: ' + self.requestLimit + ' characters');
    req.destroy();
    return;
  }

  // POST limit
  req.on('data', function(chunk) {

    size += chunk.length;

    // abort request if over limit
    if (size > self.requestLimit) {
      self.respond(res, 413, 'request size limit exceeded.\ncurrent limit: ' + self.requestLimit + ' bytes');
      req.destroy();
    }

  });

};

app.setContentType = function(req, res) {

  var type = http_helper.contentType(req);

  // default to text/plain
  if (app.mimeTypes.indexOf(type) === -1) {
    return res.setHeader('content-type', 'text/plain');
  }

  res.setHeader('content-type', type);

};

app.route = function(req, res) {

  var self = this;

  // set the response content type
  this.setContentType(req, res);

  // limit the size of the request
  this.limit(req, res);

  http_helper.route(req, function(err, command) {

    if (err) {
      return self.respond(res, 400, err);
    }

    switch (command) {
      case 'clear':
        self.clear(req, res);
        break;
      case 'log':
      default:
        self.log(req, res);
    }

  });

};
