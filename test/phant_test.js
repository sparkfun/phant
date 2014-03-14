'use strict';

var phant = require('../lib/phant.js'),
    events = require('events');

exports.phant = {
  setUp: function(done) {
    done();
  },
  'no args': function(test) {
    test.expect(1);

    test.ok(
      (phant.prototype instanceof events.EventEmitter),
      'phant should be an event emitter'
    );

    test.done();
  }
};
