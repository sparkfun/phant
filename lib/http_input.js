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

app.expressInit = function() {

  var exp = express(),
      log = this.log.bind(this),
      clear = this.clear.bind(this);

  exp.disable('x-powered-by');

  exp.use(function (req, res, next) {
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
    respond(404, false, 'stream not found');
    return;
  }

  // check for private key
  if(! prv) {
    respond(403, false, 'forbidden: missing private key');
    return;
  }

  // make sure they sent some data
  if(_.isEmpty(data)) {
    respond(400, false, 'no data received');
    return;
  }

  // validate keys
  if(! this.keychain.validate(pub, prv)) {
    respond(401, false, 'forbidden: invalid key');
    return;
  }

  // get the id
  id = this.keychain.getIdFromPrivateKey(prv);

  // add timestamp
  data.timestamp = new Date().toISOString();

  this.validator.validate(id, data, function(err, valid) {

    if(! valid) {
      respond(400, false, err);
      return;
    }

    input.emit('data', id, data, req.ip);
    respond(201, true, 'success');
    return;

  });

};

app.clear = function(req, res) {

  var data = {},
      respond = this.respond.bind(res),
      pub = req.param('public'),
      prv = req.param('private_key'),
      input = this,
      id = false;

  // check for public key
  if(! pub) {
    respond(404, false, 'stream not found');
    return;
  }

  // check for private key
  if(! prv) {
    respond(403, false, 'forbidden: missing private key');
    return;
  }

  // validate keys
  if(! this.keychain.validate(pub, prv)) {
    respond(401, false, 'forbidden: invalid key');
    return;
  }

  // get the id
  id = this.keychain.getIdFromPrivateKey(prv);

  this.validator.exists(id, function(err, valid) {

    if(! valid) {
      respond(400, false, err);
      return;
    }

    input.clear('data', id);
    respond(200, true, 'success');

  });

};

app.respond = function(status, success, message) {

  var res = this;

  res.format({
    txt: function(){
      res.send(status,
        (success ? '1 ' : '0 ') + message
      );
    },
    json: function(){
      res.status(status).json({
        success: success,
        message: message
      });
    }
  });

};

