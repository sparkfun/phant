/**
 * phant-output-mqtt
 * https://github.com/sparkfun/phant-output-mqtt
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var server = require('phant-server-mqtt'),
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

  this.server = server.create(config);

}

/**** Defaults ****/
app.moduleName = 'MQTT Output';
app.port = 1883;
app.keychain = false;
app.server = false;

app.write = function(id, data) {

  var pub = this.keychain.publicKey(id);

  // send all data to output
  this.send('output', JSON.stringify({
    publicKey: pub,
    payload: data
  }));

  // send payload to specific namespace
  this.send('output/' + pub, JSON.stringify(data));

  // send each field separately to the namespace
  for (var key in data) {

    if (data.hasOwnProperty(key)) {
      this.send('output/' + pub + '/' + key, data[key]);
    }

  }

};

app.clear = function(id) {

  var pub = this.keychain.publicKey(id);

  this.send('cleared', pub);
  this.send('cleared/' + pub, pub);

};

app.send = function(topic, payload) {

  var message = {
    topic: topic,
    payload: payload,
    qos: 0,
    retain: false
  };

  this.server.publish(message);

};
