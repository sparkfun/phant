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

  if(! (this instanceof Throttler)) {
    return new Throttler(config);
  }

  config = config || {};

  util._extend(this, config);

}

app.rate = 10000;
app.blocked = {};

app.available = function(key, cb) {

  if(this.blocked.hasOwnProperty(key)) {
    return cb(false);
  }

  cb(true);

  this.block(key);

  setTimeout(this.clear.bind(this), this.rate, key);

};


app.block = function(key) {

  this.blocked[key] = true;

};

app.clear = function(key) {

  delete this.blocked[key];

};
