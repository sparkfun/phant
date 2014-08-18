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
function SqlStream(meta, type) {

  if (!(this instanceof SqlStream)) {
    return new SqlStream(meta, type);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.meta = meta;
  this.type = type || 'mysql';

}

app.meta = false;
app.table = false;
app.opened = false;
app.type = 'mysql';

app.open = function() {

  this.push(this.createTable());

  this.opened = true;

};

app.clean = function(str) {
  return str.trim().replace(/\s/g, '_').replace(/\W/g, '').toLowerCase();
};

app.escape = function(val) {
  return val.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function(c) {
    switch (c) {
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
        return "\\" + c;
    }
  });
};

app.createTable = function() {

  var columns = [{
    name: 'id',
    dataType: 'int',
    primaryKey: true
  }, {
    name: 'timestamp',
    dataType: 'datetime'
  }];

  if (!this.meta) {
    return;
  }

  // add all columns
  this.meta.fields.forEach(function(name) {
    columns.push({
      name: this.clean(name),
      dataType: 'text'
    });
  }.bind(this));

  this.table = sql.define({
    charset: 'utf8',
    name: this.clean(this.meta.title),
    columns: columns
  });

  return this.table.create().toString(this.type === 'psql' ? 'postgres' : 'mysql') + ';\n';

};

app._transform = function(line, encoding, callback) {

  var params = {};

  if (!this.opened) {
    this.open();
  }

  if (!line) {
    return callback();
  }

  if (!this.table) {
    this.end();
    return callback();
  }

  for (var key in line) {

    if (!line.hasOwnProperty(key)) {
      continue;
    }

    if (key === 'timestamp') {
      params['timestamp'] = (new Date(line[key])).toISOString().slice(0, 19).replace('T', ' ');
      continue;
    }

    params[this.clean(key)] = line[key];

  }

  this.push(this.table.insert(params).toString() + ';\n');

  callback();

};

app._flush = function(callback) {
  callback();
};
