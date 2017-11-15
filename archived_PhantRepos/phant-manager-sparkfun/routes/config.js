var npmSearch = require('npm-package-search'),
  npm = require('npm'),
  fs = require('fs'),
  mkdirp = require('mkdirp'),
  util = require('util'),
  async = require('async'),
  request = require('request'),
  exphbs = require('express-handlebars'),
  rimraf = require('rimraf'),
  archiver = require('archiver'),
  path = require('path');

var search = npmSearch(
  path.join('/tmp/npm.json'), {
    interval: 600 * 1000
  }
);

var handlebars = exphbs.create({
  layoutsDir: path.join(__dirname, '..', 'views', 'layouts'),
  partialsDir: path.join(__dirname, '..', 'views', 'partials'),
  defaultLayout: 'config',
  helpers: {
    variableName: function(name) {
      name = name.split('-').map(function(chunk) {
        return chunk.charAt(0).toUpperCase() + chunk.slice(1);
      });
      return name.join('');
    }
  }
}).engine;

var defaults = {
  'phant-input-http': {
    included: 'Phant.HttpInput',
    name: 'phant-input-http',
    phantConfig: {
      name: 'HTTP',
      http: true,
      options: [{
        "label": "Metadata",
        "name": "metadata",
        "default": "phant-meta-nedb",
        "type": "select",
        "require": "meta",
        "description": "The phant metadata module to use"
      }, {
        "label": "Keychain",
        "name": "keychain",
        "default": "phant-keychain-hex",
        "type": "select",
        "require": "keychain",
        "description": "The phant keychain module to use"
      }]
    }
  },
  'phant-output-http': {
    included: 'Phant.HttpOutput',
    name: 'phant-output-http',
    phantConfig: {
      name: 'HTTP',
      http: true,
      options: [{
        "label": "Storage",
        "name": "storage",
        "default": "phant-stream-csv",
        "type": "select",
        "require": "stream",
        "description": "The phant stream storage module to use"
      }, {
        "label": "Keychain",
        "name": "keychain",
        "default": "phant-keychain-hex",
        "type": "select",
        "require": "keychain",
        "description": "The phant keychain module to use"
      }]
    }
  },
  'phant-manager-telnet': {
    included: 'Phant.TelnetManager',
    name: 'phant-manager-telnet',
    phantConfig: {
      name: 'Telnet',
      options: [{
        "label": "Port",
        "name": "port",
        "default": "8081",
        "type": "number",
        "description": "The TCP port to listen on."
      }, {
        "label": "Metadata",
        "name": "metadata",
        "default": "phant-meta-nedb",
        "type": "select",
        "require": "meta",
        "description": "The phant metadata module to use"
      }, {
        "label": "Keychain",
        "name": "keychain",
        "default": "phant-keychain-hex",
        "type": "select",
        "require": "keychain",
        "description": "The phant keychain module to use"
      }]
    }
  }
};

npm.load();

/*exports.make = function(req, res) {

  var get = function(name) {

    return function(cb) {

      request.get('https://registry.npmjs.org/' + name + '/latest', function(err, response, body) {

        if (err) {
          return cb(err);
        }

        cb(null, JSON.parse(body));

      });

    };

  };

  var info = {};

  packages.forEach(function(p) {
    info[p.name] = get(p.name);
  });

  async.parallel(info, function(err, results) {

    res.render('config', {
      title: 'phant server configurator',
      err: err,
      packages: JSON.stringify(util._extend(defaults, results))
    });

  });

};*/

exports.check = function(req, res) {

  request.get('https://registry.npmjs.org/phantconfig-' + req.param('name'), function(err, response, body) {
    res.json({
      exists: response.statusCode === 200
    });
  });

};

/*exports.publishPackage = function(req, res) {

  var config = JSON.parse(req.param('config')),
    name = 'phantconfig-' + req.param('name');

  createPackage(name, config, function(err, folder) {

    if (err) {
      return res.json({
        success: false,
        message: err
      });
    }

    npm.publish(folder, function(err) {

      res.json({
        success: (err ? false : true),
        message: (err ? 'Publishing to npm failed.' : ''),
        name: name
      });

      tearDown(folder);

    });

  });

};*/

exports.downloadPackage = function(req, res) {

  var type = req.param('type'),
    config = JSON.parse(req.param('config')),
    archive;


  createPackage(null, config, function(err, folder) {

    if (type === 'zip') {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=phantconfig-custom.zip');
      archive = archiver('zip');
    } else {
      res.setHeader('Content-Type', 'application/x-gzip');
      res.setHeader('Content-Disposition', 'attachment; filename=phantconfig-custom.tar.gz');
      archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
          level: 1
        }
      });
    }

    archive.pipe(res);

    archive
      .append(fs.createReadStream(folder + '/index.js'), {
        name: 'index.js'
      })
      .append(fs.createReadStream(folder + '/package.json'), {
        name: 'package.json'
      })
      .append(fs.createReadStream(folder + '/README.md'), {
        name: 'README.md'
      })
      .finalize();


    res.on('close', function() {
      tearDown(folder);
    });

  });


};

function createPackage(name, config, callback) {

  var folder = path.join('/tmp', 'phantconfig', name || 'phantconfig-custom' + Date.now());

  var files = [{
    tpl: 'index.handlebars',
    out: 'index.js'
  }, {
    tpl: 'package.handlebars',
    out: 'package.json'
  }, {
    tpl: 'readme.handlebars',
    out: 'README.md'
  }];

  // add the package name to the config
  config.name = name || 'phantconfig-custom';
  config.download = (name ? false : true);

  setUp(folder, config, function(err) {

    if (err) {
      return callback(err);
    }

    async.each(files, function(file, cb) {

      // render the template
      handlebars(path.join(__dirname, '..', 'views', 'config', file.tpl), config, function(err, rendered) {

        if (err) {
          return cb('Generating the package failed.');
        }

        // write it to disk
        fs.writeFile(path.join(folder, file.out), rendered, function(err) {

          if (err) {
            return cb('Writing ' + file.out + ' to disk failed');
          }

          cb();

        });

      });

    }, function(err) {
      callback(err, folder);
    });

  });

}

function setUp(folder, config, callback) {

  config.packages = [];

  request.get('https://registry.npmjs.org/phant/latest', function(err, response, body) {

    if (err) {
      return callback('Phant version could not be retrieved.');
    }

    // add the latest version of phant
    config.packages.push(JSON.parse(body));

    // add most of the other modules
    config.packages = config.packages.concat(config.inputs, config.outputs, config.streams, config.managers);

    // push meta & keychain
    config.packages.push(config.meta, config.keychain);

    // filter out packages included with npm
    config.packages = config.packages.filter(function(p) {
      return !p.included;
    });

    mkdirp(folder, function(err) {

      if (err) {
        return callback('Temp folder creation failed');
      }

      callback();

    });

  });

}

function tearDown(folder) {
  rimraf(folder);
}
