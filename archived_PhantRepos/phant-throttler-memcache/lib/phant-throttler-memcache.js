/*
 * phant-throttler-memcache
 * https://github.com/sparkfun/phant-throttler-memcache
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var util = require('util'),
    Memcached = require('memcached');

/**** Throttler prototype ****/
var app = Throttler.prototype;

/**** Expose Throttler ****/
exports = module.exports = Throttler;

/**** Initialize a new Throttler ****/
function Throttler(config) {

  if (! (this instanceof Throttler)) {
    return new Throttler(config);
  }

  config = config || {};

  util._extend(this, config);

  app.memcache = new Memcached(this.host);

}

app.host = 'localhost:11211'; // see: https://github.com/3rd-Eden/node-memcached#server-locations
app.memcache = false;
app.limit = 100; // number of requests allowed in window
app.window = 900; // 15 mins in seconds

app.available = function(key, cb) {

  var self = this;

  this.block(key, function(block) {

    cb(block.used < self.limit, block.used, self.limit, block.reset);

  });

};

app.block = function(key, cb) {

  var self = this,
      now = (new Date()).getTime() / 1000;

  key = 'phant_throttle_' + key;

  this.memcache.get(key, function(err, block) {

    if(! block) {

      block = {
        used: 1,
        reset: now + self.window
      };

      self.memcache.set(key, block, self.window, function() {
        cb(block);
      });

      return;

    }

    block.used++;

    self.memcache.replace(key, block, Math.round(block.reset - now), function() {
      cb(block);
    });

  });

};

