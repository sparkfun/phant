'use strict';

var Phant = require('../index'),
  path = require('path'),
  Keychain = require('phant-keychain-hex'),
  Meta = require('phant-meta-json'),
  Storage = require('phant-stream-csv'),
  request = require('request'),
  rimraf = require('rimraf'),
  async = require('async'),
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
  throttler: Phant.MemoryThrottler({
    limit: 5,
    window: 10
  }),
  validator: validator,
  keychain: keys
});

Phant.HttpServer.listen(http_port);
Phant.HttpServer.use(httpInput);

app.registerInput(httpInput);
app.registerOutput(stream);

var test_stream = {
  title: 'memory throttler test',
  description: 'this should be deleted by the test',
  fields: ['test1'],
  tags: ['throttler test'],
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

exports.throttler = {

  'limit': function(test) {

    test.expect(2);

    async.timesSeries(4, log, function(err) {

      test.ok(!err, 'should not error');

      log(6, function(err) {
        test.equal(err, 'failed', 'should limit');
        test.done();
      });

    });

  }

};

exports.cleanup = function(test) {

  test.expect(1);

  meta.remove(test_stream.id, function(err) {

    test.ok(!err, 'remove should not error');

    rimraf.sync(path.join(__dirname, 'tmp'));

    Phant.HttpServer.close(function() {
      test.done();
    });

  });

};

function log(n, next) {

  var options = {
    url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.txt',
    method: 'POST',
    headers: {
      'Phant-Private-Key': keys.privateKey(test_stream.id)
    },
    form: {
      test1: n
    }
  };

  request(options, function(error, response, body) {

    if (!/1\ssuccess/.test(body)) {
      return next('failed', n);
    }

    next(null, body);

  });

}
