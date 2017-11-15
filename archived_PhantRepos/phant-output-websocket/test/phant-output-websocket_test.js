'use strict';

var phantOutput = require('../lib/phant-output-websocket.js');

exports.phantOutput = {
  setUp: function(done) {
    done();
  },
  'no args': function(test) {
    test.expect(1);
    test.ok(phantOutput, 'should be ok');
    test.done();
  }
};
