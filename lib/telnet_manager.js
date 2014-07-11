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
  async = require('async');

/**** Make PhantManager an event emitter ****/
util.inherits(PhantManager, events.EventEmitter);

/**** Manager prototype ****/
var manager = PhantManager.prototype;

/**** Expose PhantManager ****/
exports = module.exports = PhantManager;

/**** Initialize a new PhantManager ****/
function PhantManager(config) {

  if (!(this instanceof PhantManager)) {
    return new PhantManager(config);
  }

  config = config || {};

  events.EventEmitter.call(this, config);

  util._extend(this, config);

  telnet.Server(Client(this)).listen(this.port);

}

manager.keychain = false;
manager.metadata = false;
manager.validator = false;
manager.port = 8081;
manager.notifiers = [];

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

manager.notify = function(type, options, stream) {

  var self = this;

  this.notifiers.forEach(function(notify) {

    var func = notify[type];

    func.call(notify, options, stream, function(err) {

      if (err) {
        self.emit('error', 'notify error - ' + err);
      }

    });

  });

};

manager.getNotifiers = function(type) {

  var list = [];

  this.notifiers.forEach(function(notify) {

    list.push({
      name: notify.name,
      type: type,
      expect: notify.expect(type)
    });

  });

  return list;

};

/**** Telnet client prototype ****/
var client = Client.prototype;

/**** Get the client handler ****/
function Client(man) {

  return function(c) {
    util._extend(c, client);
    c.manager = man;
    c.init();
  };

}

/**
 * init
 *
 * prompts the user for input
 * and starts listening for
 * commands when a new client
 * connects.
 */
client.init = function() {

  this.welcome();
  this.prompt();

  this.on('data', this.command);

};

/**
 * welcome
 *
 * prints the welcome message when
 * a new client connects.
 */
client.welcome = function() {

  this.write(
    "            .-.._\n      __  \/`" +
    "     '.\n   .-'  `\/   (   a \\" +
    "\n  \/      (    \\,_   \\\n \/|" +
    "       '---` |\\ =|\n` \\    \/_" +
    "_.-\/  \/  | |\n   |  \/ \/ \\ \\" +
    "  \\   \\_\\  jgs\n   |__|_|  |_|" +
    "__\\\n  welcome to phant.\n\n"

  );

  this.write('Type \'help\' for a list of available commands\n\n');

};

/**
 * prompt
 *
 * helper for displaying a prompt
 * to the user.
 */
client.prompt = function(message) {

  message = message || 'phant';

  this.write(message + '> ');

};

/**
 * help
 *
 * displays the list of available
 * commands to the client
 */
client.help = function() {

  var w = this.write.bind(this);

  w('\n');
  w('list       list public streams\n');
  w('create     create a new stream\n');
  w('delete     remove a stream\n');
  w('help       display this dialog\n');
  w('quit       close the connection\n\n');
  w('If you need help getting started, visit http://phant.io/docs.\n\n');

};


/**
 * create
 *
 * prompts the user for new stream info,
 * and creates the feed if validation passes.
 */
client.create = function() {

  var self = this;

  // stop listening for commands
  this.removeListener('data', this.command);

  async.series({
    title: this.get('Enter a title', true),
    description: this.get('Enter a description', true),
    fields: this.get('Enter fields (comma separated)', true),
    tags: this.get('Enter tags (comma separated)')
  }, function(err, results) {

    results.fields = results.fields.split(',').map(function(f) {
      return f.trim();
    });

    results.tags = results.tags.split(',').map(function(t) {
      return t.trim();
    });

    results.hidden = false;

    self.manager.validator.create(results, function(err) {

      if (err) {
        self.write('creating stream failed: ' + err + '\n\n');
        self.on('data', self.command);
        return self.prompt();
      }

      self.manager.metadata.create(results, function(err, stream) {

        if (err) {
          self.write('creating stream failed: ' + err + '\n\n');
          self.on('data', self.command);
          return self.prompt();
        }

        self.write('\n');
        self.write('Stream created!\n');
        self.write('PUBLIC KEY: ' + self.manager.keychain.publicKey(stream.id) + '\n');
        self.write('PRIVATE KEY:  ' + self.manager.keychain.privateKey(stream.id) + '\n');
        self.write('DELETE KEY:  ' + self.manager.keychain.deleteKey(stream.id) + '\n\n');
        self.write('If you need help getting started, visit http://phant.io/docs.\n\n');

        self.on('data', self.command);
        self.prompt();

      });

    });

  });

};

/**
 * get
 *
 * helper function to get data from the user synchronously
 */
client.get = function(prompt, required) {

  var self = this;

  var get_data = function(callback) {

    self.prompt(prompt);

    self.once('data', function(buffer) {

      var input = buffer.toString('ascii').trim();

      if (!input && required) {
        return get_data(callback);
      }

      callback(null, input);

    });

  };

  return get_data;

};

/**
 * remove
 *
 * prompts the user for public & delete keys
 * and deletes the stream if the keys are valid.
 */
client.remove = function() {

  var self = this;

  // stop listening for commands
  this.removeListener('data', this.command);

  async.series({
    public_key: this.get('Enter public key'),
    delete_key: this.get('Enter delete key')
  }, function(err, result) {

    var id = self.manager.keychain.getIdFromPublicKey(result.public_key),
      valid = self.manager.keychain.validateDeleteKey(result.public_key, result.delete_key);

    if (!valid) {
      self.write('forbidden: invalid keys\n');
      self.on('data', self.command);
      return self.prompt();
    }

    self.manager.metadata.delete(id, function(err, success) {

      if (err) {
        self.write(err + '\n');
      } else {
        self.write('\ndeleted stream.\n\n');
      }

      self.on('data', self.command);
      self.prompt();

    });

  });
};

/**
 * list
 *
 * displays a list of the public streams
 */
client.list = function() {

  var self = this;

  self.write('\nPublic streams:\n');

  self.manager.metadata.list(function(err, streams) {

    if (err) {

      self.write('Error retrieving streams\n');

    } else {

      streams.forEach(function(stream) {
        var pk = self.manager.keychain.publicKey(stream.id);
        self.write(stream.title + ' - ' + pk + '\n');
      });

      self.write('\n');

      self.prompt();

    }

  });

};

/**
 * command
 *
 * helper function that interprets client
 * input and calls the appropriate method
 */
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
