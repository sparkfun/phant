'use strict';

var Phant = require('../index'),
  path = require('path'),
  Keychain = require('phant-keychain-hex'),
  Meta = require('phant-meta-json'),
  Storage = require('phant-stream-csv'),
  rimraf = require('rimraf'),
  app = Phant(),
  http_port = process.env.PHANT_PORT || 8080;

var keys = Keychain({
  publicSalt: process.env.PHANT_PUBLIC_SALT || 'public salt',
  privateSalt: process.env.PHANT_PRIVATE_SALT || 'private salt'
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

exports.phant = {

  setUp: function(done) {

    var self = this;

    var test_stream = {
      title: 'input test',
      description: 'this should be deleted by the test',
      fields: ['test1', 'test2'],
      tags: ['input test'],
      hidden: false
    };

    meta.create(test_stream, function(err, stream) {

      if (err) {
        console.log('test set up failed: ' + err);
        process.exit(1);
        return done();
      }

      self.stream = stream;

      done();

    });

  },

  tearDown: function(done) {
    rimraf.sync('tmp');
    done();
  }

};
