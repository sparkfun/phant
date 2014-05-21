'use strict';

var Phant = require('../index'),
  path = require('path'),
  Keychain = require('phant-keychain-hex'),
  Meta = require('phant-meta-json'),
  Storage = require('phant-stream-csv'),
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

var test_stream = {
  title: 'input test',
  description: 'this should be deleted by the test',
  fields: ['test1', 'test2'],
  tags: ['input test'],
  hidden: false
};

exports.create = function(test) {

  test.expect(1);

  meta.create(test_stream, function(err, stream) {

    test.ok(!err, 'should not error');

    test_stream = stream;

    test.done();

  });

};

exports.input = {

  'log get': function(test) {

    var self = this;

    var url = function(ext) {

      return 'http://localhost:' + http_port + '/input/' +
        keys.publicKey(test_stream.id) + '.' + ext + '?private_key=' +
        keys.privateKey(test_stream.id) + '&test1=get&test2=' + ext;

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

  },

  'log post': function(test) {

    var url = 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id);

    test.expect(6);

    var options = {
      url: url + '.txt',
      method: 'POST',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      },
      form: {
        test1: 'post',
        test2: 'txt'
      }
    };

    request(options, function(error, response, body) {

      test.ok(!error, 'txt should not error');

      test.equal(response.statusCode, 200, 'txt status should be 200');

      test.equal(body, '1 success\n', 'txt should return a success message');

    });

    options.url = url + '.json';
    options.form.test2 = 'json';

    request(options, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'json should not error');

      test.equal(response.statusCode, 200, 'json status should be 200');

      test.ok(body.success, 'json should return a JSON object with success == true');

      test.done();

    });

  },

  'clear': function(test) {

    test.expect(5);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '/clear.txt',
      method: 'DELETE',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      }
    };

    var count = function(cb) {

      var readStream = stream.objectReadStream(test_stream.id),
        c = 0;

      readStream.on('data', function(chunk) {
        c++;
      });

      readStream.on('end', function() {
        cb(c);
      });

    };

    count(function(c) {

      test.equal(c, 4, 'should start with 4 log entries');

      request(options, function(error, response, body) {

        test.ok(!error, 'should not error');

        test.equal(response.statusCode, 200, 'status should be 200');

        test.equal(body, '1 success\n', 'should return a success message');

        var readStream = stream.objectReadStream(test_stream.id);

        readStream.on('error', function(err) {
          test.ok(err, 'should not error');
          test.done();
        });

      });

    });

  }

};
