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
