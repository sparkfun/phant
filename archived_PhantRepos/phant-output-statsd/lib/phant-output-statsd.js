/**
 * phant-output-statsd
 * https://github.com/sparkfun/phant-output-statsd
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var lynx = require('lynx'),
  util = require('util'),
  events = require('events');

/**** Make PhantOutput an event emitter ****/
util.inherits(PhantOutput, events.EventEmitter);

/**** PhantOutput prototype ****/
var app = PhantOutput.prototype;

/**** Expose PhantOutput ****/
exports = module.exports = PhantOutput;

/**** Initialize a new PhantOutput ****/
function PhantOutput(config) {

  if (!(this instanceof PhantOutput)) {
    return new PhantOutput(config);
  }

  events.EventEmitter.call(this);

  util._extend(this, config || {});

  this.metrics = new lynx(this.host, this.port);

}

/**** Defaults ****/
app.moduleName = 'Output statsd';
app.host = 'localhost';
app.port = 8125;
app.metrics = false;

app.write = function(id, data) {

  if (!this.metrics) {
    return this.emit('error', 'statsd client init failed');
  }

  this.metrics.increment('stream.write');

};

app.clear = function(id) {

  if (!this.metrics) {
    return this.emit('error', 'statsd client init failed');
  }

  this.metrics.increment('stream.clear');

};
