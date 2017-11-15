/**
 * phant-stream-json
 * https://github.com/sparkfun/phant-stream-json
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var mkdirp = require('mkdirp'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    rimraf = require('rimraf');

/**** app prototype ****/
var app = {};

/**** Expose Helpers ****/
exports = module.exports = Helpers;

function Helpers(options) {

  var helpers = {};

  util._extend(helpers, app);
  util._extend(helpers, options);

  return helpers;

}

app.fileName = 'stream.json';
app.root = 'tmp';

app.filePath = function(id, page, cb) {

  var name = this.fileName;

  page = page || 1;

  // log files are numbered like this:
  // stream.json, stream.json.0, stream.json.1
  if(page > 1) {
    name = name + '.' + (page - 2);
  }

  this.directoryPath(id, function(err, dir) {

    if(err) {
      return cb(err);
    }

    cb(null, path.join(dir, name));

  });

};

app.directoryPath = function(id, cb) {

  var dir = path.join(
    this.root,
    id.slice(0, 4),
    id.slice(4)
  );

  // ensure that the folder exists
  fs.exists(dir, function(exists) {

    if(exists) {
      return cb(null, dir);
    }

    mkdirp(dir, function(err) {

      if(err) {
        return cb(err);
      }

      cb(null, dir);

    });

  });

};

app.rmdir = function(id, cb) {

  this.directoryPath(id, function(err, dir) {

    if(err) {
      return cb(err);
    }

    rimraf(dir, function(err) {

      if(err) {
        return cb(err);
      }

      cb();

    });

  });

};

app.files = function(id, cb) {

  var reg = new RegExp(this.fileName);

  this.directoryPath(id, function(err, dir) {

    if(err) {
      return cb(err);
    }

    fs.readdir(dir, function(err, files) {

      if(err) {
        return cb(err);
      }

      var matched = [];

      for (var i = 0, l = files.length; i < l; i++) {

        if (reg.test(files[i]) === true) {
          matched.push(path.join(dir, files[i]));
        }

      }

      cb(null, matched);

    });

  });

};

app.stats = function(id, cb) {

  var total = 0,
      pageCount = 0;

  this.files(id, function(err, files) {

    if(err) {
      return cb(err);
    }

    pageCount = files.length;

    (function next() {

      var file = files.shift();

      if(! file) {
        return cb(null, {
          used: total,
          pageCount: pageCount
        });
      }

      fs.stat(file, function(err, st) {

        if(err) {
          return next();
        }

        total += st.size;

        next();

      });

    })();

  });

};
