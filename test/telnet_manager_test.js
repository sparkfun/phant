'use strict';

var Phant = require('../index'),
  path = require('path'),
  Keychain = require('phant-keychain-hex'),
  Meta = require('phant-meta-nedb'),
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

var validator = Phant.Validator({
  metadata: meta
});

app.registerManager(
  Phant.TelnetManager({
    port: 8081,
    metadata: meta,
    keychain: keys,
    validator: validator
  })
);

exports.connect = function(test) {

  connection.on('ready', function(prompt) {
    test.done();
  });

  connection.connect({
    host: '127.0.0.1',
    port: 8081,
    shellPrompt: /> /,
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
      tags: send('manager_test, test')
    }, function(err, result) {

      test.ok(!err, 'should not error');
      test.ok(/created/.test(result.tags), 'should report stream created');

      test.done();

    });

  },

  'list': function(test) {

    var responded = false;

    test.expect(1);

    connection.exec('list', function(response) {

      // stop multiple responses from calling the callback
      if (responded) {
        return;
      }

      test.ok(/manager create test/.test(response), 'should return test stream');

      test.done();

      responded = true;

    });

  },

  'delete': function(test) {

    test.expect(5);

    meta.list(function(err, streams) {

      test.ok(!err, 'should not report error');
      test.ok(streams.length > 0, 'should have at least one stream');

      if (!streams[0]) {
        return test.done();
      }

      async.series({
        cmd: send('delete'),
        pub: send(keys.publicKey(streams[0].id)),
        del: send(keys.deleteKey(streams[0].id))
      }, function(err, result) {

        test.ok(!err, 'should not error');
        test.ok(/deleted/.test(result.del), 'should report stream deleted');

        meta.list(function(err, streams) {
          test.equal(streams.length, 0, 'should have no streams');
          test.done();
        });

      });

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
