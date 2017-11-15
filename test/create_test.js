'use strict';

var spawn = require('child_process').spawn,
  path = require('path'),
  request = require('request'),
  server;

var test_stream = {
  title: 'create test',
  description: 'testing manager creation',
  fields: 'test1, test2',
  tags: 'create',
  hidden: '0',
  check: ''
};

exports.start = function(test) {

  server = spawn(path.join(__dirname, '..', '.bin', 'dev'));

  var listener = function(data) {
    server.stdout.removeListener('data', listener);
    test.done();
  };

  server.stdout.on('data', listener);

};

exports.create = {

  'html': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:8080/streams',
      method: 'POST',
      form: test_stream
    };

    request(options, function(err, res, body) {

      test.ok(!err, 'should not error');
      test.ok(/^text\/html/.test(res.headers['content-type']), 'content type should be text/html');
      test.equal(res.statusCode, 200, 'status should be 200');
      test.ok(/New Stream:/.test(body), 'should return a created message');

      test.done();

    });

  },

  'json': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:8080/streams.json',
      method: 'POST',
      form: test_stream
    };

    request(options, function(err, res, body) {

      body = JSON.parse(body);

      test.ok(!err, 'should not error');
      test.ok(/^application\/json/.test(res.headers['content-type']), 'content type should be application/json');
      test.equal(res.statusCode, 200, 'status should be 200');
      test.ok(body.success, 'should report success');

      test.done();

    });

  },
};

exports.cleanup = function(test) {

  server.on('exit', function() {
    test.done();
  });

  server.kill();

};
