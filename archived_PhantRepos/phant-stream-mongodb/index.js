/**
 * phant-stream-mongodb
 * https://github.com/sparkfun/phant-stream-mongodb
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var util = require('util'),
    events = require('events'),
    Promise = require('bluebird'),
    DB = require('./lib/db'),
    Readable = require('./lib/readable'),
    Writable = require('./lib/writable');

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

  events.EventEmitter.call(this);

  // apply the options
  util._extend(this, options || {});

  // convert cap to int
  this.cap = parseInt(this.cap);

  // make sure cap is numeric
  if(isNaN(this.cap)) {
    this.cap = 0;
  }

  this.db = DB({
    url: this.url
  });

}

app.moduleName = 'Stream MongoDB';
app.cap = 50 * 1024 * 1024; // 50mb
app.pageSize = 250; // 250 items per page
app.url = 'mongodb://localhost/test';
app.db = false;

app.readStream = function(id, page) {

  return Readable({
    mongo: this.db,
    id: id,
    page: parseInt(page),
    pageSize: parseInt(this.pageSize)
  });

};

app.objectReadStream = app.readStream;

app.writeStream = function(id) {

  return Writable({
    mongo: this.db,
    id: id,
    cap: this.cap
  });

};

app.write = function(id, data) {

  this.writeStream(id).end(data);

};

app.clear = function(id) {

  var self = this;

  if(!this.db) {
    this.emit('error', 'MongoDB connection failed');
    return;
  }

  this.db.connect().then(function(db) {

    db.dropCollection(id, function(err, result) {

      if(err) {
        self.emit('error', err);
      }

    });

  }).catch(function(err) {
    self.emit('error', err);
  });

};

app.stats = function(id, callback) {

  var self = this;

  if(!this.db) {
    this.emit('error', 'MongoDB connection failed');
    return;
  }

  this.db.connect().then(function(db) {

    db.collection(id, {strict:true}, function(err, col) {

      // collection doesn't exist, return empty stats
      if(err) {
        return callback(null, {
          cap: self.cap,
          used: 0,
          pageCount: 0,
          remaining: self.cap
        });
      }

      // get stats from MongoDB
      col.stats(function(err, s) {

        // grabbing collection stats failed, return empty stats
        if(err) {
          return callback(null, {
            cap: self.cap,
            used: 0,
            pageCount: 0,
            remaining: self.cap
          });
        }

        // build stats object
        var stats = {
          cap: self.cap,
          used: s.size,
          pageCount: Math.ceil(s.count / self.pageSize)
        };

        stats.remaining = stats.cap - stats.used;

        if(stats.remaining < 0) {
          stats.remaining = 0;
        }

        callback(null, stats);

      });

    });

  }).catch(function(err) {

    // log err
    self.emit('error', err);

    // return default stats object
    return callback(null, {
      cap: self.cap,
      used: 0,
      pageCount: 0,
      remaining: self.cap
    });

  });

};
