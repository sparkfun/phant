/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

/**** Module dependencies ****/
var formidable = require('formidable'),
  events = require('events'),
  url = require('url'),
  util = require('util');

/**** PhantInput prototype ****/
var app = {};

/**** Expose PhantInput ****/
exports = module.exports = PhantInput;

/**** Initialize a new PhantInput ****/
function PhantInput(config) {

  config = config || {};

  // create a responder
  var responder = function(req, res) {

    if (res.headerSent) {
      return;
    }

    var obj_url = url.parse(req.url, true);

    // if there's a last bit after a period use that for file ext
    var extension = null;
    var regexp = /\.([a-z0-9]*)$/i;
    var matches = obj_url.pathname.match(regexp);
    if (matches) {
      extension = matches[1];
    }

    res.setHeader('X-Powered-By', 'phant');

    if (extension in app.request_types) {
      // todo they provided accepts
      res.setHeader('Accept', app.request_types[extension]);
    }

    var arr_path = obj_url.pathname.replace(regexp, '').split('/');

    if (arr_path[1] !== 'input') {
      return;
    }

    req.public_key = arr_path[2];

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
      runCommand(arr_path[3]);
    });

    var runCommand = function(command) {
      switch (command) {
        case 'clear':
          responder.clear(req, res);
          break;
        case 'log':
          /* falls through */
        default:
          responder.log(req, res);
      }
    };

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
app.request_types = {
  'json': 'application/json',
  'txt': 'text/plain'
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

  var accepts = res._headers.accept || 'text/plain';
  var success = status === 200;

  if (accepts === 'application/json') {
    res.end(JSON.stringify({
      'success': success,
      'message': message
    }));
  } else {
    res.end(Number(success) + ' ' + message + '\n');
  }

};
