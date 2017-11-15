'use strict';

var PhantNotify = require('../lib/phant-notify-email.js'),
    notify = PhantNotify({host: 'https://data.sparkfun.com'});

notify.useSMTP({
  host: "mailtrap.io",
  port: 2525,
  auth: {
    user: "20205073196204607",
    pass: "4c566b63ca8481"
  }
});

exports.phantNotify = {

  setUp: function(done) {

    this.stream = {
      title: 'Test Stream',
      publicKey: Math.random().toString(36).substring(6),
      privateKey: Math.random().toString(36).substring(6),
      deleteKey: Math.random().toString(36).substring(6)
    };

    done();
  },

  'create email': function(test) {

    test.expect(1);

    notify.create({to: 'todd.treece@sparkfun.com'}, this.stream, function(err) {

      test.ok(!err, 'should send mail');
      test.done();

    });

  }

};

