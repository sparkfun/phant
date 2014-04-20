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
    url = require('url'),
    ip = require('ip');

/**** Expose PhantManager ****/
exports = module.exports = PhantManager;

/**** Client prototype ****/
var client = {
  keychain: false,
  metadata: false
};

/**** Initialize a new PhantManager ****/
function PhantManager(port, config) {

  config = config || {};

  this.name = 'Telnet manager';

  telnet.Server(function(c) {
    util._extend(c, client);
    util._extend(c, config);
    c.port = port;
    c.init();
  }).listen(port);

}

client.new_stream = {
  title: null,
  description: null,
  fields: [],
  tags:[]
};

client.init = function() {

  this.welcome();
  this.prompt();

  this.on('data', this.command);

};

client.welcome = function() {

  this.write(
    "            .-.._\n      __  \/`" +
    "     '.\n   .-'  `\/   (   a \\" +
    "\n  \/      (    \\,_   \\\n \/|" +
    "       '---` |\\ =|\n` \\    \/_" +
    "_.-\/  \/  | |\n   |  \/ \/ \\ \\" +
    "  \\   \\_\\  jgs\n   |__|_|  |_|" +
    "__\\\n   never   forget.\n\n"
  );

  this.write('Welcome to phant!\n');
  this.write('Type \'help\' for a list of available commands\n\n');

};

client.prompt = function(message) {

  message = message || 'phant';

  this.write(message + '> ');

};

client.help = function() {

  var w = this.write.bind(this);

  w('\n');
  w('create     create a new stream\n');
  w('help       display this dialog\n');
  w('quit       close the connection\n\n');

};

client.create = function() {

  // stop listening for commands
  this.removeListener('data', this.command);

  this.once('data', this.title);
  this.write('\n');
  this.prompt('Enter a title -');

};

client.title = function(title) {

  title = title.toString('ascii').trim();

  if(! title) {
    this.once('data', this.title);
    return this.prompt('Enter a title -');
  }

  this.new_stream.title = title;

  this.once('data', this.description);
  this.prompt('Enter a description -');

};

client.description = function(desc) {

  desc = desc.toString('ascii').trim();

  this.new_stream.description = desc;

  this.once('data', this.fields);
  this.prompt('Enter fields (comma separated) -');

};

client.fields = function(fields) {

  fields = fields.toString('ascii').trim().split(',');

  fields = fields.map(function(f) {
    return f.trim();
  });

  if(fields.length === 0) {
    this.once('data', this.fields);
    return this.prompt('Enter fields (comma separated) ');
  }

  this.new_stream.fields = fields;

  this.once('data', this.tags);
  this.prompt('Enter tags (comma separated) -');

};

client.tags = function(tags) {

  tags = tags.toString('ascii').trim().split(',');

  tags = tags.map(function(t) {
    return t.trim();
  });

  this.new_stream.tags = tags;

  this.metadata.create(this.new_stream, function(err, stream) {

    this.new_stream = {};

    if(err) {
      this.write('creating  stream failed: ' + err);
      this.on('data', this.command);
      this.prompt();
      return;
    }

    this.write('\n');
    this.write('PUBLIC KEY: ' + this.keychain.publicKey(stream.id) + '\n');
    this.write('PRIVATE KEY:  ' + this.keychain.privateKey(stream.id) + '\n');

    var url = 'http://' + ip.address() + ':8080/';

    this.write('DATA STREAM:  ' + url + 'output/' + this.keychain.publicKey(stream.id) + '.json' + '\n');
    this.write('LOGGING URL:  ' + url + 'input/' + this.keychain.publicKey(stream.id) + '?private_key=' + this.keychain.privateKey(stream.id) + '\n\n');

    this.on('data', this.command);
    this.prompt();

  }.bind(this));

};

client.command = function(buf) {

  var command = buf.toString('ascii').trim().toLowerCase();

  switch(command) {

    case 'create':
      this.create();
      break;

    case '?':
    case 'help':
      this.help();
      this.prompt();
      break;

    case 'quit':
    case 'close':
    case 'exit':
      this.end();
      break;

    default:
      this.write('Command not recognized.\n');
      this.write('Type \'help\' for a list of available commands.\n');
      this.prompt();
      break;

  }

};

