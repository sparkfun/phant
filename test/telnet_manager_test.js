'use strict';

var Phant = require('../index'),
  path = require('path'),
  Keychain = require('phant-keychain-hex'),
  Meta = require('phant-meta-json'),
  Storage = require('phant-stream-csv'),
  request = require('request'),
  rimraf = require('rimraf'),
  telnet_client = require('telnet-client'),
  async = require('async'),
  app = Phant(),
  connection = new telnet_client();

var keys = Keychain({
  publicSalt: 'public salt',
  privateSalt: 'private salt'
});

var meta = Meta({
  directory: path.join(__dirname, 'tmp')
});

app.registerManager(
  Phant.TelnetManager({
    port: 8081,
    metadata: meta,
    keychain: keys
  })
);

exports.connect = function(test) {

  connection.on('ready', function(prompt) {
    test.done();
  });

  connection.connect({
    host: '127.0.0.1',
    port: 8081,
    shellPrompt: '> ',
    irs: '\n'
  });

};

exports.telnet = {

  'create': function(test) {

    test.expect(2);

    async.series({
      create: send('create'),
      title: send('manager create test'),
      description: send('this should be deleted by the test'),
      fields: send('test1, test2'),
      tags: send('manager test')
    }, function(err, result) {

      test.ok(!err, 'should not error');
      test.ok(/created/.test(result.tags), 'should report stream created');

      test.done();

    });

  },

  'list': function(test) {

    test.expect(1);

    connection.exec('list', function(response) {

      test.ok(/manager create test/.test(response), 'should return test stream');

      test.done();

    });

  }

};

exports.cleanup = function(test) {

  connection.destroy();

  rimraf.sync(path.join(__dirname, 'tmp'));

  test.done();

};

function send(txt) {

  var responded = false;

  return function(callback) {

    connection.exec(txt, function(response) {

      // stop multiple responses from calling the callback
      if (responded) {
        return;
      }

      callback(null, response.trim());

      responded = true;

    });

  };

}
