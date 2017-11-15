/**
 * phant-meta-test
 * https://github.com/sparkfun/phant-meta-test
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var _ = require('lodash'),
    sift = require('sift'),
    util = require('util'),
    events = require('events');

/**** Make PhantMeta an event emitter ****/
util.inherits(PhantMeta, events.EventEmitter);

/**** PhantMeta prototype ****/
var app = PhantMeta.prototype;

/**** Expose PhantMeta ****/
exports = module.exports = PhantMeta;

/**** Initialize a new PhantMeta ****/
function PhantMeta(config) {

  if (!(this instanceof PhantMeta)) {
    return new PhantMeta(config);
  }

  events.EventEmitter.call(this);

  util._extend(this, config || {});

}

function newId() {
  return Math.floor(Math.random() * 16777215).toString(16);
}

app.moduleName = 'Metadata Test';

app.streams = [
  {
    id: '111aaa',
    title: 'Test Weather',
    description: 'Test 1 description',
    fields: ['wind', 'temp'],
    tags: ['weather', 'test'],
    date: Date.now(),
    last_push: Date.now() - 200000,
    hidden: false,
    flagged: false
  },
  {
    id: '222bbb',
    title: 'Test Weight',
    description: 'Test 2 description',
    fields: ['lbs'],
    tags: ['weight', 'test'],
    date: Date.now() - 200000,
    last_push: Date.now(),
    hidden: false,
    flagged: false
  }
];

/**
 * list
 *
 * get a array of streams that match a query. calls the
 * supplied callback with err and an array of stream objects
 * as arguments. if err is truthy, assume the creation failed.
 */
app.list = function(callback, query, offset, limit, sort) {

  var results = this.streams;

  // defaults
  offset = offset || 0;
  limit = limit || 20;
  sort = sort || { property: 'date', direction: 'desc' };

  // filter by query if supplied
  if(query) {
    results = sift(query, results);
  }

  // sort by any property
  results = _.sortBy(results, sort.property).slice(offset, limit + offset);

  // reverse if desc
  if(sort.direction.toLowerCase() === 'desc') {
    results = results.reverse();
  }

  callback(null, results);

};

/** each
 *
 * get all streams one at a time that match a query. calls the
 * supplied callback with err and an array of stream objects
 * as arguments. if err is truthy, assume the creation failed.
 */
app.each = function(callback, query, offset, limit, sort) {

  var results = this.streams;

  // defaults
  offset = offset || 0;
  limit = limit || null;
  sort = sort || { property: 'date', direction: 'desc' };

  // filter by query if supplied
  if(query) {
    results = sift(query, results);
  }

  // sort by any property
  results = _.sortBy(results, sort.property);

  // limit the results if necessary
  if(limit) {
    results = results.slice(offset, limit + offset);
  } else {
    results = results.slice(offset);
  }

  // reverse if desc
  if(sort.direction.toLowerCase() === 'desc') {
    results = results.reverse();
  }

  // return one by one
  results.forEach(function(result) {
    callback(null, result);
  });

};

/**
 * get
 *
 * retrieves a stream by id. calls the supplied callback with
 * err and the stream object as arguments.
 * if err is truthy, assume the creation failed.
 */
app.get = function(id, callback) {

  var stream = _.find(this.streams, { id: id });

  if(! stream) {
    return callback('stream not found');
  }

  callback(null, stream);

};

/**
 * create
 *
 * creates a new stream with the supplied
 * data.  calls the supplied callback with
 * err and the new stream obj as arguments.
 * if err is truthy, assume the creation failed.
 */
app.create = function(data, callback) {

  var diff = _.difference(['title', 'description', 'fields'], _.keys(data));

  if(diff.length !== 0) {
    return callback('saving stream failed');
  }

  data.id = newId();
  data.date = Date.now();
  data.last_push = 0;
  data.hidden = data.hidden || false;
  data.tags = data.tags || [];
  data.flagged = false;

  this.streams.push(data);

  callback(null, data);

};

/**
 * update
 *
 * updates existing stream by id with the supplied
 * data.  calls the supplied callback with
 * err and the updated stream object as arguments.
 * if err is truthy, assume the update failed.
 */
app.update = function(id, data, callback) {

  var record = _.find(this.streams, { id: id });

  if(! record) {
    return callback('update failed: stream not found');
  }

  // remove id and date from data
  data = _.omit(data, ['id', 'date']);

  // remove old record
  this.streams = _.reject(this.streams, {id: id});

  // add updated data
  record = _.assign(record, data);

  // push updated record
  this.streams.push(record);

  callback(null, record);

};

/**
 * touch
 *
 * updates the streams last_push
 * to Date.now(). calls callback
 * with err as the only argument.  if err
 * is truthy, assume the update failed.
 */
app.touch = function(id, callback) {

  this.update(id, {last_push: Date.now()}, callback);

};

/**
 * delete
 *
 * removes stream by id. calls callback
 * with err as the only argument.  if err
 * is truthy, assume the delete failed.
 */
app.delete = function(id, callback) {

  var record = _.find(this.streams, { id: id });

  if(! record) {
    return callback('delete failed: stream not found');
  }

  this.streams = _.reject(this.streams, {id: id});

  callback(null);

};
