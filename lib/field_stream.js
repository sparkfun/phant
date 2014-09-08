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

/**** Make FieldStream a transform stream ****/
util.inherits(FieldStream, stream.Transform);

/**** FieldStream prototype ****/
var proto = FieldStream.prototype;

/**** Expose FieldStream ****/
exports = module.exports = FieldStream;

/**** FieldStream constructor ****/
function FieldStream(field) {

  if (!(this instanceof FieldStream)) {
    return new FieldStream(field);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.field = field;

}

proto.field = false;

proto._transform = function(obj, encoding, callback) {

  if (obj.hasOwnProperty(this.field)) {
    this.push(obj[this.field] + '\n');
  } else {
    this.emit('error', 'Invalid field: ' + this.field);
    this.end();
  }

  callback();

};
