/**
 * phant-stream-mongodb
 * https://github.com/sparkfun/phant-stream-mongodb
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var Promise = require('bluebird'),
    events = require('events'),
    MongoClient = require('mongodb').MongoClient,
    util = require('util');

/**** Make DB an event emitter ****/
util.inherits(DB, events.EventEmitter);

/**** DB prototype ****/
var proto = DB.prototype;

/**** Expose DB ****/
exports = module.exports = DB;

/**** Constructor ****/
function DB(config) {

  if (! (this instanceof DB)) {
    return new DB(config);
  }

  events.EventEmitter.call(this);

  // apply the options
  util._extend(this, config || {});

  this.setMaxListeners(0);

  this.connect().catch(function(err) { console.log(err); });

}

proto.db = false;
proto.connecting = false;
proto.url = 'mongodb://localhost/test';

proto.connect = function() {

  return new Promise(function(resolve, reject) {

    // we are connected, resolve the promise
    if(this.db) {
      resolve(this.db);
      return;
    }

    // don't connect twice
    if(this.connecting) {

      // reject this promise if connection throws an error
      this.once('error', reject);

      // listen for connection event, and resolve promise
      this.once('connected', function(db) {
        resolve(db);
      });

      return;

    }

    // stop multiple connections
    this.connecting = true;

    MongoClient.connect(this.url, function(err, db) {

      if(err) {
        // emit err for other promises
        this.emit('err', err);
        return reject(err);
      }

      // save the connection
      this.db = db;

      // emit connected event to resolve other promises
      this.emit('connected', db);

      // we are connected
      this.connecting = false;

      resolve(db);

    }.bind(this));

  }.bind(this));

};
