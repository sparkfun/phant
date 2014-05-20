'use strict';

var Phant = require('../index'),
  path = require('path'),
  Keychain = require('phant-keychain-hex'),
  Meta = require('phant-meta-json'),
  Storage = require('phant-stream-csv'),
  rimraf = require('rimraf'),
  request = require('request'),
  app = Phant(),
  http_port = 8080;

var keys = Keychain({
  publicSalt: 'public salt',
  privateSalt: 'private salt'
});

var meta = Meta({
  directory: 'tmp'
});

var stream = Storage({
  directory: 'tmp',
  cap: 1024,
  chunk: 96
});

var validator = Phant.Validator({
  metadata: meta
});

var httpInput = Phant.HttpInput({
  throttler: Phant.MemoryThrottler(),
  validator: validator,
  keychain: keys
});

Phant.HttpServer.listen(http_port);
Phant.HttpServer.use(httpInput);

app.registerInput(httpInput);
app.registerOutput(stream);

exports.input = {

  setUp: function(done) {

    var self = this;

    var test_stream = {
      title: 'input test',
      description: 'this should be deleted by the test',
      fields: ['test1', 'test2'],
      tags: ['input test'],
      hidden: false
    };

    meta.create(test_stream, function(err, stream) {

      if (err) {
        console.log('test set up failed: ' + err);
        process.exit(1);
      }

      self.stream = stream;

      done();

    });

  },

  tearDown: function(done) {

    meta.remove(this.stream.id, function(err) {

      if (err) {
        console.log('test tear down failed: ' + err);
        process.exit(1);
      }

      done();

    });

  },

  'log': function(test) {

    var self = this;

    var url = function(ext) {

      return 'http://localhost:' + http_port + '/input/' +
        keys.publicKey(self.stream.id) + '.' + ext + '?private_key=' +
        keys.privateKey(self.stream.id) + '&test1=1&test2=2';

    };

    test.expect(6);

    request(url('txt'), function(error, response, body) {

      test.ok(!error, 'txt should not error');

      test.equal(response.statusCode, 200, 'txt status should be 200');

      test.equal(body, '1 success\n', 'txt should return a success message');

    });

    request(url('json'), function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'json should not error');

      test.equal(response.statusCode, 200, 'json status should be 200');

      test.ok(body.success, 'json should return a JSON object with success == true');

      test.done();

    });

  }

};
