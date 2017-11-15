/*
 * phant
 * https://github.com/sparkfun/phant-server-mqtt
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var mosca = require('mosca');

/**** instance of mosca server ****/
exports.server = false;

/**
 * create
 *
 * make a single instance of the mosca server
 * so it can be shared with every module that
 * requires it
 */
exports.create = function(config) {

  if (this.server instanceof mosca.Server) {
    return this.server;
  }

  config = config || {
    port: 1883
  };

  this.server = new mosca.Server(config);

  return this.server;

};
