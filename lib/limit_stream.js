/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var stream = require('stream'),
  util = require('util');

/**** Make LimitStream a transform stream ****/
util.inherits(LimitStream, stream.Transform);

/**** LimitStream prototype ****/
var app = LimitStream.prototype;

/**** Expose LimitStream ****/
exports = module.exports = LimitStream;

/**** Initialize a new LimitStream ****/
function LimitStream(limit) {

  if (!(this instanceof LimitStream)) {
    return new LimitStream(limit);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  this.limit = parseInt(limit);

}

app.limit = 0;
app.count = 0;

app._transform = function(obj, encoding, callback) {

  if (this.limit > this.count) {
    this.push(obj);
    this.count++;
  }

  callback();

};

app._flush = function(callback) {
  callback();
};

app.write = function(chunk, encoding, cb) {

  if (this.count >= this.limit) {
    this.end();
    return false;
  }

  return stream.Transform.prototype.write.apply(this, arguments);

};
