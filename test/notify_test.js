'use strict';

var spawn = require('child_process').spawn,
  path = require('path'),
  request = require('request'),
  Keychain = require('phant-keychain-hex'),
  server;

var keys = Keychain({
  publicSalt: process.env.PHANT_PUBLIC_SALT || 'public salt',
  privateSalt: process.env.PHANT_PRIVATE_SALT || 'private salt'
});

exports.start = function(test) {

  server = spawn(path.join(__dirname, '..', '.bin', 'dev'));

  var listener = function(data) {
    server.stdout.removeListener('data', listener);
    test.done();
  };

  server.stdout.on('data', listener);

};

exports.notify = {

  'html': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:8080/streams/' + keys.publicKey('111aaa') + '/notify/create',
      method: 'POST',
      form: {
        privateKey: keys.privateKey('111aaa'),
        to: 'todd@sparkfun.com',
        name: 'Todd'
      }
    };

    request(options, function(err, res, body) {

      test.ok(!err, 'should not error');
      test.ok(/^text\/html/.test(res.headers['content-type']), 'content type should be text/html');
      test.equal(res.statusCode, 200, 'status should be 200');
      test.ok(/Sent notification/.test(body), 'should return a success message');

      test.done();

    });

  },

  'json': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:8080/streams/' + keys.publicKey('111aaa') + '/notify/create.json',
      method: 'POST',
      headers: {
        'Phant-Private-Key': keys.privateKey('111aaa')
      },
      form: {
        to: 'todd@sparkfun.com',
        name: 'Todd'
      }
    };

    request(options, function(err, res, body) {

      body = JSON.parse(body);

      test.ok(!err, 'should not error');
      test.ok(/^application\/json/.test(res.headers['content-type']), 'content type should be application/json');
      test.equal(res.statusCode, 200, 'status should be 200');
      test.ok(body.success, 'should return a success message');

      test.done();

    });

  }

};

exports.cleanup = function(test) {

  server.on('exit', function() {
    test.done();
  });

  server.kill();

};
