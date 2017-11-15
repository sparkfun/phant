/**
 * phant-output-udp
 * https://github.com/sparkfun/phant-output-udp
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var dgram = require('dgram'),
  util = require('util'),
  events = require('events');

/**** Make PhantOutput an event emitter ****/
util.inherits(PhantOutput, events.EventEmitter);

/**** PhantOutput prototype ****/
var app = PhantOutput.prototype;

/**** Expose PhantOutput ****/
exports = module.exports = PhantOutput;

/**** Initialize a new PhantOutput ****/
function PhantOutput(config) {

  if (!(this instanceof PhantOutput)) {
    return new PhantOutput(config);
  }

  events.EventEmitter.call(this, config);
  util._extend(this, config || {});

  this.socket = dgram.createSocket('udp4');
  this.socket.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

}

/**** Defaults ****/
app.moduleName = 'UDP Output';
app.host = 'localhost';
app.port = 8002;
app.keychain = false;

app.write = function(id, data) {

  var payload = {
    event: 'data',
    id: this.keychain.publicKey(id),
    data: data
  };

  this.send(JSON.stringify(payload) + '\n');

};

app.clear = function(id) {

  var payload = {
    event: 'clear',
    id: this.keychain.publicKey(id)
  };

  this.send(JSON.stringify(payload) + '\n');

};

app.send = function(payload) {

  var buffer = new Buffer(payload);

  this.socket.send(buffer, 0, buffer.length, this.port, this.host, function(err, bytes) {

    if (err) {
      this.emit('error', err);
    }

    buffer = null;

  }.bind(this));

};
