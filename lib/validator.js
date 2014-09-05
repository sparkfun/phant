/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var util = require('util');

/**** PhantValidator prototype ****/
var app = PhantValidator.prototype;

/**** Expose PhantValidator ****/
exports = module.exports = PhantValidator;

/**** Initialize a new PhantValidator ****/
function PhantValidator(config) {

  if (!(this instanceof PhantValidator)) {
    return new PhantValidator(config);
  }

  config = config || {};

  util._extend(this, config);

}

/**** Defaults ****/
app.metadata = false;

app.metadataProperties = function(id, stream, callback) {

  var err;

  if (!stream.title.length) {
    return callback('title missing');
  }

  if (!stream.description.length) {
    return callback('description missing');
  }

  if (!stream.fields instanceof Array || !stream.fields.length) {
    return callback('fields missing');
  }

  if (stream.fields.length > 30) {
    return callback('too many fields sent. 30 fields max');
  }

  if (err = not_unique(stream.fields)) {
    return callback('duplicate field sent: ' + err);
  }

  if (err = invalid_names(stream.fields)) {
    return callback('invalid field name: "' + err + '". valid characters include letters, numbers and underscores.');
  }

  if (!stream.tags instanceof Array) {
    return callback('invalid tags sent');
  }

  if (stream.tags.length > 15) {
    return callback('too many tags sent. 15 tags max');
  }

  if (err = not_unique(stream.tags)) {
    return callback('duplicate tag sent: ' + err);
  }

  if (err = invalid_names(stream.tags)) {
    return callback('invalid tag name: "' + err + '". valid characters include letters, numbers and underscores.');
  }

  if (!stream.alias) {
    return callback();
  }

  this.aliasExists(stream.alias, id, function(err, exists) {

    if (err) {
      return callback('alias lookup failed.');
    }

    if (exists) {
      return callback('alias: ' + stream.alias + ' is already in use by another stream.');
    }

    callback();

  });

};

app.create = function(stream, callback) {
  this.metadataProperties(null, stream, callback);
};

app.update = function(id, stream, callback) {
  this.metadataProperties(id, stream, callback);
};

app.aliasExists = function(alias, id, callback) {

  var reserved = ['streams', 'data', 'input', 'output', 'about', 'map', 'clear', 'account'];

  if (!alias) {
    return callback('no alias supplied', false);
  }

  if(reserved.indexOf(alias) !== -1) {
    return callback(null, true);
  }

  this.metadata.list(function(err, streams) {

    if (err) {
      return callback(err, true);
    }

    var exists = streams.some(function(stream) {

      if (id && id == stream.id) { // jshint ignore:line
        return false;
      }

      return true;

    });

    callback(null, exists);

  }, {
    alias: alias
  });

};

app.exists = function(id, callback) {

  this.metadata.get(id, function(err, stream) {

    if (err) {
      return callback('stream not found', false);
    }

    callback('', stream);

  });

};

app.fields = function(id, data, callback) {

  this.metadata.get(id, function(err, stream) {

    if (err) {
      return callback('stream not found', false);
    }

    var expecting = stream.fields.slice(0);

    stream.fields.push('timestamp');

    // make sure all keys are valid
    for (var key in data) {

      if (!data.hasOwnProperty(key)) {
        continue;
      }

      if (data[key] instanceof Array) {
        return callback('two values were sent for the same field: ' + key, false);
      }

      if (stream.fields.indexOf(key) === -1) {

        err = key + " is not a valid field for this stream. \n\n";
        err += 'expecting: ' + expecting.join(', ');

        return callback(err, false);

      }

    }

    // make sure all fields exist in data
    for (var i = 0; i < stream.fields.length; i++) {

      if (!data.hasOwnProperty(stream.fields[i])) {

        err = stream.fields[i] + " missing from sent data. \n\n";
        err += 'expecting: ' + expecting.join(', ');

        return callback(err, false);

      }

    }

    callback('', true);

  });

};

function not_unique(a) {

  var sorted = a.sort();

  for (var i = 1; i < sorted.length; i++) {

    if (sorted[i - 1] === sorted[i]) {
      return sorted[i];
    }

  }

  return false;

}

function invalid_names(a) {

  for (var i = 0; i < a.length; i++) {

    if (/^[a-zA-Z0-9_]+$/.test(a[i]) === false) {
      return a[i];
    }

  }

  return false;

}
