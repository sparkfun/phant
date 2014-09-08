/**
 * phant
 * https://github.com/sparkfun/phant
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var events = require('events'),
  bunyan = require('bunyan'),
  util = require('util');

/**** Make Phant an event emitter ****/
util.inherits(Phant, events.EventEmitter);

/**** Phant prototype ****/
var proto = Phant.prototype;

/**** Expose Phant ****/
exports = module.exports = Phant;

/**** Expose Submodules ****/
Phant.HttpServer = require('./lib/http_server');
Phant.HttpsServer = require('./lib/https_server');
Phant.HttpInput = require('./lib/http_input');
Phant.HttpOutput = require('./lib/http_output');
Phant.Validator = require('./lib/validator');
Phant.TelnetManager = require('./lib/telnet_manager');
Phant.MemoryThrottler = require('./lib/memory_throttler');
Phant.AtomStream = require('./lib/atom_stream');
Phant.FieldStream = require('./lib/field_stream');
Phant.LimitStream = require('./lib/limit_stream');
Phant.SampleStream = require('./lib/sample_stream');

/**** Phant constructor ****/
function Phant(config) {

  if (!(this instanceof Phant)) {
    return new Phant(config);
  }

  events.EventEmitter.call(this);

  config = config || {};

  if (!config.metadata) {
    this.log.fatal('You must specify a phant metadata module in the config');
    return process.exit(1);
  }

  if (!config.keychain) {
    this.log.fatal('You must specify a phant keychain module in the config');
    return process.exit(1);
  }

  this.metadata = config.metadata;
  this.validator = Phant.Validator({
    metadata: this.metadata
  });

  if (Array.isArray(config.managers)) {
    config.managers.forEach(this.registerManager.bind(this));
  }

  if (Array.isArray(config.inputs)) {
    config.inputs.forEach(this.registerInput.bind(this));
  }

  if (Array.isArray(config.outputs)) {
    config.outputs.forEach(this.registerOutput.bind(this));
  }

}

proto.metadata = false;
proto.validator = false;
proto.log = bunyan.createLogger({
  name: 'phant',
  streams: [{
    stream: process.stdout,
    level: 'trace'
  }, {
    stream: process.stdout,
    level: 'debug'
  }, {
    stream: process.stdout,
    level: 'info'
  }, {
    stream: process.stderr,
    level: 'warn'
  }, {
    stream: process.stderr,
    level: 'error'
  }, {
    stream: process.stderr,
    level: 'fatal'
  }]
});

/**
 * registerManager
 *
 * adds a new manager to the list of managers
 */
proto.registerManager = function(manager) {

  manager.log = this.log.child({
    module: manager.moduleName
  });
  manager.metadata = this.metadata;
  manager.validator = this.validator;
  manager.keychain = this.keychain;

  manager.on('error', manager.log.error);

  // listen for clear events and tell the outputs
  // to wipe data if they are storing it
  manager.on('clear', this.clearStream.bind(this));

  // push to list of managers
  this.managers.push(manager);

};

/**
 * registerInput
 *
 * adds a new input to the list of
 * inputs, and listens for data and
 * errors.
 */
proto.registerInput = function(input) {

  input.log = this.log.child({
    module: input.moduleName
  });
  input.validator = this.validator;
  input.keychain = this.keychain;

  // pipe errors to input logger
  input.on('error', input.log.error);

  // listen for data, and pipe it to outputs
  input.on('data', this.dataReceived.bind(this));

  // listen for clear events and tell the outputs
  // to wipe data if they are storing it
  input.on('clear', this.clearStream.bind(this));

  // push to list of inputs
  this.inputs.push(input);

};

/**
 * registerOutput
 *
 * adds a new output to the list of
 * outputs, and listens for output errors.
 */
proto.registerOutput = function(output) {

  output.log = this.log.child({
    module: output.moduleName
  });
  output.validator = this.validator;
  output.keychain = this.keychain;
  output.metadata = this.metadata;

  // pipe errors to output logger
  output.on('error', output.log.error);

  // push to list of outputs
  this.outputs.push(output);

};

/**
 * dataReceived
 *
 * send data to all registered outputs
 */
proto.dataReceived = function(id, data) {

  // loop through all outputs and give
  // them the new data.
  this.outputs.forEach(function(output) {
    output.write(id, data);
  });

  // let the metadata module know data was received
  // so it can update the last_push timestamp
  this.metadata.touch(id);

};

/**
 * clearStream
 *
 * wipe the data from all persistent stores
 */
proto.clearStream = function(id) {

  // loop through all outputs and give
  // them the new data.
  this.outputs.forEach(function(output) {
    output.clear(id);
  });

};
