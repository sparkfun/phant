'use strict';

var Phant = require('../index'),
  path = require('path'),
  Keychain = require('phant-keychain-hex'),
  Meta = require('phant-meta-nedb'),
  Storage = require('phant-stream-csv'),
  request = require('request'),
  rimraf = require('rimraf'),
  app = Phant(),
  http_port = 8080;

var keys = Keychain({
  publicSalt: 'public salt',
  privateSalt: 'private salt'
});

var meta = Meta({
  directory: path.join(__dirname, 'tmp')
});

var stream = Storage({
  directory: path.join(__dirname, 'tmp'),
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

  'log get txt': function(test) {

    var url = 'http://localhost:' + http_port + '/input/' +
      keys.publicKey(test_stream.id) + '.txt?private_key=' +
      keys.privateKey(test_stream.id) + '&test1=get&test2=txt';

    test.expect(4);

    request(url, function(error, response, body) {

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^text/plain'), 'content-type should be text/plain');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body, '1 success\n', 'should return a success message');

      test.done();

    });

  },

  'log get json': function(test) {

    var url = 'http://localhost:' + http_port + '/input/' +
      keys.publicKey(test_stream.id) + '.json?private_key=' +
      keys.privateKey(test_stream.id) + '&test1=get&test2=json';

    test.expect(4);

    request(url, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'json should not error');

      test.ok(response.headers['content-type'].match('^application/json'), 'content-type should be application/json');

      test.equal(response.statusCode, 200, 'json status should be 200');

      test.ok(body.success, 'json should return a JSON object with success == true');

      test.done();

    });

  },

  'log post txt': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.txt',
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

      test.ok(response.headers['content-type'].match('^text/plain'), 'content-type should be text/plain');

      test.equal(response.statusCode, 200, 'txt status should be 200');

      test.equal(body, '1 success\n', 'txt should return a success message');

      test.done();

    });

  },

  'log post json': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.json',
      method: 'POST',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      },
      form: {
        test1: 'post',
        test2: 'json'
      }
    };

    request(options, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'json should not error');

      test.ok(response.headers['content-type'].match('^application/json'), 'content-type should be application/json');

      test.equal(response.statusCode, 200, 'json status should be 200');

      test.ok(body.success, 'json should return a JSON object with success == true');

      test.done();

    });

  },

  'log post jsonp': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.json?callback=phant_jsonp_test',
      method: 'POST',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      },
      form: {
        test1: 'post',
        test2: 'jsonp'
      }
    };

    request(options, function(error, response, body) {

      var phant_jsonp_test = function(obj) {
        return obj;
      };

      var result = eval(body); // jshint ignore:line

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^text/javascript'), 'content-type should be text/javascript');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.ok(result.success, 'should return an object with success == true');

      test.done();

    });

  },

  'log post 100k': function(test) {

    test.expect(3);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.txt',
      method: 'POST',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      },
      form: {
        test1: '',
        test2: 'txt'
      }
    };

    for (var i = 0; i < 102400; i++) {
      options.form.test1 += 'x';
    }

    request(options, function(error, response, body) {

      test.ok(!error, 'should not error');
      test.equal(response.statusCode, 413, 'status should be 413');
      test.ok(/exceeded/.test(body), 'body should contain error message');

      test.done();

    });

  },

  'log get 64k': function(test) {

    var url = 'http://localhost:' + http_port + '/input/' +
      keys.publicKey(test_stream.id) + '.txt?private_key=' +
      keys.privateKey(test_stream.id) + '&test1=get&test2=';

    test.expect(4);

    for (var i = 0; i < 65536; i++) {
      url += 'x';
    }

    request(url, function(error, response, body) {

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^text/plain'), 'content-type should be text/plain');

      test.equal(response.statusCode, 414, 'status should be 414');

      test.ok(/exceeded/.test(body), 'body should contain an error message');

      test.done();

    });

  },

  'clear': function(test) {

    test.expect(6);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.txt',
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

      test.equal(c, 5, 'should start with 5 log entries');

      request(options, function(error, response, body) {

        test.ok(!error, 'should not error');

        test.ok(response.headers['content-type'].match('^text/plain'), 'content-type should be text/plain');

        test.equal(response.statusCode, 200, 'status should be 200');

        test.equal(body, '1 success\n', 'should return a success message');

        var readStream = stream.objectReadStream(test_stream.id);

        readStream.on('error', function(err) {
          test.ok(err, 'should error');
          test.done();
        });

      });

    });

  }

};

exports.cleanup = function(test) {

  test.expect(1);

  meta.delete(test_stream.id, function(err) {

    test.ok(!err, 'remove should not error');

    rimraf.sync(path.join(__dirname, 'tmp'));

    Phant.HttpServer.close(function() {
      test.done();
    });

  });

};
