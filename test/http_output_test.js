'use strict';

var Phant = require('../index'),
  path = require('path'),
  Keychain = require('phant-keychain-hex'),
  Meta = require('phant-meta-nedb'),
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

    test.expect(4);

    request(url, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^application/json'), 'content-type should be application/json');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body[0].test1, '199', 'first element should be 199');

      test.done();

    });

  },

  'jsonp': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '.json?callback=phant_jsonp_test';

    test.expect(4);

    request(url, function(error, response, body) {

      var phant_jsonp_test = function(obj) {
        return obj;
      };

      var result = eval(body); // jshint ignore:line

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^text/javascript'), 'content-type should be text/javascript');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(result[0].test1, '199', 'first element should be 199');

      test.done();

    });

  },

  'csv': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '.csv';

    test.expect(5);

    request(url, function(error, response, body) {

      body = body.split('\n');

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^text/csv'), 'content-type should be text/csv');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body[0], 'test1,test2', 'first row should be headers');
      test.equal(body[1], '199,test', 'second row should be 199,test');

      test.done();

    });

  },

  'stats': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '/stats.json';

    test.expect(4);

    request(url, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'should not error');
      test.ok(response.headers['content-type'].match('^application/json'), 'content-type should be application/json');
      test.equal(response.statusCode, 200, 'status should be 200');
      test.equal(body.cap, 4000, 'cap should be 4000');

      test.done();

    });

  },

};

exports.cleanup = function(test) {

  rimraf.sync(path.join(__dirname, 'tmp'));

  Phant.HttpServer.close(function() {
    test.done();
  });

};
