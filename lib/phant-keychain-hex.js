/*
 * phant-keychain-hex
 * https://github.com/sparkfun/phant-keychain-hex
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var HashIds = require('hashids'),
    util = require('util');

/**** Keychain prototype ****/
var app = Keychain.prototype;

/**** Expose PhantStorageMongodb ****/
exports = module.exports = Keychain;

/**** Initialize a new Keychain ****/
function Keychain(config) {

  if (! (this instanceof Keychain)) {
    return new Keychain(config);
  }

  config = config || {};

  util._extend(this, config);

}

app.keyLength = 6;
app.privateSalt = 'Please change the private salt';
app.publicSalt = 'Please change the public salt';
app.deleteSalt = 'Please change the delete salt';

/**
 * publicKey
 *
 * grab public hashed version of the stream id.
 */
app.publicKey = function(id) {

  var hashid = new HashIds(this.publicSalt, this.keyLength);

  return hashid.encryptHex(id);

};

/**
 * privateKey
 *
 * grab the private key for the stream using the stream id.
 */
app.privateKey = function(id) {

  var hashid = new HashIds(this.privateSalt, this.keyLength);

  return hashid.encryptHex(id);

};

/**
 * deleteKey
 *
 * grab the delete key for the stream using the stream id.
 */
app.deleteKey = function(id) {

  var hashid = new HashIds(this.deleteSalt, this.keyLength);

  return hashid.encryptHex(id);

};

/**
 * validate
 *
 * alias for validatePrivateKey
 */
app.validate = function(publicKey, privateKey) {

  return this.validatePrivateKey(publicKey, privateKey);

};

/**
 * validatePrivateKey
 *
 * make sure the private key is valid for the supplied public key.
 */
app.validatePrivateKey = function(publicKey, privateKey) {

  return this.getIdFromPublicKey(publicKey) === this.getIdFromPrivateKey(privateKey);

};

/**
 * validateDeleteKey
 *
 * make sure the delete key is valid for the supplied public key.
 */
app.validateDeleteKey = function(publicKey, deleteKey) {

  return this.getIdFromPublicKey(publicKey) === this.getIdFromDeleteKey(deleteKey);

};

/**
 * getIdFromPublicKey
 *
 * decrypt the stream id using the public key.
 */
app.getIdFromPublicKey = function(key) {

  var hashid = new HashIds(this.publicSalt, this.keyLength);

  return hashid.decryptHex(key);

};

/**
 * getIdFromPrivateKey
 *
 * decrypt the stream id using the private key.
 */
app.getIdFromPrivateKey = function(key) {

  var hashid = new HashIds(this.privateSalt, this.keyLength);

  return hashid.decryptHex(key);

};

/**
 * getIdFromDeleteKey
 *
 * decrypt the stream id using the private key.
 */
app.getIdFromDeleteKey = function(key) {

  var hashid = new HashIds(this.deleteSalt, this.keyLength);

  return hashid.decryptHex(key);

};
