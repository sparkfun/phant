/**
 * phant-stream-json
 * https://github.com/sparkfun/phant-stream-json
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var util = require('util'),
    events = require('events'),
    helpers = require('./lib/helpers'),
    Readable = require('./lib/readable'),
    Writable = require('./lib/writable'),
    JSONStream = require('JSONStream');

/**** Make PhantStream an event emitter ****/
util.inherits(PhantStream, events.EventEmitter);

/**** app prototype ****/
var app = PhantStream.prototype;

/**** Expose PhantStream ****/
exports = module.exports = PhantStream;

function PhantStream(options) {

  if (! (this instanceof PhantStream)) {
    return new PhantStream(options);
  }

  options = options || {};

  events.EventEmitter.call(this, options);

  // apply the options
  util._extend(this, options);

  // point the file helpers at passed root folder
  this.helpers = helpers({root: this.directory});

}

app.moduleName = 'JSON stream';
app.cap = 50 * 1024 * 1024; // 50mb
app.chunk = 500 * 1024; // 500k
app.directory = 'tmp';

app.readStream = function(id, page) {

  var all = false;

  if(! page) {
    all = true;
    page = 1;
  }

  return new Readable(id, {
    page: page,
    all: all,
    root: this.directory
  });

};

app.objectReadStream = function(id, page) {

  var read = this.readStream(id, page),
      transformed = read.pipe(JSONStream.parse());

  transformed.all = read.all;

  read.on('error', function(err) {
    transformed.emit('error', err);
  });

  read.on('open', function() {
    transformed.emit('open');
  });

  return transformed;

};

app.write = function(id, data) {

  var stream = this.writeStream(id);

  stream.end(JSON.stringify(data) + '\n');

};

app.clear = function(id) {

  var self = this;

  this.helpers.rmdir(id, function(err) {

    if(err) {
      self.emit('error', err);
    }

  });

};

app.writeStream = function(id) {

  return new Writable(id, {
    cap: this.cap,
    chunk: this.chunk,
    root: this.directory
  });

};

app.stats = function(id, cb) {

  var cap = this.cap;

  this.helpers.stats(id, function(err, stats) {

    if(err) {
      cb(err);
    }

    stats.cap = cap;
    stats.remaining = cap - stats.used;

    if(stats.remaining < 0) {
      stats.remaining = 0;
    }

    cb(null, stats);

  }.bind(this));

};
