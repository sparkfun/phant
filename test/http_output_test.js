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
  cap: 3000,
  chunk: 96
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

exports.cleanup = function(test) {

  rimraf.sync(path.join(__dirname, 'tmp'));

  Phant.HttpServer.close(function() {
    test.done();
  });

};
