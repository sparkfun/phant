/**
 * phant-input-udp
 * https://github.com/sparkfun/phant-input-udp
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var dgram = require('dgram'),
  util = require('util'),
  events = require('events');

/**** Make PhantInput an event emitter ****/
util.inherits(PhantInput, events.EventEmitter);

/**** PhantInput prototype ****/
var app = PhantInput.prototype;

/**** Expose PhantInput ****/
exports = module.exports = PhantInput;

/**** Initialize a new PhantInput ****/
function PhantInput(config) {

  if (!(this instanceof PhantInput)) {
    return new PhantInput(config);
  }

  events.EventEmitter.call(this, config);
  util._extend(this, config || {});

  this.socket = dgram.createSocket('udp4');
  this.socket.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.socket.on('message', this.incoming.bind(this));

  this.socket.bind(this.port);

}

/**** Defaults ****/
app.moduleName = 'UDP Input';
app.port = 8001;
app.keychain = false;
app.validator = false;

/**** Default throttler ****/
app.throttler = {
  available: function(key, cb) {
    cb(true);
  }
};

app.incoming = function(message) {

  try {
    message = JSON.parse(message);
  } catch (e) {
    return this.emit('error', e);
  }

  var pub = message.publicKey,
    prv = message.privateKey,
    input = this,
    id = false;

  // check for public key
  if (!pub) {
    return;
  }

  // check for private key
  if (!prv) {
    return;
  }

  // validate keys
  if (!this.keychain.validate(pub, prv)) {
    return;
  }

  // get the id
  id = this.keychain.getIdFromPrivateKey(prv);

  if (message.action === 'clear') {
    return this.emit('clear', id);
  }

  // make sure they sent some data
  if (!message.data) {
    return;
  }

  // add timestamp
  message.data.timestamp = new Date().toISOString();

  this.throttler.available(pub, function(ready) {

    if (!ready) {
      return;
    }

    input.validator.fields(id, message.data, function(err, valid) {

      if (!valid) {
        return;
      }

      input.emit('data', id, message.data);

    });

  });

};
