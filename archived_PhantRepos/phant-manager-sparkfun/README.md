# phant-manager-sparkfun

the fork of [phant-manager-http](https://github.com/sparkfun/phant-manager-sparkfun) that is currently hosted at [data.sparkfun.com](http://data.sparkfun.com).

<<<<<<< HEAD
## Setting up a dev environment

    $ node -v
    v0.10.26
    $ npm install -g grunt-cli
    $ git clone git@github.com:sparkfun/phant-manager-sparkfun.git
    $ cd phant-manager-sparkfun
    $ git remote add upstream git@github.com:sparkfun/phant-manager-http.git
    $ npm install
    $ grunt dev
=======
## Using phant-manager-http with phant
This section outlines how to quickly get this package up and running with the **phant** module.

### Configure

* open: https://data.sparkfun.com/config
* under **Add Manager** select **HTTP**. This will add a new section below called **Manager - HTTP**
* modify any other settings you desire. Likely this is OK as-is to get started
* select **Download Package**. Avoid **Publish to NPM** unless you know what you are doing.
* unpack the downloaded package

### Install

* go to the package you downloaded: `cd phantconfig-custom`.
* do: `npm install`

### Run
This example assumes you configured the module to use port `8080`. If you have changed the HTTP port, replace `8080` with the port you chose.

* do: `npm start`
* open: http://localhost:8080/
>>>>>>> 5fa71244e5621e0335dc944c451b822cb9312ba3

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2014 SparkFun Electronics. Licensed under the GPL v3 license.
