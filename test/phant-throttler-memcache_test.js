'use strict';

var Throttler = require('../lib/phant-throttler-memcache.js'),
    throttler = Throttler({
      host: 'localhost:11211',
      limit: 3,
      window: 3
    });

exports.Throttler = {
  setUp: function(done) {
    this.key = 'testing123';
    done();
  },
  'hit 1': function(test) {

    test.expect(1);

    throttler.available(this.key, function(ready) {
      test.ok(ready, 'within limit');
      test.done();
    });

  },

  'hit 2': function(test) {

    test.expect(1);

    throttler.available(this.key, function(ready) {
      test.ok(ready, 'within limit');
      test.done();
    });

  },

  'hit 3': function(test) {

    test.expect(1);

    throttler.available(this.key, function(ready) {
      test.ok(! ready, 'over limit');
      test.done();
    });

  },

  'timeout': function(test) {

    test.expect(1);

    setTimeout(function() {
      throttler.available(this.key, function(ready) {
        test.ok(ready, 'limit reset');
        test.done();
      });
    }, 3000);

  }

};
