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

/**** Make ConditionStream a transform stream ****/
util.inherits(ConditionStream, stream.Transform);

/**** ConditionStream prototype ****/
var app = ConditionStream.prototype;

/**** Expose ConditionStream ****/
exports = module.exports = ConditionStream;

/**** Initialize a new ConditionStream ****/
function ConditionStream(field, operator, operand) {

  if (!(this instanceof ConditionStream)) {
    return new ConditionStream(field, operator, operand);
  }

  stream.Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  this.field = field;
  this.operator = operator;
  this.operand = operand;

}

app.field = false;
app.operator = false;
app.operand = false;
app.operators = [
  'eq',
  'ne',
  'lt',
  'gt',
  'gte',
  'lte'
];

app._transform = function(obj, encoding, callback) {

  callback();

};
