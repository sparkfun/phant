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

/**** Manager prototype ****/
var manager = PhantManager.prototype;

/**** Expose PhantManager ****/
exports = module.exports = PhantManager;

/**** Initialize a new PhantManager ****/
function PhantManager(config) {

  config = config || {};

  if (!(this instanceof PhantManager)) {
    return new PhantManager(config);
  }

  var self = this;

  util._extend(this, config);

  telnet.Server(function(c) {
    util._extend(c, client);
    c.port = port;
    c.manager = self;
    c.init();
  }).listen(port);

}

manager.keychain = false;
manager.metadata = false;
manager.port = 8081;

manager.touch = function(id) {

  if (!this.metadata) {
    return;
  }

  this.metadata.touch(id, function(err) {

    if (err) {
      this.emit('error', err);
    }

  }.bind(this));

};

client.new_stream = {
  title: null,
  description: null,
  fields: [],
  tags: [],
  hidden: false
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
  w('list       list public streams\n');
  w('create     create a new stream\n');
  w('delete     remove a stream\n');
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
  }, function(err, results) {
    self.new_stream.title = results.title;
    self.new_stream.description = results.description;

    var fields = results.fields.split(',');
    fields.map(function(f) {
      return f.trim();
    });
    self.new_stream.fields = fields;

    var tags = results.tags.split(',');
    tags.map(function(t) {
      return t.trim();
    });
    self.new_stream.tags = tags;

    self.manager.create(self.new_stream, function(err, stream) {
      self.new_stream = {};

      if (err) {
        self.write('creating stream failed: ' + err);
        self.on('data', self.command);
        self.prompt();
        return;
      }

      self.write('\n');
      self.write('PUBLIC KEY: ' + self.manager.keychain.publicKey(stream.id) + '\n');
      self.write('PRIVATE KEY:  ' + self.manager.keychain.privateKey(stream.id) + '\n');
      self.write('DELETE KEY:  ' + self.manager.keychain.deleteKey(stream.id) + '\n');

      var url = 'http://' + ip.address() + ':8080/';

      self.write('DATA STREAM:  ' + url + 'output/' + self.manager.keychain.publicKey(stream.id) + '.json' + '\n');
      self.write('LOGGING URL:  ' + url + 'input/' + self.manager.keychain.publicKey(stream.id) + '?private_key=' + self.manager.keychain.privateKey(stream.id) + '\n\n');

      self.on('data', self.command);
      self.prompt();
    });
  });
};

/*
 * helper function to get data from the user synchronously
 */
client.get_data = function(prompt) {
  var self = this;
  var _get_data = function(callback) {
    self.prompt(prompt);
    self.once('data', function(buffer) {
      var input = buffer.toString('ascii').trim();
      if (!input) {
        _get_data(callback);
        return;
      }
      callback(null, input);
    });
  };
  return _get_data;
};

client.remove = function() {
  this.removeListener('data', this.command);

  var self = this;
  async.series({
    public_key: self.get_data('Enter public key'),
    delete_key: self.get_data('Enter delete key'),
  }, function(err, result) {

    var id = self.manager.keychain.getIdFromPublicKey(result.public_key);
    var valid = self.manager.keychain.validateDeleteKey(result.public_key, result.delete_key);

    if (!valid) {
      self.write('forbidden: invalid keys\n');
      self.on('data', self.command);
      return self.prompt();
    }

    self.manager.metadata.remove(id, function(err, success) {

      if (err) {
        self.write(err + '\n');
      } else {
        self.write('deleted stream\n');
      }

      self.on('data', self.command);
      self.prompt();

    });

  });
};

client.list = function() {
  var self = this;
  self.write('Public streams:\n');
  self.manager.list(function(err, streams) {
    if (err) {
      self.write('Error retreiving streams\n');
    } else {
      streams.forEach(function(stream) {
        var pk = self.manager.keychain.publicKey(stream.id);
        self.write(stream.title + ' (public key: ' + pk + ')\n');
      });
      self.prompt();
    }
  });
};

client.command = function(buf) {

  var command = buf.toString('ascii').trim().toLowerCase();

  switch (command) {

    case 'create':
      this.create();
      break;

    case 'delete':
      this.remove();
      break;

    case 'list':
      this.list();
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

    case '':
      this.prompt();
      break;

    default:
      this.write('Command not recognized.\n');
      this.write('Type \'help\' for a list of available commands.\n');
      this.prompt();
      break;

  }

};
