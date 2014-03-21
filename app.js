var Phant = require('./lib/phant'),
    dotenv = require('dotenv').load(),
    httpServer = require('phant-http-server'),
    HttpInput = require('phant-input-http'),
    HttpManager = require('phant-manager-http'),
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

var httpInput = HttpInput({
  metadata: mongo,
  keychain: keys
});

var httpManager = HttpManager({
  storage: mongo,
  keychain: keys
});

// start listening for connections
httpServer.listen(process.env.PORT || 5000);

// attach input to http server
httpServer.use(httpInput);

// register input with phant
app.registerInput(httpInput);

// attach input to http server
httpServer.use(httpManager);

// register manager with phant
app.registerManager(httpManager);

exports = module.exports = app;
