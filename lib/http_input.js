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

    http_helper.route(req, function(err, command) {

      var set_content_type = false;
      if (req._extension) {
        if (req._extension in app.content_types) {
          res.setHeader('content-type', app.content_types[req._extension]);
          set_content_type = true;
        }
        delete req._extension;
      } else if (req.headers.accept) {
        for (var i in app.content_types) {
          if (this.content_types[i] === req.headers.accept) {
            res.setHeader('content-type', app.content_types[i]);
            set_content_type = true;
          }
        }
      }

      if (!set_content_type) {
        res.setHeader('content-type', 'text/csv');
      }

      switch (command) {
        case 'clear':
          responder.clear(req, res);
          break;
        case 'log':
          /* falls through */
        default:
          responder.log(req, res);
      }
    });

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
app.content_types = {
  'json': 'application/json',
  'csv': 'text/csv'
};


/**** Default throttler ****/
app.throttler = {
  available: function(key, cb) {

    var now = Math.round((new Date()).getTime() / 1000);

    cb(true, 0, 100, now);

  }
};

app.log = function(req, res) {

  var data = {},
    pub = req.public_key,
    prv = req.private_key,
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

      if (!valid) {
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
    pub = req.public_key,
    prv = req.private_key,
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

  res.statusCode = status;

  var success = status === 200;

  if (res._headers['content-type'] === 'application/json') {
    res.end(JSON.stringify({
      'success': success,
      'message': message
    }));
  } else {
    res.end(Number(success) + ' ' + message + '\n');
  }

};
