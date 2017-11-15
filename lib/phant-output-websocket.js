/**
 * phant-output-websocket
 * https://github.com/sparkfun/phant-output-websocket
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var socket = require('socket.io'),
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

  if (this.server) {

    this.io = socket(this.server);

    if (this.adapter) {
      this.io.adapter(this.adapter);
    }

    this.io.sockets.on('connection', function(socket) {
      socket.on('room', function(room) {
        socket.join(room);
      });
    });

  }

}

/**** Defaults ****/
app.moduleName = 'Websocket Output';
app.io = false;
app.server = false;
app.adapter = false;
app.keychain = false;

app.write = function(id, data) {

  if (!this.io) {
    return this.emit('error', 'socket.io init failed');
  }

  this.io.sockets.in(this.keychain.publicKey(id)).emit('data', data);

};

app.clear = function(id) {

  if (!this.io) {
    return this.emit('error', 'socket.io init failed');
  }

  this.io.sockets.in(this.keychain.publicKey(id)).emit('clear');

};
