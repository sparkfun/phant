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
var app = AtomStream.prototype;

/**** Expose AtomStream ****/
exports = module.exports = AtomStream;

/**** Initialize a new AtomStream ****/
function AtomStream(meta) {

  if (!(this instanceof AtomStream)) {
    return new AtomStream(meta);
  }

  stream.Transform.call(this);
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.meta = meta;

}

app.meta = false;
app.opened = false;

app.open = function() {

  var start = '<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom">',
    prop;

  if (this.meta) {

    start += xml({
      title: this.meta.title
    });
    start += xml({
      subtitle: this.meta.description
    });
    start += xml({
      updated: (new Date(this.meta.date)).toISOString()
    });
    start += xml({
      id: this.meta.link
    });
    start += xml({
      link: {
        _attr: {
          href: this.meta.link
        }
      }
    });
    start += xml({
      link: {
        _attr: {
          rel: 'self',
          type: 'application/atom+xml',
          href: this.meta.link + '.atom'
        }
      }
    });

  }

  this.push(start);

  this.opened = true;

};

app._transform = function(line, encoding, callback) {

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
    id: this.meta.link + '/entry/' + line.timestamp
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

app._flush = function(callback) {

  this.push('</feed>\n');
  callback();

};
