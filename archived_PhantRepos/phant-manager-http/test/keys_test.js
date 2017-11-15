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

exports.keys = {

  'json': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:8080/streams/' + keys.publicKey('111aaa') + '/keys/' + keys.privateKey('111aaa') + '.json',
      method: 'GET'
    };

    request(options, function(err, res, body) {

      test.ok(!err, 'should not error');
      test.ok(/^application\/json/.test(res.headers['content-type']), 'content-type should be application/json');
      test.ok(/^attachment/.test(res.headers['content-disposition']), 'content-disposition should be attachment');
      test.equal(res.statusCode, 200, 'status should be 200');

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
