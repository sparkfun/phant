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
    _ = require('lodash');

/**** PhantInput prototype ****/
var app = {};

/**** Expose PhantInput ****/
exports = module.exports = PhantInput;

/**** Initialize a new PhantInput ****/
function PhantInput(config) {

  config = config || {};

  // create a responder
  var responder = function(req, res) {

    if(! req.url.match(/^\/input\//)) {
      return function(req, res) { return; };
    }

    if(res.headerSent) {
      return function(req, res) { return; };
    }

    return responder.express.call(this, req, res);

  };

  _.extend(responder, events.EventEmitter.prototype);
  _.extend(responder, app);
  _.extend(responder, config);

  responder.express = responder.expressInit();

  return responder;

}

/**** Defaults ****/
app.name = 'HTTP input';
app.metadata = false;
app.validator = false;
app.keychain = false;

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
      clear = this.clear.bind(this);

  exp.use(function(req, res, next) {

    if(req.headers['Phant-Private-Key']) {
      req.params.private_key = req.headers['Phant-Private-Key'];
    }

    res.header('X-Powered-By', 'phant');

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

  if(_acceptParam) {
    req.headers.accept = _acceptParam;
  } else if(url.parse(req.url).pathname.match(/\.json$/)) {
    req.headers.accept = 'application/json';
  } else if(url.parse(req.url).pathname.match(/\.txt$/)) {
    req.headers.accept = 'text/plain';
  }

  next();

};

app.log = function(req, res) {

  var data = {},
      respond = this.respond.bind(res),
      pub = req.param('public'),
      prv = req.param('private_key'),
      input = this,
      id = false;

  // get post body or query string params
  if(req.method === 'POST') {
    data = _.extend(req.body, req.query);
  }

  // get query string params
  if(req.method === 'GET') {
    data = req.query;
  }

  // remove the private key from the data
  delete data.private_key;

  // check for public key
  if(! pub) {
    res.writeHead(403);
    this.error(res, 'stream not found');
    return;
  }

  // check for private key
  if(! prv) {
    res.writeHead(403);
    return this.error(res, 'forbidden: missing private key');
  }

  // make sure they sent some data
  if(_.isEmpty(data)) {
    res.writeHead(400);
    return this.error(res, 'no data received');
  }

  // validate keys
  if(! this.keychain.validate(pub, prv)) {
    res.writeHead(401);
    return this.error(res, 'forbidden: invalid key');
  }

  // get the id
  id = this.keychain.getIdFromPrivateKey(prv);

  // add timestamp
  data.timestamp = new Date().toISOString();

  this.throttler.available(pub, function(ready, used, limit, reset) {

    var now = Math.round((new Date()).getTime() / 1000);

    if(! ready) {

      res.writeHead(429, {
        'X-Rate-Limit-Limit': limit,
        'X-Rate-Limit-Remaining': limit - used,
        'X-Rate-Limit-Reset': reset
      });

      return input.error(res, 'rate limit exceeded. try again in ' + (reset - now) + ' seconds.');

    }

    input.validator.validate(id, data, function(err, valid) {

      if(! valid) {
        res.writeHead(400);
        return input.error(res, err);
      }

      input.emit('data', id, data);

      res.writeHead(200, {
        'X-Rate-Limit-Limit': limit,
        'X-Rate-Limit-Remaining': limit - used,
        'X-Rate-Limit-Reset': reset
      });

      return input.respond(res, 'success');

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
  if(! pub) {
    res.writeHead(404);
    return this.error(res, 'stream not found');
  }

  // check for private key
  if(! prv) {
    res.writeHead(403);
    return this.error(res, 'forbidden: missing private key');
  }

  // validate keys
  if(! this.keychain.validate(pub, prv)) {
    res.writeHead(401);
    return this.error(res, 'forbidden: invalid key');
  }

  // get the id
  id = this.keychain.getIdFromPrivateKey(prv);

  this.validator.exists(id, function(err, valid) {

    if(! valid) {
      res.writeHead(400);
      return input.error(err);
    }

    input.emit('clear', id);

    res.writeHead(200);
    input.respond(res, 'success');

  });

};

app.error = function(res, message) {

  res.format({
    txt: function() {
      res.write(
        '0 ' + message
      );
    },
    json: function() {
      res.json({
        success: false,
        message: message
      });
    }
  });

};

app.respond = function(res, message) {

  res.format({
    txt: function() {
      res.end(
        '1 ' + message
      );
    },
    json: function() {
      res.json({
        success: true,
        message: message
      });
    }
  });

};

