/**
 * phant-monitor
 * https://github.com/sparkfun/phant-monitor
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var mailer = require('nodemailer'),
    util = require('util'),
    fs = require('fs');

/**** app prototype ****/
var app = Monitor.prototype;

/**** Expose Monitor ****/
exports = module.exports = Monitor;

function Monitor(options) {

  if (! (this instanceof Monitor)) {
    return new Monitor(options);
  }

  util._extend(this, options || {});

  this.email_template = fs.readFileSync('./email_template', 'utf8');

  // this sets up the smtp connection pool.
  // better to do it for each message?
  this.smtpTransport = mailer.createTransport('SMTP', {
    service: 'Gmail',
    auth: {
      user: 'gmail.user@gmail.com',
      pass: 'userpass'
    }
  });
}

app.last_mailed = {};

app.run = function () {
  setInterval(this.check.bind(this), this.interval);
};

app.check = function () {
  var self = this;
  this.metadata.all(function (err, streams) {
    var now = new Date();
    var then = null;
    var age = self.age;

    if(err || ! streams.length) {
      return;
    }

    streams.forEach(function(stream) {
      then = self.last_mailed[stream.id] || stream.last_push;
      if ((now - then) > age) {
        self.last_mailed[stream.id] = now;
        console.log(util.format(self.email_template, stream.id));
        // self.smtpTransport.sendMail({
        //     from: '',
        //     to: '',
        //     subject: '',
        //     text: util.format(self.email_template, stream.id)
        //   }, function(error, response){
        //     if (error) {
        //       console.log(error);
        //     } else {
        //       console.log("Message sent: " + response.message);
        //     }
        // });
      }
    });
  });
};
