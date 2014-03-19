/*
 * phant cli
 * https://github.com/sparkfun/phant-manager-cli
 *
 * Copyright (c) 2014 SparkFun Electronics
 * Licensed under the GPL v3 license.
 */

'use strict';

/**** Module dependencies ****/
var prompt = require('prompt');

/**** Prompt schema ****/
var schema = {

  properties: {
    title: {
      description: 'Enter a feed title',
      type: 'string',
      message: 'You must enter a title',
      required: true
    },
    description: {
      description: 'Enter a description',
      type: 'string',
      message: 'You must enter a description',
      required: true
    },
    fields: {
      type: 'array',
      minItems: 1,
      maxItems: 30,
      required: true
    },
    tags: {
      type: 'array',
      maxItems: 30
    }
  }

};
