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

/**** Make JSONPstream a transform stream ****/
util.inherits(JSONPstream, stream.Transform);

/**** JSONPstream prototype ****/
var app = JSONPstream.prototype;

/**** Expose JSONPstream ****/
exports = module.exports = JSONPstream;

/**** Initialize a new JSONPstream ****/
function JSONPstream(callback) {

  if (!(this instanceof JSONPstream)) {
    return new JSONPstream(callback);
  }

  stream.Transform.call(this);

  this.callback = callback;

}

app.callback = false;
app.opened = false;

app.open = function() {

  var cb = this.callback.replace(/[^\[\]\w$.]/g, '');

  this.push('typeof ' + cb + ' === \'function\' && ' + cb + '(', 'utf8');
  this.opened = true;

};

app._transform = function(line, encoding, callback) {

  if (!this.opened) {
    this.open();
  }

  if (!line) {
    return callback();
  }

  line = line.toString().replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

  this.push(line, 'utf8');
  callback();

};

app._flush = function(callback) {

  this.push(');', 'utf8');
  callback();

};
