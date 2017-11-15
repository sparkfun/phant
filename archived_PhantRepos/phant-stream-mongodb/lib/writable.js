/**
 * phant-stream-mongodb
 * https://github.com/sparkfun/phant-stream-mongodb
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var stream = require('stream'),
    util = require('util'),
    Promise = require('bluebird');

/**** Make Writable a writable stream ****/
util.inherits(Writable, stream.Writable);

/**** Writable prototype ****/
var proto = Writable.prototype;

/**** Expose Writable ****/
exports = module.exports = Writable;

/**** Initialize a new Writable ****/
function Writable(config) {

  if (! (this instanceof Writable)) {
    return new Writable(config);
  }

  stream.Writable.call(this, {
    objectMode: true
  });

  // apply the options
  util._extend(this, config || {});

  this.setMaxListeners(0);

  this.init();

}

proto.id = false;
proto.mongo = false;
proto.collection = false;
proto.loading = false;
proto.cap = false;

proto.init = function() {

  this.mongo.connect()
    .then(this.loadCollection.bind(this))
    .catch(this.handleError.bind(this));

};

proto.loadCollection = function(db) {

  var self = this;

  return new Promise(function(resolve, reject) {

    if(self.collection) {
      return resolve(self.collection);
    }

    db.collection(self.id, {strict:true}, function(err, col) {

      if(err) {

        if(self.loading) {

          // reject this promise if loading throws an error
          self.once('error', reject);

          // listen for loaded event, and resolve promise
          self.once('loaded', function(col) {
            resolve(col);
          });

          return;

        }

        var options = {
          capped: false,
          strict: true
        };

        if(self.cap) {
          options.capped = true;
          options.size = self.cap;
        }

        self.loading = true;

        // create collection if it doesn't exist
        return db.createCollection(self.id, options, function(err, col) {

          if(err) {
            self.emit('error', err);
            return reject(err);
          }

          self.collection = col;
          self.loading = false;
          self.emit('loaded', col);
          resolve(col);

        });

      }

      // we have a collection, resolve promise
      self.collection = col;
      resolve(col);

    });

  });

};

proto._write = function(data, encoding, cb) {

  this.mongo.connect()
    .then(this.loadCollection.bind(this))
    .then(function(col) {
      // log data
      col.insertOne(data, function(err) {

        if (err) {
          return cb(err);
        }

        cb();

      });

    }).catch(this.handleError.bind(this));

};

proto.handleError = function(err) {

  this.emit('error', err);
  this.end();

};
