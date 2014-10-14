/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

/**** Module dependencies ****/
var events = require('events'),
  formidable = require('formidable'),
  url = require('url'),
  util = require('util'),
  Router = require('routes'),
  router = new Router();

/**** PhantInput prototype ****/
var app = {};

/**** Expose PhantInput ****/
exports = module.exports = PhantInput;

/**** Initialize a new PhantInput ****/
function PhantInput(config) {

  // create a responder
  var responder = function(req, res) {

    if (!req.url.match(/^\/input\//)) {
      return;
    }

    if (res.headersSent) {
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Phant-Private-Key');

    var match = router.match(url.parse(req.url).pathname);


    if(!match) {

      var body = '404: Not Found\n';

      res.writeHead(404, {
        'Content-Type': 'text/plain',
        'Content-Length': body.length
      });

      res.end(body);

      return;

    }

    match.fn(req, res, match);

    return responder;

  };

  util._extend(responder, events.EventEmitter.prototype);
  util._extend(responder, app);
  util._extend(responder, config || {});

  router.addRoute('/input/:publicKey/clear.:ext', responder.route.bind(responder, 'clear'));
  router.addRoute('/input/:publicKey/clear', responder.route.bind(responder, 'clear'));
  router.addRoute('/input/:publicKey.:ext', responder.route.bind(responder, 'log'));
  router.addRoute('/input/:publicKey', responder.route.bind(responder, 'log'));

  return responder;

}

/**** Defaults ****/
app.moduleName = 'HTTP input';
app.validator = false;
app.keychain = false;
app.requestLimit = 51200; // 50k

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
    respond = this.respond.bind(this, req, res),
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
    return respond(404, 'stream not found');
  }

  // check for private key
  if (!prv) {
    return respond(403, 'forbidden: missing private key');
  }

  // make sure they sent some data
  if (!data || data.length === 0) {
    return respond(400, 'no data received');
  }

  // validate keys
  if (!this.keychain.validate(pub, prv)) {
    return respond(401, 'forbidden: invalid key');
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

      return respond(429, 'rate limit exceeded. try again in ' + Math.round(reset - now) + ' seconds.');

    }

    input.validator.fields(id, data, function(err, valid) {

      if (!valid || res.headersSent) {
        return respond(400, err);
      }

      input.emit('data', id, data);

      res.setHeader('X-Rate-Limit-Limit', limit);
      res.setHeader('X-Rate-Limit-Remaining', limit - used);
      res.setHeader('X-Rate-Limit-Reset', reset);

      return respond(200, 'success');

    });

  });

};

app.clear = function(req, res) {

  var data = {},
    pub = req.publicKey,
    prv = req.privateKey,
    respond = this.respond.bind(this, req, res),
    input = this,
    id = false;

  // check for public key
  if (!pub) {
    return respond(404, 'stream not found');
  }

  // check for private key
  if (!prv) {
    return respond(403, 'forbidden: missing private key');
  }

  // validate keys
  if (!this.keychain.validate(pub, prv)) {
    return respond(401, 'forbidden: invalid key');
  }

  // get the id
  id = this.keychain.getIdFromPrivateKey(prv);

  this.validator.exists(id, function(err, valid) {

    if (!valid) {
      return respond(400, err);
    }

    input.emit('clear', id);

    respond(200, 'success');

  });

};

app.respond = function(req, res, status, message) {

  var success = status === 200;

  if (res.headersSent) {
    return;
  }

  res.statusCode = status;

  switch (res.getHeader('content-type')) {

    case 'application/json':
      res.end(JSON.stringify({
        'success': success,
        'message': message
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
          success: success,
          message: message
        }) + ');'
      );
      break;
    case 'text/plain':
    default:
      res.end(Number(success) + ' ' + message + '\n');
      break;

  }

};

app.limit = function(req, res) {

  var size = 0,
    self = this;

  // GET limit
  if (req.url.length > self.requestLimit) {
    this.respond(req, res, 414, 'URL size limit exceeded.\ncurrent limit: ' + self.requestLimit + ' characters');
    req.destroy();
    return;
  }

  // POST limit
  req.on('data', function(chunk) {

    size += chunk.length;

    // abort request if over limit
    if (size > self.requestLimit) {
      self.respond(req, res, 413, 'request size limit exceeded.\ncurrent limit: ' + self.requestLimit + ' bytes');
      req.destroy();
    }

  });

};

app.setContentType = function(req, res) {

  var parsed = url.parse(req.url, true),
    valid = ['application/json', 'text/plain', 'text/javascript'];

  // grab the callback name for jsonp
  if (parsed.query.callback) {
    req.callback = parsed.query.callback.replace(/[^\[\]\w$.]/g, '');
    return res.setHeader('Content-Type', 'text/javascript');
  }

  if (req.extension === 'json') {
    return res.setHeader('Content-Type', 'application/json');
  }

  if (!req.headers.accept) {
    return res.setHeader('Content-Type', 'text/plain');
  }

  // use the first item in the accept list for a fallback
  var fallback = req.headers.accept.split(',')[0].trim();

  // default to text/plain
  if (valid.indexOf(fallback) === -1) {
    return res.setHeader('Content-Type', 'text/plain');
  }

  res.setHeader('Content-Type', fallback);

};

app.route = function(action, req, res, match) {

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  var parsed = url.parse(req.url, true),
    form = formidable.IncomingForm(),
    input = this;

  // add extension if there is one
  req.extension = match.params.ext;

  // set the response content type
  this.setContentType(req, res);

  // limit the size of the request
  this.limit(req, res);

  req.publicKey = match.params.publicKey;

  // the private key might come in the header or as a GET var depending on the method used for sending data.
  req.privateKey = req.headers['phant-private-key'] ? req.headers['phant-private-key'] : parsed.query.private_key;

  // add the query to the request
  req.query = parsed.query;

  // strip out cruft
  delete req.query.callback;
  delete req.query.private_key;

  form.parse(req, function(err, fields, files) {

    // add the parsed body to the request
    req.body = fields;

    // any delete should be passed to the clear action
    if (req.method === 'DELETE') {
      return input.clear(req, res);
    }

    // call the action
    input[action].call(input, req, res);

  });

};
