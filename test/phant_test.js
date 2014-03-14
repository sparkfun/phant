'use strict';

var phant = require('../lib/phant.js');

exports.phant = {
  setUp: function(done) {
    done();
  },
  'no args': function(test) {
    test.expect(1);
    test.ok(phant, 'should be a phant.');
    test.done();
  }
};
