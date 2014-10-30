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
  datejs = require('datejs'),
  util = require('util');

/**** Make FilterStream a transform stream ****/
util.inherits(FilterStream, stream.Transform);

/**** FilterStream prototype ****/
var app = FilterStream.prototype;

/**** Expose FilterStream ****/
exports = module.exports = FilterStream;

/**** Initialize a new FilterStream ****/
function FilterStream(field, operator, operand) {

  if (!(this instanceof FilterStream)) {
    return new FilterStream(field, operator, operand);
  }

  stream.Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  this.field = field.trim();
  this.operator = operator.trim();
  this.operand = operand.trim();

}

FilterStream.operators = [
  'grep',
  'eq',
  'ne',
  'lt',
  'gt',
  'gte',
  'lte'
];

app.field = false;
app.operator = false;
app.operand = false;

app._transform = function(obj, encoding, callback) {

  if (!obj.hasOwnProperty(this.field)) {
    this.emit('error', 'invalid field: ' + this.field);
    this.end();
    return callback();
  }

  if (FilterStream.operators.indexOf(this.operator) === -1) {
    this.emit('error', 'invalid operator: ' + this.operator);
    this.end();
    return callback();
  }

  // if everything checks out, call the comparison function
  this[this.operator].apply(this, arguments);

};

app.grep = function(obj, encoding, callback) {

  var reg = new RegExp(this.operand);

  if (reg.test(obj[this.field])) {
    this.push(obj);
  }

  callback();

};

app.eq = function(obj, encoding, callback) {

  var field = toNumber(obj[this.field]),
    operand = toNumber(this.operand);

  if (field === false || operand === false) {
    field = obj[this.field];
    operand = this.operand;
  }

  if (field == operand) { //jshint ignore:line
    this.push(obj);
  }

  callback();

};

app.ne = function(obj, encoding, callback) {

  var field = toNumber(obj[this.field]),
    operand = toNumber(this.operand);

  if (field === false || operand === false) {
    field = obj[this.field];
    operand = this.operand;
  }

  if (field != operand) { //jshint ignore:line
    this.push(obj);
  }

  callback();

};

app.numeric = function(operator, obj, encoding, callback) {

  var field = toNumber(obj[this.field]),
    operand = toNumber(this.operand);

  if (this.field === 'timestamp') {
    field = toDate(obj[this.field]);
    this.operand = toDate(this.operand);
    operand = this.operand;
  }

  if (field === false || operand === false) {
    return callback();
  }

  switch (operator) {

    case 'gt':
      if (field > operand) {
        this.push(obj);
      }
      break;
    case 'gte':
      if (field >= operand) {
        this.push(obj);
      }
      break;
    case 'lt':
      if (field < operand) {
        this.push(obj);
      }
      break;
    case 'lte':
      if (field <= operand) {
        this.push(obj);
      }
      break;

  }

  callback();

};

app.gt = function() {
  [].unshift.call(arguments, 'gt');
  this.numeric.apply(this, arguments);
};

app.gte = function() {
  [].unshift.call(arguments, 'gte');
  this.numeric.apply(this, arguments);
};

app.lt = function() {
  [].unshift.call(arguments, 'lt');
  this.numeric.apply(this, arguments);
};

app.lte = function() {
  [].unshift.call(arguments, 'lte');
  this.numeric.apply(this, arguments);
};

function toNumber(val) {

  // check if the value is numeric
  if (((val - parseFloat(val) + 1) >= 0) === false) {
    return false;
  }

  return parseFloat(val);

}

function toDate(d) {

  if (Object.prototype.toString.call(d) === '[object Date]') {
    return d;
  }

  return Date.parse(d) || false;

}
