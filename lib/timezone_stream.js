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
  moment = require('moment-timezone'),
  util = require('util');

/**** Make TimezoneStream a transform stream ****/
util.inherits(TimezoneStream, stream.Transform);

/**** TimezoneStream prototype ****/
var app = TimezoneStream.prototype;

/**** Expose TimezoneStream ****/
exports = module.exports = TimezoneStream;

/**** Initialize a new TimezoneStream ****/
function TimezoneStream(timezone) {

  if (!(this instanceof TimezoneStream)) {
    return new TimezoneStream(timezone);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  if (moment.tz.zone(timezone)) {
    this.timezone = timezone;
  }

}

app.timezone = false;

app._transform = function(obj, encoding, callback) {

  if (!obj.hasOwnProperty('timestamp') || !this.timezone) {
    this.push(obj);
    return callback();
  }

  obj.timestamp = moment.tz(obj.timestamp, this.timezone).format();
  this.push(obj);

  callback();

};
