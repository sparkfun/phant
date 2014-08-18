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

/**** Make SampleStream a transform stream ****/
util.inherits(SampleStream, stream.Transform);

/**** SampleStream prototype ****/
var app = SampleStream.prototype;

/**** Expose SampleStream ****/
exports = module.exports = SampleStream;

/**** Initialize a new SampleStream ****/
function SampleStream(skip) {

  if (!(this instanceof SampleStream)) {
    return new SampleStream(skip);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  this.skip = parseInt(skip);

}

app.skip = false;
app.count = 0;

app._transform = function(obj, encoding, callback) {

  if (!this.skip) {
    this.push(obj);
    return callback();
  }

  if ((this.count % this.skip) === 0) {
    this.push(obj);
  }

  this.count++;

  callback();

};

app._flush = function(callback) {
  callback();
};
