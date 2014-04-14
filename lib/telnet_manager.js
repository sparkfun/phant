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

  this.welcome();
  this.prompt();

  client.on('data', this.parse.bind(this));

};

app.welcome = function() {

  this.client.write(
    '          ...-.\r\n    __  \/`     ' +
    '\'.\r\n .-\'  `\/   (   o \\\r\n\/ ' +
    '     \\,_   \\    \\\r\n\/|       \'---` ' +
    '|\\ |\r\n \\   \/__.-\/  \/  | |\r' +
    '\n |  \/ \/ \\ \\  \\   \\_\\\r\n |' +
    '__|_|  |_|__\\\n never forget.\n\n'
  );

  this.client.write('\nWelcome to phant!\n');
  this.client.write('Type \'help\' for a list of available commands\n\n');

};

app.prompt = function() {
  this.client.write('phant> ');
};

app.help = function() {

  var w = this.client.write.bind(this.client);

  w('\n');
  w('create     create a new stream\n');
  w('help       display this dialog\n');
  w('quit       close the connection\n\n');

};

app.parse = function(buf) {

  var command = buf.toString('ascii').trim().toLowerCase();

  switch(command) {

    case 'create':
      break;

    case '?':
    case 'help':
      this.help();
      this.prompt();
      break;

    case 'quit':
    case 'close':
    case 'exit':
      this.client.end();
      break;

    default:
      this.client.write('Command not recognized.\n');
      this.client.write('Type \'help\' for a list of available commands.\n');
      this.prompt();
      break;

  }

};

