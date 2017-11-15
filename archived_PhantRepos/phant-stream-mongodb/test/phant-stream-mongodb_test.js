'use strict';

var Stream = require('../index.js'),
    i = 0;

var stream = new Stream({
  cap: 50 * 1024 * 1024
});

function generateData(size) {

  var result = '';

  for(var i=0; i < size; i++) {
    result += 'a';
  }

  return result;

}

exports.create = function(test) {

  var writeable = stream.writeStream('abcdef12345');

  // write a bunch of stuff
  for(i; i < 10000; i++) {
    if((i % 100) === 0) {
      writeable.write({test1: i, test2: generateData(8000)});
    } else {
      writeable.write({test1: i, test2: generateData(100)});
    }
  }

  // close writable stream
  writeable.end({test1: i, test2: generateData(100)});

  writeable.on('finish', function() {
    test.done();
  });

};

exports.read = function(test) {

  var readable = stream.objectReadStream('abcdef12345');
  test.expect(i + 1);

  readable.on('data', function(row) {
    test.equals(i, row.test1, 'should match');
    i--;
  });

  readable.on('end', function() {
    test.done();
  });

};

exports.cleanup = function(test) {

  stream.clear('abcdef12345');
  test.done();

};
