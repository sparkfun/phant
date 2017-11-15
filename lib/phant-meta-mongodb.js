/**
 * phant-meta-mongodb
 * https://github.com/sparkfun/phant-meta-mongodb
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

var _ = require('lodash'),
    mongoose = require('mongoose'),
    async = require('async'),
    Meta = require('./meta'),
    events = require('events'),
    util = require('util');

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

  this.connect();

}

app.moduleName = 'Metadata MongoDB';
app.mongoose = false;
app.url = 'mongodb://localhost/test';

/**
 * connect
 *
 * connects to mongo using the mongo url
 */
app.connect = function() {

  // return if already connected
  if(this.mongoose && this.mongoose.connection.readyState) {
    return;
  }

  // connect to mongo
  mongoose.connect(this.url, {server: {auto_reconnect: true}});

  // log errors
  mongoose.connection.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  // log connection status
  mongoose.connection.once('open', function() {
    this.emit('info', 'Connected to MongoDB');
  }.bind(this));

  this.mongoose = mongoose;

};

/**
 * list
 *
 * get a array of streams that match a query. calls the
 * supplied callback with err and an array of stream objects
 * as arguments. if err is truthy, assume the creation failed.
 */
app.list = function(callback, query, offset, limit, sort) {

  var search = Meta.find(query),
      mongo_sort = {};

  // defaults
  offset = offset || 0;
  limit = limit || 20;
  sort = sort || { property: 'date', direction: 'desc' };

  // set up sort object
  mongo_sort[sort.property] = (sort.direction.toLowerCase === 'asc' ? 1 : -1);

  search.sort(mongo_sort).skip(offset).limit(limit).exec(callback);

};

/** each
 *
 * get all streams one at a time that match a query. calls the
 * supplied callback with err and an array of stream objects
 * as arguments. if err is truthy, assume the creation failed.
 */
app.each = function(callback, query, offset, limit, sort) {

  var mongo_sort = {};

  // defaults
  offset = offset || 0;
  limit = limit || null;
  sort = sort || { property: 'date', direction: 'desc' };

  // set up sort object
  mongo_sort[sort.property] = (sort.direction.toLowerCase === 'asc' ? 1 : -1);

  var get_more = function(next) {

    Meta.find(query).sort(mongo_sort).skip(offset).limit(100).exec(function(err, streams) {

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

  Meta.findById(id, function(err, stream) {

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

  var stream = new Meta(data),
      diff = _.difference(['title', 'description', 'fields'], _.keys(data));

  if(diff.length !== 0) {
    return callback('saving stream failed');
  }

  stream.save(function(err) {

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

  Meta.findByIdAndUpdate(id, { $set: data }, function(err, stream) {

    if(err) {
      return callback('update failed');
    }

    callback(null, stream);

  });

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

  Meta.findById(id, function(err, stream) {

    if(! stream || err) {
      return callback('stream not found');
    }

    stream.remove(function(err) {

      if(err) {
        return callback('delete failed');
      }

      callback(null);

    });

  });

};
