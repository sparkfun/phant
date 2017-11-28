# phant [![Build Status](https://secure.travis-ci.org/sparkfun/phant.svg?branch=master)](http://travis-ci.org/sparkfun/phant)

### Phant is No Longer in Operation

Unfortunately Phant, our data-streaming service, is no longer in service
and has been discontinued. The system has reached capacity and, like a less-adventurous Cassini,
has plunged conclusively into a fiery and permanent retirement. There are several 
other maker-friendly, data-streaming services and/or IoT platforms available 
as alternatives. The three we recommend are Blynk, ThingSpeak, and Cayenne. 
You can read our [blog post on the topic](https://www.sparkfun.com/news/2413)
for an overview and helpful links for each platform.

All secondary SparkFun repositories related to Phant have been [archived](https://github.com/blog/2460-archiving-repositories)
and pulled in as a subtree in the main [Phant GitHub repository](https://github.com/sparkfun/phant/tree/master/archived_PhantRepos).

---

phant is a modular logging tool developed by [SparkFun Electronics](https://sparkfun.com) for collecting data from
the [Internet of Things](http://en.wikipedia.org/wiki/Internet_of_Things).  phant is the open source software that powers
[data.sparkfun.com](http://data.sparkfun.com).

If you would like to learn more about phant, please visit [phant.io](http://phant.io) for usage & API docs.

## Getting Started

### Vagrant

Vagrant is a headless virtual machine that can be run on many different systems.
Vagrant is a safe and easy way to run `phant` without the need to greatly
modify your current system
(see [Why Vagrant?](https://docs.vagrantup.com/v2/why-vagrant/)).

Vagrant Setup:

1. Install [VirtualBox](https://www.virtualbox.org/wiki/Downloads)
2. Install [Vagrant](http://www.vagrantup.com/downloads)
3. Install [Git](http://git-scm.com/downloads)
4. `git clone https://github.com/sparkfun/phant.git`
5. `cd phant && vagrant up --provision`
6. `phant` is now available via http on port 8080 and telnet via port 8081

To restart phant use `vagrant provision` from inside the `phant` directory.

To stop the vagrant virtual machine use `vagrant halt` from inside the
`phant` directory.

To restart vagrant use `vagrant up --provision` from inside the `phant`
directory.

### Local

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
