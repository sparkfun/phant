/*
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var events = require('events'),
    util = require("util");

/**** Initialize a new Phant ****/
function Phant() {

  if (! (this instanceof Phant)) {
    return new Phant();
  }

  events.EventEmitter.call(this);
  this.on('error', this.onError);

  this.meta = false;

  this.inputs = [];
  this.outputs = [];
  this.managers = [];

}

/**** Phant prototype ****/
var app = Phant.prototype;

/**** Expose Phant ****/
exports = module.exports = Phant;

/**** Make Phant an event emitter ****/
util.inherits(Phant, events.EventEmitter);

/**** Log errors to console ****/
app.onError =  function(err) {
  console.log(err);
};
