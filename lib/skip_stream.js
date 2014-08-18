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

/**** Make SkipStream a transform stream ****/
util.inherits(SkipStream, stream.Transform);

/**** SkipStream prototype ****/
var app = SkipStream.prototype;

/**** Expose SkipStream ****/
exports = module.exports = SkipStream;

/**** Initialize a new SkipStream ****/
function SkipStream(skip) {

  if (!(this instanceof SkipStream)) {
    return new SkipStream(skip);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  this.skip = parseInt(skip);

}

app.skip = 0;
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
