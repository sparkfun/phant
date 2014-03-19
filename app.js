var Phant = require('./lib/phant'),
    manager = require('phant-manager-http'),
    keychain = require('phant-keychain-hex'),
    storage = require('phant-storage-mongodb'),
    app = Phant();

var keys = keychain({
  publicSalt: process.env.PUBLIC_SALT,
  privateSalt: process.env.PRIVATE_SALT
});

var mongo = storage({
  url: process.env.MONGOHQ_URL,
  cap: process.env.CAP
});

app.registerManager(
  manager({
    storage: mongo,
    keychain: keys,
    port: process.env.PORT
  })
);

exports = module.exports = app;
