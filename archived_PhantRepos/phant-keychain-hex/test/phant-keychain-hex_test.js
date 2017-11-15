'use strict';

var Keychain = require('../lib/phant-keychain-hex.js'),
    keys = Keychain({
      publicSalt: 'testing',
      privateSalt: 'testing private',
      deleteSalt: 'testing delete'
    });

exports.phantKeychainHex = {
  setUp: function(done) {
    this.id = '123abef222cc';
    done();
  },
  'private key and public key': function(test) {
    test.expect(2);
    test.ok(keys.validate(keys.publicKey(this.id), keys.privateKey(this.id)), 'should match');
    test.ok(keys.validate(keys.publicKey(this.id), '1') === false, 'should not match');
    test.done();
  },
  'delete key and public key': function(test) {
    test.expect(2);
    test.ok(keys.validateDeleteKey(keys.publicKey(this.id), keys.deleteKey(this.id)), 'should match');
    test.ok(keys.validateDeleteKey(keys.publicKey(this.id), '1') === false, 'should not match');
    test.done();
  }
};
