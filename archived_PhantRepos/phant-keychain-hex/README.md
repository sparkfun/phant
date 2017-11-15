# phant-keychain-hex [![Build Status](https://secure.travis-ci.org/sparkfun/phant-keychain-hex.png?branch=master)](http://travis-ci.org/sparkfun/phant-keychain-hex)

hex id hash creation and validation module for phant

## Getting Started
Install the module with: `npm install phant-keychain-hex`

```javascript
var Keychain = require('phant-keychain-hex'),
    keys = Keychain({
      publicSalt: 'YOUR PUBLIC SALT',
      privateSalt: 'YOUR PRIVATE SALT',
      deleteSalt: 'YOUR DELETE SALT'
    });

// generate public, private, and delete keys
var id = '123abcdef321',
    pub = keys.publicKey(id), // ewY0EO7B45
    prv = keys.privateKey(id), // kPxgpEK91G
    del = keys.deleteKey(id); // PEr29DXa6N

// validation
console.log(keys.validatePrivateKey(pub, prv)); // true
console.log(keys.validateDeleteKey(pub, del)); // true

// getting the id from a hash
console.log(keys.getIdFromPublicKey(pub)); // 123abcdef321
console.log(keys.getIdFromPrivateKey(prv)); // 123abcdef321
console.log(keys.getIdFromDeleteKey(del)); // 123abcdef321
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2014 SparkFun Electronics. Licensed under the GPL v3 license.
