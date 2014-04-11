/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var events = require('events'),
    util = require('util'),
    telnet = require('telnet'),
    url = require('url');

/**** Make PhantManager an event emitter ****/
util.inherits(PhantManager, events.EventEmitter);

/**** PhantManager prototype ****/
var app = PhantManager.prototype;

/**** Expose PhantManager ****/
exports = module.exports = PhantManager;

/**** Initialize a new PhantManager ****/
function PhantManager(config) {

  config = config || {};

  var manager = function(client) {
    this.init(client);
  };

  util.inherits(manager, this);
  events.EventEmitter.call(manager, config);
  util._extend(manager, config);

  telnet.createServer(manager).listen(manager.port);

  return manager;

}

app.port = 8001;

app.init = function(client) {

  this.client = client;

  this.client.do.transmit_binary();
  this.client.do.window_size();

};
