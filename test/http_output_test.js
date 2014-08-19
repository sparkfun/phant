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
  fields: ['test1', 'test2', 'timestamp'],
  tags: ['output test'],
  hidden: false
};

exports.create = function(test) {

  test.expect(1);

  meta.create(test_stream, function(err, rec) {

    var ws = stream.writeStream(rec.id);
    ws.writeHeaders('test1,test2,timestamp\n');

    test.ok(!err, 'should not error');

    test_stream = rec;

    ws.once('open', function() {

      async.timesSeries(200, function(n, next) {
        ws.write(n + ',test,' + (new Date()).toISOString() + '\n');
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

      test.ok(response.headers['content-type'].match(/^text\/csv/), 'content-type should be text/csv');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body[0], 'test1,test2,timestamp', 'first row should be headers');
      test.ok(/^199,test/.test(body[1]), 'second row should be 199,test');

      test.done();

    });

  },

  'atom': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '.atom';

    test.expect(4);

    request(url, function(error, response, body) {

      test.ok(!error, 'should not error');

      test.equal(
        response.headers['content-type'],
        'application/atom+xml',
        'content-type should be application/atom+xml'
      );

      test.equal(response.statusCode, 200, 'status should be 200');

      test.ok(
        /<dd>199<\/dd>/g.test(body),
        'body should contain pushed data'
      );

      test.done();

    });

  },

  'sql': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '.sql';

    test.expect(4);

    request(url, function(error, response, body) {

      test.ok(!error, 'should not error');

      test.equal(
        response.headers['content-type'],
        'text/plain',
        'content-type should be text/plain'
      );

      test.equal(response.statusCode, 200, 'status should be 200');

      test.ok(
        /\('199', 'test'/g.test(body),
        'body should contain pushed data'
      );

      test.done();

    });

  },

  'psql': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '.psql';

    test.expect(4);

    request(url, function(error, response, body) {

      test.ok(!error, 'should not error');

      test.equal(
        response.headers['content-type'],
        'text/plain',
        'content-type should be text/plain'
      );

      test.equal(response.statusCode, 200, 'status should be 200');

      test.ok(
        /\('199', 'test'/g.test(body),
        'body should contain pushed data'
      );

      test.done();

    });

  },

  'limit': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '.json?limit=5';

    test.expect(4);

    request(url, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^application/json'), 'content-type should be application/json');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body.length, 5, 'response should contain 5 items');

      test.done();

    });

  },

  'offset': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '.json?offset=10';

    test.expect(4);

    request(url, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^application/json'), 'content-type should be application/json');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body[0].test1, '189', 'results should be offset by 10');

      test.done();

    });

  },

  'sample': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '.json?sample=10';

    test.expect(6);

    request(url, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^application/json'), 'content-type should be application/json');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body[0].test1, '199', 'first sample should be 199');
      test.equal(body[1].test1, '189', 'second sample should be 189');
      test.equal(body[2].test1, '179', 'third sample should be 179');

      test.done();

    });

  },

  'field': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '/test1';

    test.expect(6);

    request(url, function(error, response, body) {

      body = body.split('\n');

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^text/plain'), 'content-type should be text/plain');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body[0], '199', 'first line should be 199');
      test.equal(body[1], '198', 'second line should be 198');
      test.equal(body[2], '197', 'third line should be 197');

      test.done();

    });

  },

  'latest row': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '/latest';

    test.expect(6);

    request(url, function(error, response, body) {

      body = body.split('\n');

      test.ok(!error, 'should not error');
      test.ok(response.headers['content-type'].match(/^text\/plain/), 'content-type should be text/plain');
      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body[0], 'test1,test2,timestamp', 'first row should be headers');
      test.ok(/^199,test/.test(body[1]), 'second row should be 199,test');
      test.ok(body[2] === '', 'there should be only one row');

      test.done();

    });

  },

  'latest field': function(test) {

    var url = 'http://localhost:' + http_port + '/output/' +
      keys.publicKey(test_stream.id) + '/test1/latest';

    test.expect(4);

    request(url, function(error, response, body) {

      test.ok(!error, 'should not error');
      test.ok(response.headers['content-type'].match(/^text\/plain/), 'content-type should be text/plain');
      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body, '199\n', '199 should be the only value');

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

  }

};

exports.cleanup = function(test) {

  rimraf.sync(path.join(__dirname, 'tmp'));

  Phant.HttpServer.close(function() {
    test.done();
  });

};
