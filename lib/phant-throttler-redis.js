/*
 * phant-throttler-redis
 * https://github.com/sparkfun/phant-throttler-redis
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var util = require('util'),
    redis = require('redis');

/**** Throttler prototype ****/
var app = Throttler.prototype;

/**** Expose Throttler ****/
exports = module.exports = Throttler;

/**** Initialize a new Throttler ****/
function Throttler(config) {

  if (! (this instanceof Throttler)) {
    return new Throttler(config);
  }

  util._extend(this, config || {});

  this.redis = redis.createClient(this.port, this.host);

}

app.host = 'localhost';
app.port = 6379;
app.redis = false;
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

  this.redis.hgetall(key, function(err, block) {

    if(! block) {

      block = {
        used: 1,
        reset: now + self.window
      };

      self.redis.hmset(key, block, function() {
        cb(block);
      });

      self.redis.expire(key, self.window);

      return;

    }

    block.used++;

    self.redis.hmset(key, block, function() {
      cb(block);
    });

    self.redis.expire(key, Math.round(block.reset - now));

  });

};

