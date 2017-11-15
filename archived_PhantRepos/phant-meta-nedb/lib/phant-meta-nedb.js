/**
 * phant-meta-nedb
 * https://github.com/sparkfun/phant-meta-nedb
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var  _ = require('lodash'),
    async = require('async'),
    nedb = require('nedb'),
    uuid = require('node-uuid'),
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

  if (! (this instanceof PhantMeta)) {
    return new PhantMeta(config);
  }

  events.EventEmitter.call(this);

  util._extend(this, config || {});

  this.init();

}

app.moduleName = 'Metadata NeDB';
app.directory = path.join(__dirname, '..');
app.db = false;

/**
 * init
 *
 * loads db instance using the
 * directory supplied in the config
 */
app.init = function() {

  this.db = new nedb({
    filename: path.join(this.directory, 'streams.db'),
    autoload: true
  });

};

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
 * list
 *
 * get a array of streams that match a query. calls the
 * supplied callback with err and an array of stream objects
 * as arguments. if err is truthy, assume the creation failed.
 */
app.list = function(callback, query, offset, limit, sort) {

  var search = this.db.find(query),
      nedb_sort = {};

  // defaults
  offset = offset || 0;
  limit = limit || 20;
  sort = sort || { property: 'date', direction: 'desc' };

  // set up sort object
  nedb_sort[sort.property] = (sort.direction.toLowerCase === 'asc' ? 1 : -1);

  search.sort(nedb_sort).skip(offset).limit(limit).exec(function(err, streams) {

    if(err) {
      return callback('no streams found');
    }

    callback(null, streams);

  });

};

/** each
 *
 * get all streams one at a time that match a query. calls the
 * supplied callback with err and an array of stream objects
 * as arguments. if err is truthy, assume the creation failed.
 */
app.each = function(callback, query, offset, limit, sort) {

  var db = this.db,
      nedb_sort = {};

  // defaults
  offset = offset || 0;
  limit = limit || null;
  sort = sort || { property: 'date', direction: 'desc' };

  // set up sort object
  nedb_sort[sort.property] = (sort.direction.toLowerCase === 'asc' ? 1 : -1);

  var get_more = function(next) {

    db.find(query).sort(nedb_sort).skip(offset).limit(100).exec(function(err, streams) {

      // no streams found
      if(err || ! streams.length) {
        offset = 0;
        return next();
      }

      for(var i = 0; i < streams.length; i++) {

        // stop if a limit is defined
        if(limit && offset >= limit) {
          offset = 0;
          return next();
        }

        // call the callback with the current stream
        callback(null, streams[i]);

        offset++;

      }

      // out of streams
      if(streams.length < 100) {
        offset = 0;
      }

      next();

    });

  };

  // keep going until
  async.doWhilst(
    get_more,
    function() { return offset; },
    function(err) {
      if(err) {
        callback(err);
      }
    }
  );

};

/**
 * get
 *
 * retrieves a stream by id. calls the supplied callback with
 * err and the stream object as arguments.
 * if err is truthy, assume the creation failed.
 */
app.get = function(id, callback) {

  this.db.findOne({id: id}, function(err, stream) {

    if(! stream || err) {
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

  var diff = _.difference(['title', 'description', 'fields'], _.keys(data));

  if(diff.length !== 0) {
    return callback('saving stream failed');
  }

  data.id = this.newId();
  data.date = Date.now();
  data.last_push = 0;
  data.flagged = false;

  this.db.insert(data, function(err, stream) {

    if(err) {
      return callback('creation failed');
    }

    callback(null, stream);

  });

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

  // remove id and date from data
  data = _.omit(data, ['id', 'date']);

  this.db.update({id: id}, {$set: data}, {}, function(err) {

    if(err) {
      return callback('update failed');
    }

    this.get(id, function(err, stream) {

      if(err) {
        return callback('could not find stream');
      }

      callback(null, stream);

    });

  }.bind(this));

};

/**
 * touch
 *
 * updates the streams last_push
 * to Date.now(). calls callback
 * with err as the only argument. if err
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

  this.db.remove({id: id}, {}, function(err) {

    if(err) {
      return callback('delete failed');
    }

    callback(null);

  });

};
