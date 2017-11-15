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

/**** Make Readable a transform stream ****/
util.inherits(Readable, stream.Transform);

/**** Readable prototype ****/
var proto = Readable.prototype;

/**** Expose Readable ****/
exports = module.exports = Readable;

/**** Constructor ****/
function Readable(config) {

  if (! (this instanceof Readable)) {
    return new Readable(config);
  }

  stream.Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  // apply the options
  util._extend(this, config || {});

  this.init();

}

proto.id = false;
proto.page = false;
proto.mongo = false;
proto.pageSize = 250;

proto.init = function() {

  this.mongo.connect()
      .then(this.loadCollection.bind(this))
      .then(this.attachStream.bind(this))
      .catch(this.handleError.bind(this));

};

proto._transform = function(obj, encoding, callback) {
  this.push(obj);
  callback();
};

proto.loadCollection = function(db) {

  return new Promise(function(resolve, reject) {

    db.collection(this.id, {strict:true}, function(err, col) {

      if(err) {
        return reject(err);
      }

      resolve(col);

    });

  }.bind(this));

};

proto.attachStream = function(col) {

  var query,
      all = false;

  if(! this.page || this.page < 0) {
    all = true;
    this.page = 1;
  }

  // reverse sort
  query = col.find({}, {_id:0}).sort({'$natural': -1});

  if(! all) {
    query.skip((this.page - 1) * this.pageSize).limit(this.pageSize);
  }

  query.stream().pipe(this);

  process.nextTick(function() {
    this.emit('open');
  }.bind(this));

};

proto.handleError = function(err) {

  this.emit('error', err);
  this.end();

};
