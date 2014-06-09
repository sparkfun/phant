/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

/**** Module dependencies ****/
var express = require('express'),
  methodOverride = require('method-override'),
  bodyParser = require('body-parser'),
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

    if (!req.url.match(/^\/input\//)) {
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
app.name = 'HTTP input';
app.metadata = false;
app.validator = false;
app.keychain = false;
app.limit = 51200; // 50k

/**** Default throttler ****/
app.throttler = {
  available: function(key, cb) {

    var now = Math.round((new Date()).getTime() / 1000);

    cb(true, 0, 100, now);

  }
};

app.expressInit = function() {

  var exp = express(),
    log = this.log.bind(this),
    clear = this.clear.bind(this),
    self = this;

  exp.use(function(req, res, next) {

    var size = 0;

    if (req.headers['phant-private-key']) {
      req.query.private_key = req.headers['phant-private-key'];
    }

    if (req.query[exp.get('jsonp callback name')]) {
      res.callback = req.query[exp.get('jsonp callback name')];
    }

    res.header('X-Powered-By', 'phant');

    req.on('data', function(chunk) {

      size += chunk.length;

      // abort request if over limit
      if (size > self.limit) {
        self.error(res, 413, 'request size limit exceeded.\ncurrent limit: ' + self.limit + ' bytes');
        req.destroy();
      }

    });

    next();

  });

  exp.use(express.compress());
  exp.use(bodyParser.json());
  exp.use(bodyParser.urlencoded());
  exp.use(methodOverride());
  exp.use(this.responseType);

  exp.use(exp.router);

  exp.all('/input/:public/clear.:ext', clear);
  exp.all('/input/:public/clear', clear);
  exp.all('/input/:public.:ext', log);
  exp.all('/input/:public', log);
  exp.all('/input/*', log);

  return exp;

};


app.responseType = function(req, res, next) {

  var _acceptParam = req.param('_accept');

  if (_acceptParam) {
    req.headers.accept = _acceptParam;
  } else if (url.parse(req.url).pathname.match(/\.json$/)) {
    req.headers.accept = 'application/json';
  } else if (url.parse(req.url).pathname.match(/\.txt$/)) {
    req.headers.accept = 'text/plain';
  }

  next();

};

app.log = function(req, res) {

  var data = {},
    pub = req.param('public'),
    prv = req.param('private_key'),
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

  // remove the private key from the data
  delete data.private_key;

  // check for public key
  if (!pub) {
    return this.error(res, 404, 'stream not found');
  }

  // check for private key
  if (!prv) {
    return this.error(res, 403, 'forbidden: missing private key');
  }

  // make sure they sent some data
  if (!data || data.length === 0) {
    return this.error(res, 400, 'no data received');
  }

  // validate keys
  if (!this.keychain.validate(pub, prv)) {
    return this.error(res, 401, 'forbidden: invalid key');
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

      return input.error(res, 429, 'rate limit exceeded. try again in ' + Math.round(reset - now) + ' seconds.');

    }

    input.validator.fields(id, data, function(err, valid) {

      if (!valid) {
        return input.error(res, 400, err);
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
    pub = req.param('public'),
    prv = req.param('private_key'),
    input = this,
    id = false;

  // check for public key
  if (!pub) {
    return this.error(res, 404, 'stream not found');
  }

  // check for private key
  if (!prv) {
    return this.error(res, 403, 'forbidden: missing private key');
  }

  // validate keys
  if (!this.keychain.validate(pub, prv)) {
    return this.error(res, 401, 'forbidden: invalid key');
  }

  // get the id
  id = this.keychain.getIdFromPrivateKey(prv);

  this.validator.exists(id, function(err, valid) {

    if (!valid) {
      return input.error(res, 400, err);
    }

    input.emit('clear', id);

    input.respond(res, 200, 'success');

  });

};

app.error = function(res, status, message) {

  res.format({
    txt: function() {
      res.send(status,
        '0 ' + message + '\n'
      );
    },
    json: function() {
      if (res.callback) {
        return res.status(status).jsonp({
          success: true,
          message: message
        });
      }

      res.status(status).json({
        success: false,
        message: message
      });
    }
  });

};

app.respond = function(res, status, message) {

  res.format({
    txt: function() {
      res.send(status,
        '1 ' + message + '\n'
      );
    },
    json: function() {

      if (res.callback) {
        return res.status(status).jsonp({
          success: true,
          message: message
        });
      }

      res.status(status).json({
        success: true,
        message: message
      });
    }
  });

};
