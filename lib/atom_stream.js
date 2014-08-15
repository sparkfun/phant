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

  var start = '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n',
      prop;

  if(this.meta) {

    for(var i in this.meta) {
      prop = {};
      prop[i] = this.meta[i];
      start += xml(prop);
    }

  }

  this.push(start);

  this.opened = true;

};

app._transform = function(line, encoding, callback) {

  if (!this.opened) {
    this.open();
  }

  if (!line) {
    return callback();
  }

  /*
    <entry>
      <title>Title</title>
      <updated>2003-12-13T18:30:02Z</updated>
      <summary>Some text.</summary>
      <content type="xhtml">
         <div xmlns="http://www.w3.org/1999/xhtml">
            <p>This is the entry content.</p>
         </div>
      </content>
    </entry>
  */

  callback();

};

app._flush = function(callback) {

  this.push('</feed>\n');
  callback();

};
