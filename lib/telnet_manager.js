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
    ip = require('ip'),
    async = require('async');

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

  var self = this;
  async.series({
    title: self.get_data('Enter a title'),
    description: self.get_data('Enter a description'),
    fields: self.get_data('Enter fields (comma separated)'),
    tags: self.get_data('Enter tags (comma separated)')
  }, function (err, results) {
    self.new_stream.title = results.title;
    self.new_stream.description = results.description;

    var fields = results.fields.split(',');
    fields.map(function (f) { return f.trim(); });
    self.new_stream.fields = fields;

    var tags = results.tags.split(',');
    tags.map(function (t) { return t.trim(); });
    self.new_stream.tags = tags;

    self.metadata.create(self.new_stream, function (err, stream) {
      self.new_stream = {};

      if(err) {
        self.write('creating  stream failed: ' + err);
        self.on('data', self.command);
        self.prompt();
        return;
      }

      self.write('\n');
      self.write('PUBLIC KEY: ' + self.keychain.publicKey(stream.id) + '\n');
      self.write('PRIVATE KEY:  ' + self.keychain.privateKey(stream.id) + '\n');

      var url = 'http://' + ip.address() + ':8080/';

      self.write('DATA STREAM:  ' + url + 'output/' + self.keychain.publicKey(stream.id) + '.json' + '\n');
      self.write('LOGGING URL:  ' + url + 'input/' + self.keychain.publicKey(stream.id) + '?private_key=' + self.keychain.privateKey(stream.id) + '\n\n');

      self.on('data', self.command);
      self.prompt();
    });
  });
};

client.get_data = function (prompt) {
  var self = this;
  var _get_data = function (callback) {
    self.prompt(prompt);
    self.once('data', function (buffer) {
      var input = buffer.toString('ascii').trim();
      if (! input) {
        _get_data(callback);
        return;
      }
      callback(null, input);
    });
  }
  return _get_data;
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

