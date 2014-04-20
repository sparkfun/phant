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

app.available = function(id, cb) {

  if(this.blocked.hasOwnProperty(id)) {
    return cb(false);
  }

  this.block(id);

  setTimeout(this.clear.bind(this), this.rate, id);

};


app.block = function(id) {

  this.blocked[id] = true;

};

app.clear = function(id) {

  delete this.blocked[id];

};
