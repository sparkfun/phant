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
  cap: 4000,
  chunk: 128
});

var validator = Phant.Validator({
  metadata: meta
});

var httpOutput = Phant.HttpOutput({
  validator: validator,
  storage: stream,
  keychain: keys
});

Phant.HttpServer.listen(http_port);
Phant.HttpServer.use(httpOutput);

app.registerOutput(httpOutput);

var test_stream = {
  title: 'output test',
  description: 'this should be deleted by the test',
  fields: ['test1', 'test2'],
  tags: ['output test'],
  hidden: false
};

exports.create = function(test) {

  test.expect(1);

  meta.create(test_stream, function(err, rec) {

    var ws = stream.writeStream(rec.id);
    ws.writeHeaders('test1,test2\n');

    test.ok(!err, 'should not error');

    test_stream = rec;

    ws.once('open', function() {

      async.timesSeries(200, function(n, next) {
        ws.write(n + ',test\n');
        next();
      }, function(err) {
        ws.end();
        ws.on('finish', function() {
          test.done();
        });
      });

    });

  });

};

exports.output = {

  'json': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '.json';

    test.expect(3);

    request(url, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'should not error');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body[0].test1, '199', 'first element should be 199');

      test.done();

    });

  }

};

exports.cleanup = function(test) {

  rimraf.sync(path.join(__dirname, 'tmp'));

  Phant.HttpServer.close(function() {
    test.done();
  });

};
