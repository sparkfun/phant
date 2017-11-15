/**
 * phant-reaper
 * https://github.com/sparkfun/phant-reaper
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var util = require('util'),
    events = require('events');

/**** Make Reaper an event emitter ****/
util.inherits(Reaper, events.EventEmitter);

/**** app prototype ****/
var app = Reaper.prototype;

/**** Expose Reaper ****/
exports = module.exports = Reaper;

function Reaper(options) {

  if (! (this instanceof Reaper)) {
    return new Reaper(options);
  }

  events.EventEmitter.call(this);

  util._extend(this, options || {});

}

app.created = 7 * 24 * 60 * 60 * 1000; // 7 days
app.pushed = 31540000000; // 1 year
app.metadata = false;
app.storage = false;

app.reap = function() {

  var self = this,
      now = new Date();

  this.metadata.each(function(err, stream) {

    var last = new Date(stream.last_push),
        created = new Date(stream.date);

    if(err) {
      return self.emit('error', err);
    }

    // leave it alone if it was created recently
    if ((now.getTime() - created.getTime()) < self.created) {
      return;
    }

    // leave it alone if it has pushed recently
    if ((now.getTime() - last.getTime()) < self.pushed) {
      return;
    }

    self.metadata.delete(stream.id, function(err) {

      if(err) {
        return self.emit('error', err);
      }

      self.storage.clear(stream.id);

      self.emit('delete', stream.id);

    });

  });

};

