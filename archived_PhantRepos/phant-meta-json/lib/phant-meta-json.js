/**
 * phant-meta-json
 * https://github.com/sparkfun/phant-meta-json
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var _ = require('lodash'),
    sift = require('sift'),
    uuid = require('node-uuid'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    path = require('path'),
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

  fs.exists(this.directory, function(exists) {

    if(exists) {
      return;
    }

    mkdirp(this.directory);

  }.bind(this));

}

app.moduleName = 'Metadata JSON';
app.directory = path.join(__dirname, '..');

/**
 * newId
 *
 * helper method to generate a unique
 * ID for a newly created stream.
 */
app.newId = function() {
  return uuid.v1().replace(/-/g, '');
};

/**
 * saveStreams
 *
 * helper method to get stream metadata
 * from a JSON file
 */
app.getStreams = function(callback) {

  var file = path.join(this.directory, 'streams.json');

  fs.readFile(file, function(err, data) {

    if(err) {
      return callback([]);
    }

    try {
      data = JSON.parse(data);
    } catch(err) {
      return callback([]);
    }

    return callback(data);

  });

};

/**
 * saveStreams
 *
 * helper method to save stream metadata
 * to a JSON file
 */
app.saveStreams = function(streams, callback) {

  var file = path.join(this.directory, 'streams.json');

  try {
    streams = JSON.stringify(streams);
  } catch(err) {
    return callback('stream data corruption');
  }

  fs.writeFile(file, streams, callback);

};

/**
 * list
 *
 * get a array of streams that match a query. calls the
 * supplied callback with err and an array of stream objects
 * as arguments. if err is truthy, assume the creation failed.
 */
app.list = function(callback, query, offset, limit, sort) {

  // defaults
  offset = offset || 0;
  limit = limit || 20;
  sort = sort || { property: 'date', direction: 'desc' };

  this.getStreams(function(streams) {

    var results = streams;

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

  });

};

/** each
 *
 * get all streams one at a time that match a query. calls the
 * supplied callback with err and an array of stream objects
 * as arguments. if err is truthy, assume the creation failed.
 */
app.each = function(callback, query, offset, limit, sort) {

  // defaults
  offset = offset || 0;
  limit = limit || null;
  sort = sort || { property: 'date', direction: 'desc' };

  this.getStreams(function(streams) {

    var results = streams;

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

  this.getStreams(function(streams) {

    var stream = _.find(streams, { id: id });

    if(! stream) {
      return callback('stream not found');
    }

    callback(null, stream);

  });

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

  this.getStreams(function(streams) {

    var diff = _.difference(['title', 'description', 'fields'], _.keys(data));

    if(diff.length !== 0) {
      return callback('saving stream failed');
    }

    data.id = this.newId();
    data.date = Date.now();
    data.last_push = 0;
    data.flagged = false;

    streams.push(data);

    this.saveStreams(streams, function(err) {

      if(err) {
        return callback(err);
      }

      callback(null, data);

    });

  }.bind(this));

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

  this.getStreams(function(streams) {

    var record = _.find(streams, {id: id});

    if(! record) {
      return callback('update failed: stream not found');
    }

    // remove id and date from data
    data = _.omit(data, ['id', 'date']);

    // remove old record
    streams = _.reject(streams, {id: id});

    // add updated data
    record = _.assign(record, data);

    // push updated record
    streams.push(record);

    this.saveStreams(streams, function(err) {

      if(err) {
        return callback(err);
      }

      callback(null, record);

    });

  }.bind(this));

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

  this.getStreams(function(streams) {

    streams = _.reject(streams, { id: id });

    this.saveStreams(streams, callback);

  }.bind(this));

};

