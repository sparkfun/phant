#!/usr/bin/env node

var dotenv = require('dotenv').load(),
    execSync = require('execSync'),
    Meta = require('phant-meta-mongodb'),
    fromCsv = require('csv-streamify');

var meta = Meta({
  url: process.env.PHANT_MONGO_URL || 'mongodb://localhost/phant'
});

meta.list(function(err, streams) {

  // no streams found
  if(err || ! streams.length) {
    console.log('No streams found');
    process.exit(1);
  }

  var result;

  console.log('moving ' + streams.length);

  for(var i = 0; i < streams.length; i++) {

    console.log(i + ' moving ' + streams[i].id);

    result = execSync.exec('./csvtomongo ' + streams[i].id);

    console.log(i + ' ' + result.stdout);

  }

  console.log('DONE.');
  process.exit();

}, {}, 0, 10000);
