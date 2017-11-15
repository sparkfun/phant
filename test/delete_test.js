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

exports.delete = {

  'html': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:8080/streams/' + keys.publicKey('111aaa'),
      method: 'DELETE',
      headers: {
        'Phant-Delete-Key': keys.deleteKey('111aaa')
      }
    };

    request(options, function(err, res, body) {

      test.ok(!err, 'should not error');
      test.ok(/^text\/html/.test(res.headers['content-type']), 'content type should be text/html');
      test.equal(res.statusCode, 202, 'status should be 202');
      test.ok(/Deleted Stream:/.test(body), 'should return a deleted message');

      test.done();

    });

  },

  'json': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:8080/streams/' + keys.publicKey('222bbb') + '.json',
      method: 'DELETE',
      headers: {
        'Phant-Delete-Key': keys.deleteKey('222bbb')
      }
    };

    request(options, function(err, res, body) {

      body = JSON.parse(body.trim());

      test.ok(!err, 'should not error');
      test.ok(/^application\/json/.test(res.headers['content-type']), 'content type should be application/json');
      test.equal(res.statusCode, 202, 'status should be 202');
      test.ok(body.success, 'should return success == true')

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
