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
    telnet = require('wez-telnet'),
    url = require('url');

/**** Make PhantManager an event emitter ****/
util.inherits(PhantManager, events.EventEmitter);

/**** PhantManager prototype ****/
var app = PhantManager.prototype;

/**** Expose PhantManager ****/
exports = module.exports = PhantManager;

/**** Initialize a new PhantManager ****/
function PhantManager(config) {

  if (! (this instanceof PhantManager)) {
    return new PhantManager(config);
  }

  config = config || {};

  events.EventEmitter.call(this, config);
  util._extend(this, config);

  telnet.Server(this.init.bind(this)).listen(this.port);

}

app.port = 8001;

app.init = function(client) {

  this.client = client;

  client.write('\nWelcome to phant!\n');
  client.write('Type \'help\' for a list of available commands\n\n');
  this.prompt();

  client.on('data', this.parse.bind(this));

};

app.prompt = function() {
  this.client.write('phant> ');
};

app.parse = function(buf) {
  console.log(buf.toString('ascii'));
};

