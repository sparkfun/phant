# phant [![Build Status](https://secure.travis-ci.org/sparkfun/phant.svg?branch=master)](http://travis-ci.org/sparkfun/phant)

phant is a modular logging tool developed by [SparkFun Electronics](https://sparkfun.com) for collecting data from
the [Internet of Things](http://en.wikipedia.org/wiki/Internet_of_Things).  phant is the open source software that powers
[data.sparkfun.com](http://data.sparkfun.com).

If you would like to learn more about phant, please visit [phant.io](http://phant.io) for usage & API docs.

## Getting Started

phant is a [npm](https://www.npmjs.org) package, and requires the latest version of [node.js](http://nodejs.org).

Once you have node.js installed, you can install phant by running `npm install -g phant` from your favorite terminal.
Using the `-g` (global) flag will make the `phant` executable available in your `PATH`.

Now you can start phant:

```bash
$ phant
phant http server running on port 8080
phant telnet server running on port 8081
```

This launches a [telnet](http://en.wikipedia.org/wiki/Telnet) server for stream creation, and a http server for data input & output.
You can now open a separate window, and you should be able to create a stream by connecting to the local telnet server.

```
$ telnet localhost 8081
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
            .-.._
      __  /`     '.
   .-'  `/   (   a \
  /      (    \,_   \
 /|       '---` |\ =|
` \    /__.-/  /  | |
   |  / / \ \  \   \_\  jgs
   |__|_|  |_|__\
   never   forget.

Welcome to phant!
Type 'help' for a list of available commands

phant>
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2014 SparkFun Electronics. Licensed under the GPL v3 license.
