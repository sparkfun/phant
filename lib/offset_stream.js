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

/**** Make OffsetStream a transform stream ****/
util.inherits(OffsetStream, stream.Transform);

/**** OffsetStream prototype ****/
var app = OffsetStream.prototype;

/**** Expose OffsetStream ****/
exports = module.exports = OffsetStream;

/**** Initialize a new OffsetStream ****/
function OffsetStream(offset) {

  if (!(this instanceof OffsetStream)) {
    return new OffsetStream(offset);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  this.offset = parseInt(offset);

}

app.offset = 0;
app.count = 0;

app._transform = function(obj, encoding, callback) {

  if (!this.offset) {
    this.push(obj);
    return callback();
  }

  if (this.count >= this.offset) {
    this.push(obj);
  }

  this.count++;

  callback();

};

app._flush = function(callback) {
  callback();
};
