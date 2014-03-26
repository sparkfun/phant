var Phant = require('./lib/phant'),
    dotenv = require('dotenv').load(),
    path = require('path'),
    httpServer = require('phant-http-server'),
    HttpInput = require('phant-input-http'),
    HttpOutput = require('phant-output-http'),
    keychain = require('phant-keychain-hex'),
    storage = require('phant-storage-json'),
    app = Phant();

var keys = keychain({
  publicSalt: process.env.PUBLIC_SALT || 'public salt',
  privateSalt: process.env.PRIVATE_SALT || 'private salt'
});

var json = storage({
  directory: path.join(__dirname, 'tmp')
});

var httpOutput = HttpOutput({
  storage: json,
  keychain: keys
});

var httpInput = HttpInput({
  metadata: json,
  keychain: keys
});

// start listening for connections
httpServer.listen(process.env.PORT || 8080);

// attach input to http server
httpServer.use(httpInput);

// attach output to http server
httpServer.use(httpOutput);

// register input with phant
app.registerInput(httpInput);

app.registerOutput(json);
app.registerOutput(httpOutput);

exports = module.exports = app;
