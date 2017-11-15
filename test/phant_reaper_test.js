'use strict';

var Reaper = require('../index.js');

exports.reaper = {
  setUp: function(done) {
    done();
  },
  'no args': function(test) {
    test.expect(1);
    test.ok(Reaper, 'should be ok');
    test.done();
  }
};
