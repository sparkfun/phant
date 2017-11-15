/**
 * phant-output-thermalprinter
 * https://github.com/sparkfun/phant-output-thermalprinter
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var SerialPort = require('serialport').SerialPort,
    async = require('async'),
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

  events.EventEmitter.call(this);

  util._extend(this, config || {});

  this.init();

}

app.moduleName = 'Thermal Printer Output';
app.serial = false;
app.keychain = false;
app.baud = 19200;
app.path = '/dev/ttyO0'; // beaglebone black UART0
app.lastId = null;

app.init = function() {

  var self = this;

  this.serial = new SerialPort(this.path, {
    baudrate: this.baud
  });

  this.serial.once('open', function() {

    // reset
    self.send(Buffer([27, 64]), function() {

      // phant
      self.send(
        "            .-.._\n      __  \/`" +
        "     '.\n   .-'  `\/   (   a \\" +
        "\n  \/      (    \\,_   \\\n \/|" +
        "       '---` |\\ =|\n` \\    \/_" +
        "_.-\/  \/  | |\n   |  \/ \/ \\ \\" +
        "  \\   \\_\\  jgs\n   |__|_|  |_|" +
        "__\\\n  welcome to phant.\n\n"

      );

    });

  });

};

app.sendBytes = function(queue, callback) {

  var send = this.send.bind(this);

  if(! callback) {
    callback = function() {};
  }

  async.eachSeries(
    queue,
    function(b, next) {
      send(Buffer(b), next);
    },
    callback
  );

};

app.send = function(buffer, callback) {

  var serial = this.serial;

  if(! callback) {
    callback = function() {};
  }

  setTimeout(function() {
    serial.write(buffer, function() {
      serial.drain(callback);
    });
  }, 5);

};

app.write = function(id, data) {

  var queue = [];

  if (!this.serial) {
    return this.emit('error', 'printer init failed');
  }

  if(id !== this.lastId) {
    // title
    queue.push([10]); // line feed
    queue.push([27, 45, 1]); // underline
    queue.push(this.keychain.publicKey(id));
    queue.push([27, 45, 0, 10]); // normal
  } else {
    queue.push([10]); // line feed
  }

  // save last id
  this.lastId = id;

  // fields
  Object.keys(data).forEach(function(key) {
    queue.push([27, 69, 1]); // bold on
    queue.push(key + ': ');
    queue.push([27, 69, 0]); // bold off
    queue.push(data[key]);
    queue.push([10]); // line feed
  });

  this.sendBytes(queue, function(err) {
    if(err) {
      this.emit('error', err);
    }
  });

};

app.clear = function(id) {
  // noop
};

