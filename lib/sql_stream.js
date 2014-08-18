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
app.opened = false;
app.type = 'mysql';
app.columns = false;

app.open = function() {

  this.push(this.type !== 'mysql' ? this.createPostgresTable() : this.createMysqlTable());

  this.opened = true;

};

app.clean = function(str) {
  return str.trim().replace(/\s/g, '_').replace(/\W/g, '').toLowerCase();
};

app.escape = function(val) {

  var self = this;

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
      case "'":
        if (self.type === 'mysql') {
          return "\\'";
        }
        return "''";
      case "\"":
      case "\\":
      case "%":
        return "\\" + c;
    }
  });
};

app.createPostgresTable = function() {

  if (!this.meta) {
    return;
  }

  var table = 'CREATE TABLE IF NOT EXISTS ';

  table += this.clean(this.meta.title);

  table += ' (id SERIAL, timestamp timestamp';

  // add all columns
  this.meta.fields.forEach(function(name) {
    table += ', ' + this.clean(name) + ' text';
  }.bind(this));

  table += ');\n';

  return table;

};

app.createMysqlTable = function() {

  if (!this.meta) {
    return;
  }

  var table = 'CREATE TABLE IF NOT EXISTS ';

  table += this.clean(this.meta.title);

  table += ' (id int NOT NULL AUTO_INCREMENT, timestamp datetime ';

  // add all columns
  this.meta.fields.forEach(function(name) {
    table += ', ' + this.clean(name) + ' text ';
  }.bind(this));

  table += ', PRIMARY KEY(id));\n';

  return table;

};

app._transform = function(line, encoding, callback) {

  var params = {},
    insert = '';

  if (!this.opened) {
    this.open();
  }

  if (!line) {
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

    params[this.clean(key)] = this.escape(line[key]);

  }

  if (!this.columns) {
    this.columns = Object.keys(params).sort();
    insert += 'INSERT INTO test (' + this.columns.join(', ') + ') VALUES ';
  } else {
    insert += ', ';
  }

  insert += '(';

  this.columns.forEach(function(c, i) {
    if (i > 0) {
      insert += ', ';
    }
    insert += "'" + params[c] + "'";
  });

  insert += ')';

  this.push(insert);

  callback();

};

app._flush = function(callback) {
  this.push(';\n');
  callback();
};
