/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var stream = require('stream'),
  xml = require('xml'),
  util = require('util');

/**** Make AtomStream a transform stream ****/
util.inherits(AtomStream, stream.Transform);

/**** AtomStream prototype ****/
var proto = AtomStream.prototype;

/**** Expose AtomStream ****/
exports = module.exports = AtomStream;

/**** AtomStream constructor ****/
function AtomStream(meta) {

  if (!(this instanceof AtomStream)) {
    return new AtomStream(meta);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.metadata = meta;

}

proto.metadata = false;
proto.opened = false;

proto.open = function() {

  var start = '<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom">';

  if (!this.metadata) {
    this.emit('error', 'Missing metadata. Unable to generate an Atom feed.');
    this.end();
    return;
  }

  start += xml({
    title: this.metadata.title
  });
  start += xml({
    subtitle: this.metadata.description
  });
  start += xml({
    updated: (new Date(this.metadata.date)).toISOString()
  });
  start += xml({
    id: this.metadata.link
  });
  start += xml({
    link: {
      _attr: {
        href: this.metadata.link
      }
    }
  });
  start += xml({
    link: {
      _attr: {
        rel: 'self',
        type: 'application/atom+xml',
        href: this.metadata.link + '.atom'
      }
    }
  });

  this.push(start);

  this.opened = true;

};

proto._transform = function(line, encoding, callback) {

  var summary = [],
    dl = [],
    div = [],
    entry = [];

  if (!this.opened) {
    this.open();
  }

  if (!line) {
    return callback();
  }

  div.push({
    _attr: {
      xmlns: 'http://www.w3.org/1999/xhtml'
    }
  });

  entry.push({
    id: this.metadata.link + '/entry/' + line.timestamp
  });

  entry.push({
    title: line.timestamp
  });

  entry.push({
    author: [{
      name: 'phant'
    }, {
      uri: 'http://phant.io'
    }]
  });

  // use timestamp for updated tag
  entry.push({
    updated: line.timestamp
  });

  for (var key in line) {

    if (!line.hasOwnProperty(key)) {
      continue;
    }

    // add item to summary
    summary.push(key + ': ' + line[key]);

    // add list item to content dl
    dl.push({
      dt: key
    });
    dl.push({
      dd: line[key]
    });

  }

  // add summary
  entry.push({
    summary: summary.join(', ')
  });

  div.push({
    dl: dl
  });

  entry.push({
    content: [{
      _attr: {
        type: 'xhtml'
      }
    }, {
      div: div
    }]
  });

  this.push(xml({
    entry: entry
  }));

  callback();

};

proto._flush = function(callback) {

  this.push('</feed>\n');
  callback();

};
