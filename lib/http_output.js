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
  SampleStream = require('./sample_stream'),
  AtomStream = require('./atom_stream'),
  OffsetStream = require('./offset_stream'),
  SqlStream = require('./sql_stream'),
  FilterStream = require('./filter_stream'),
  TimezoneStream = require('./timezone_stream'),
  Qs = require('qs'),
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

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');

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
app.moduleName = 'HTTP output';
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
    page = req.query.page || false,
    id;

  var download = (req.latest || Object.keys(req.query).length > 0) ? false : true;

  // check for public key
  if (!pub) {
    return error(404, 'stream not found');
  }

  if (req.latest) {
    page = 1;
  }

  // get the id
  id = this.keychain.getIdFromPublicKey(pub);

  this.validator.exists(id, function(err, stream) {

    if (err) {
      return error(404, err);
    }

    var readStream = self.storage.objectReadStream(id, page);

    readStream.on('error', function(err) {
      self.emit('error', err);
      error(404, 'no data has been pushed to this stream');
    });

    readStream.once('open', function() {

      if (res.headersSent) {
        return;
      }

      res.statusCode = 200;
      res.setHeader('Transfer-Encoding', 'chunked');

      // add filters if needed
      readStream = self.addFilters(req.query, readStream);

      // offset by requested amount
      if (req.query.offset) {
        readStream = readStream.pipe(
          OffsetStream(req.query.offset)
        );
      }

      // grab every nth record
      if (req.query.sample) {
        readStream = readStream.pipe(
          SampleStream(req.query.sample)
        );
      }

      // don't limit if asking for latest record
      if (req.query.limit && !req.latest) {
        readStream = readStream.pipe(
          LimitStream(req.query.limit)
        );
      }

      // only grab the latest record
      if (req.latest) {
        readStream = readStream.pipe(LimitStream(1));
      }

      // convert timezone if requested
      if (req.query.timezone) {
        readStream = readStream.pipe(
          TimezoneStream(req.query.timezone)
        );
      }

      // only return one field
      if (req.field) {

        res.setHeader('Content-Type', 'text/plain');

        var fieldStream = FieldStream(req.field);

        fieldStream.on('error', function(err) {
          error(404, err);
        });

        readStream.pipe(fieldStream).pipe(res);

        return;

      }

      switch (res.getHeader('content-type')) {

        case 'application/json':
          if (download) {
            res.setHeader('Content-Disposition', 'attachment; filename=stream_' + req.publicKey + '.json');
          }
          readStream.pipe(JSONStream.stringify('[', ',', ']')).pipe(res);
          break;
        case 'text/javascript':
          readStream.pipe(JSONStream.stringify('[', ',', ']')).pipe(JSONPstream(req.callback)).pipe(res);
          break;
        case 'application/atom+xml':
          // cheating to get metadata
          self.validator.metadata.get(id, function(err, meta) {

            // add the link to the stream
            meta.link = 'http://' + req.headers['host'] + '/streams/' + pub;

            var atomStream = AtomStream(meta);

            if (!req.latest) {
              readStream = readStream.pipe(LimitStream(50));
            }

            readStream.pipe(atomStream).pipe(res);

          });
          break;

        case 'text/psql':
        case 'text/x-psql':

          // sql files should just be plain text
          res.setHeader('Content-Type', 'text/plain');

          // cheating to get metadata
          self.validator.metadata.get(id, function(err, meta) {

            var sqlStream = SqlStream(meta, 'pg');

            if (download) {
              res.setHeader('Content-Disposition', 'attachment; filename=stream_' + req.publicKey + '.psql');
            }

            self.preventExcessChunking(readStream, sqlStream, res);

          });
          break;

        case 'text/sql':
        case 'text/x-sql':

          // sql files should just be plain text
          res.setHeader('Content-Type', 'text/plain');

          // cheating to get metadata
          self.validator.metadata.get(id, function(err, meta) {

            var sqlStream = SqlStream(meta, 'mysql');

            if (download) {
              res.setHeader('Content-Disposition', 'attachment; filename=stream_' + req.publicKey + '.sql');
            }

            self.preventExcessChunking(readStream, sqlStream, res);

          });
          break;

        case 'text/csv':
        case 'text/plain':
        default:
          res.setHeader('Content-Type', 'text/plain');

          if (download) {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=stream_' + req.publicKey + '.csv');
          }

          self.preventExcessChunking(readStream, csv(), res);

          break;

      }

    });

  });

};

app.latest = function(req, res) {

  req.latest = true;

  this.view(req, res);

};

app.preventExcessChunking = function(data, stream, res) {
  var out = '';

  var interval = setInterval(function(){
    if (out.length) {
      res.write(out);
      out = '';
    }
  }, 1500);

  stream.on('data', function(buffer) {
    out += buffer;
  });

  stream.on('end',function(){
    res.end(out);
    clearInterval(interval);
  });

  data.pipe(stream);
}

app.addFilters = function(query, stream) {

  for (var param in query) {

    if (!query.hasOwnProperty(param)) {
      continue;
    }

    // check to see if param is a valid operator
    if (FilterStream.operators.indexOf(param) === -1) {
      continue;
    }

    // loop through fields in operator
    for (var field in query[param]) {

      if (!query[param].hasOwnProperty(field)) {
        continue;
      }

      // add filter
      stream = stream.pipe(
        FilterStream(field, param, query[param][field])
      );

    }

  }

  return stream;

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

          res.setHeader('Content-Type', 'text/plain');

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
    case 'application/atom+xml':
    case 'text/csv':
    case 'text/plain':
    default:
      res.setHeader('Content-Type', 'text/plain');
      res.end(message + '\n');
      break;

  }

};

app.setContentType = function(req, res) {

  var parsed = url.parse(req.url),
    valid = ['application/json', 'text/plain', 'text/csv', 'text/javascript'];

  req.query = Qs.parse(parsed.query);

  // grab the callback name for jsonp
  if (req.query.callback) {
    req.callback = req.query.callback.replace(/[^\[\]\w$.]/g, '');
    return res.setHeader('Content-Type', 'text/javascript');
  }

  if (req.extension === 'json') {
    return res.setHeader('Content-Type', 'application/json');
  }

  if (req.extension === 'atom') {
    return res.setHeader('Content-Type', 'application/atom+xml');
  }

  if (req.extension === 'sql') {
    return res.setHeader('Content-Type', 'text/x-sql');
  }

  if (req.extension === 'psql') {
    return res.setHeader('Content-Type', 'text/x-psql');
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

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  req.extension = match.params.ext;
  req.field = match.params.field;

  // set the response content type
  this.setContentType(req, res);

  // set public key
  req.publicKey = match.params.publicKey;

  this[action].call(this, req, res);

};