/**
 * phant-notify-email
 * https://github.com/sparkfun/phant-notify-email
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

var util = require('util'),
    nodemailer = require('nodemailer');

/**** PhantNotify prototype ****/
var app = PhantNotify.prototype;

/**** Expose PhantNotify ****/
exports = module.exports = PhantNotify;

/**** Initialize a new PhantNotify ****/
function PhantNotify(config) {

  if (! (this instanceof PhantNotify)) {
    return new PhantNotify(config);
  }

  config = config || {};

  util._extend(this, config);

}

app.useSMTP = function(options) {
  this.mailer = nodemailer.createTransport('SMTP', options);
};

app.useSendmail = function(options) {
  this.mailer = nodemailer.createTransport('sendmail', options);
};

app.moduleName = 'Notify Email';

/**** direct transport by default ****/
app.mailer = nodemailer.createTransport();
app.from = 'Phant <data@sparkfun.com>';
app.subject = 'New Phant Stream: ';
app.host = false;

/**
 * expect
 *
 * this is used by the managers
 * to prompt users for the appropriate
 * info to send notifications.
 *
 * it's also used by the sender functions
 * to validate incoming fields.
 */
app.expect = function(type) {

  if(type === 'create') {
    return { to: 'Email Address' };
  }

};

/**
 * create
 *
 * sends stream creation messages to users
 */
app.create = function(options, stream, cb) {

  var expected = this.expect('create');

  for(var key in expected) {

    if(! options[key]) {
      return cb('Could not send email. Missing: ' + expected[key]);
    }

  }

  options.from = this.from;
  options.subject = this.subject + stream.title;

  options.text = 'New Stream Created!\n' +
                 '===================\n\n' +
                 stream.title + '\n' +
                 'Public Key: ' + stream.publicKey + '\n' +
                 'Private Key: ' + stream.privateKey + '\n' +
                 'Delete Key: ' + stream.deleteKey + '\n\n';

  if(this.host) {
    options.text += 'Stream URL:\n';
    options.text += this.host + '/streams/' + stream.publicKey + '\n\n';
  }

  options.text += 'If you need help getting started, visit http://phant.io/docs for more info.\n\n' +
                  'Have fun!';

  this.mailer.sendMail(options, function(err, response) {

    if(err) {
      return cb('Could not send email. ' + err);
    }

    cb(null);

  });

};

