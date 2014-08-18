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
  sql = require('sql'),
  util = require('util');

/**** Make SqlStream a transform stream ****/
util.inherits(SqlStream, stream.Transform);

/**** SqlStream prototype ****/
var app = SqlStream.prototype;

/**** Expose SqlStream ****/
exports = module.exports = SqlStream;

/**** Initialize a new SqlStream ****/
function SqlStream(meta) {

  if (!(this instanceof SqlStream)) {
    return new SqlStream(meta);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.meta = meta;

}

app.meta = false;
app.table = false;
app.opened = false;

app.open = function() {

  this.push(this.createTable());

  this.opened = true;

};

app.clean = function(str) {
  return str.trim().replace(/\s/g, '_').replace(/\W/g, '').toLowerCase();
};

app.createTable = function() {

  var columns = [{
    name: 'id',
    dataType: 'int',
    primaryKey: true
  }];

  if(!this.meta) {
    return;
  }

  // add all columns
  this.meta.fields.forEach(function(name) {
    columns.push({
      name: this.clean(name),
      dataType: 'text'
    });
  }.bind(this));

  this.table_def = sql.define({
    charset: 'utf8',
    name: this.clean(this.meta.title),
    columns: columns
  });

  return this.table.create();

};

app._transform = function(line, encoding, callback) {

  var params = {};

  if(! line) {
    return callback();
  }

  if(! this.table) {
    this.end();
    return callback();
  }

  callback();

};

app._flush = function(callback) {
  callback();
};
