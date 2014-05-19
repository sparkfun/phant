/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var util = require('util');

/**** Throttler prototype ****/
var app = Throttler.prototype;

/**** Expose Throttler ****/
exports = module.exports = Throttler;

/**** Initialize a new Throttler ****/
function Throttler(config) {

  if (!(this instanceof Throttler)) {
    return new Throttler(config);
  }

  config = config || {};

  util._extend(this, config);

}

app.limit = 100;
app.window = 900; // 15 mins in seconds
app.blocked = {};

app.available = function(key, cb) {

  var self = this,
    block;

  if (this.blocked.hasOwnProperty(key)) {
    block = this.blocked[key];
    block.used++;
    return cb(block.used < this.limit, block.used, this.limit, block.reset);
  }

  this.block(key, function(block) {
    cb(true, block.used, self.limit, block.reset);
  });

};

app.block = function(key, cb) {

  var now = (new Date()).getTime() / 1000;

  this.blocked[key] = {
    used: 1,
    reset: now + this.window
  };

  setTimeout(this.clear.bind(this), this.window * 1000, key);

  cb(this.blocked[key]);

};

app.clear = function(key) {

  delete this.blocked[key];

};
