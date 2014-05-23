/*
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var http = require('http');

var app = {};

/**** Expose PhantHttpServer ****/
exports = module.exports = app;

/**** instance of node's http server ****/
app.server = false;

/**** middleware list ****/
app.middleware = [];

/**
 * listen
 *
 * make a single instance of the http server
 * so it can be shared with every module that
 * requires a server
 */
app.listen = function() {

  if (this.server instanceof http.Server) {
    return this.server;
  }

  this.server = http.createServer(this.callback());

  return this.server.listen.apply(this.server, arguments);

};

/**
 * close
 *
 * stop the server and reset middleware
 */
app.close = function(callback) {

  var self = this;

  if (!(this.server instanceof http.Server)) {
    return;
  }

  this.server.close(function() {

    self.server = false;
    self.middleware = [];

    callback();

  });

};

/**
 * callback
 *
 * generates a callback based on all
 * registered middleware
 */
app.callback = function() {

  var middleware = this.middleware;

  return function(req, res) {

    var handler = this;

    middleware.forEach(function(callback) {
      callback.call(handler, req, res);
    });

  };

};

/**
 * use
 *
 * adds callback to the list of middleware
 * that will be called when the server sends
 * events
 */
app.use = function(fn) {

  this.middleware.push(fn);

  return this;

};
