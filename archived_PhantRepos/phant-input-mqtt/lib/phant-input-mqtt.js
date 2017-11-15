/**
 * phant-input-mqtt
 * https://github.com/sparkfun/phant-input-mqtt
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var server = require('phant-server-mqtt'),
  util = require('util'),
  events = require('events');

/**** Make PhantInput an event emitter ****/
util.inherits(PhantInput, events.EventEmitter);

/**** PhantInput prototype ****/
var proto = PhantInput.prototype;

/**** Expose PhantInput ****/
exports = module.exports = PhantInput;

/**** Constructor ****/
function PhantInput(config) {

  if (!(this instanceof PhantInput)) {
    return new PhantInput(config);
  }

  events.EventEmitter.call(this);

  util._extend(this, config || {});

  this.server = server.create(config);

  this.server.on('published', this.incoming.bind(this));

  this.server.on('ready', function() {
    this.server.authenticate = this.authenticate.bind(this);
    this.server.authorizePublish = this.authorizePublish.bind(this);
    this.server.authorizeSubscribe = this.authorizeSubscribe.bind(this);
  }.bind(this));

}

/**** Defaults ****/
proto.moduleName = 'MQTT Input';
proto.port = 1883;
proto.keychain = false;
proto.validator = false;
proto.server = false;

/**** Default throttler ****/
proto.throttler = {
  available: function(key, cb) {
    var now = Math.round((new Date()).getTime() / 1000);

    cb(true, 0, 100, now);
  }
};

proto.authenticate = function(client, username, password, callback) {

  var authorized = false;

  if(username && password) {
    authorized = this.keychain.validate(username, password);
  }

  if(authorized) {
    client.user = username;
  }

  callback(null, authorized);

};

proto.authorizePublish = function(client, topic, payload, callback) {
  callback(null, client.user === topic.split('/')[1]);
};

proto.authorizeSubscribe = function(client, topic, callback) {
  callback(null, true);
};

proto.incoming = function(packet) {

  if (!/^[input|clear]/.test(packet.topic)) {
    return;
  }

  var topic = packet.topic.split('/'),
    action = topic[0],
    pub = topic[1],
    input = this,
    id, data;

  try {
    data = JSON.parse(packet.payload);
  } catch (e) {
    return this.emit('error', e);
  }

  // check for public key
  if (!pub) {
    return;
  }

  // get the id
  id = this.keychain.getIdFromPublicKey(pub);

  if (action === 'clear') {
    this.emit('clear', id);
    return this.respond(action, pub, {
      success: true,
      message: 'Stream cleared'
    });
  }

  // make sure they sent data
  if (!data) {
    return this.respond(action, pub, {
      success: false,
      message: 'No data sent'
    });
  }

  // add timestamp
  data.timestamp = new Date().toISOString();

  this.throttler.available(pub, function(ready, used, limit, reset) {

    if (!ready) {
      return input.respond(action, pub, {
        success: false,
        message: 'Rate limit exceeded',
        rate_used: used,
        rate_limit: limit,
        rate_reset: reset
      });
    }

    input.validator.fields(id, data, function(err, valid) {

      if (!valid) {
        return input.respond(action, pub, {
          success: false,
          message: err,
          rate_used: used,
          rate_limit: limit,
          rate_reset: reset
        });
      }

      input.emit('data', id, data);

      input.respond(action, pub, {
        success: true,
        message: 'Success',
        rate_used: used,
        rate_limit: limit,
        rate_reset: reset
      });

    });

  });

};

proto.respond = function(action, pub, payload) {

  var message = {
    topic: 'response/' + pub + '/' + action,
    payload: JSON.stringify(payload),
    qos: 0,
    retain: false
  };

  this.server.publish(message);

};
