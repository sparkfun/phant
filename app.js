var Phant = require('./lib/phant'),
    manager = require('phant-manager-http'),
    keychain = require('phant-keychain-hex'),
    storage = require('phant-storage-mongodb'),
    app = Phant();

var keys = keychain({
  publicSalt: process.env.PUBLIC_SALT || 'public salt',
  privateSalt: process.env.PRIVATE_SALT || 'private salt'
});

var mongo = storage({
  url: process.env.MONGO_URL || 'mongodb://localhost/phant',
  cap: process.env.CAP || false
});

app.registerManager(
  manager({
    storage: mongo,
    keychain: keys,
    port: process.env.PORT || 3000
  })
);

exports = module.exports = app;
