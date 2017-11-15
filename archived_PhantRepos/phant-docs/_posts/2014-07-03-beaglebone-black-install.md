---
layout: post
title:  "Installing Phant on a BeagleBone Black"
date:   2014-07-03 09:39:00
categories: beaglebone install
---

This tutorial will help you get phant up and running on a
[Beaglebone Black Rev C](https://www.sparkfun.com/products/12857).

<div style="text-align: center;">
  <a href="https://www.sparkfun.com/products/12857">
    <img src="https://cdn.sparkfun.com//assets/parts/9/7/2/3/12076-01.jpg" width="400px">
  </a>
</div>

**Table of Contents**

* toc
{:toc}

## Hardware

The wish list below containing the list of hardware used in this tutorial.

<script src="https://www.sparkfun.com/wish_lists/90573.js"></script>

## Getting Started

Connecting the BeagleBone Black to your local network is fairly straightforward.  You will need
to provide it with power and connect it to your router with a ethernet cable.

<div style="text-align: center;">
  <img src="/img/posts/beaglebone/connections.jpg" width="600px">
</div>

## Connecting via SSH

Once you have the power and ethernet cables connected, you can connect to your BeagleBone from a
computer on the same network via [SSH](http://en.wikipedia.org/wiki/Secure_Shell).  If you are using
Mac OSX or a Linux Distro, then you should already have a SSH client installed.  If you are running
Windows, then your best bet is to install the [PuTTY](http://www.putty.org/) SSH client.

To connect to your BeagleBone, you need to run `ssh root@beaglebone.local` from a terminal.

{% highlight bash %}
$ ssh root@beaglebone.local
 The authenticity of host 'beaglebone.local (10.0.1.10)' cannot be established.
 RSA key fingerprint is 19:f8:35:4a:fe:f3:fd:d2:46:3f:ed:d8:6a:05:e1:16.
 Are you sure you want to continue connecting (yes/no)? yes
 Warning: Permanently added 'beaglebone.local' (RSA) to the list of known hosts.
 Debian GNU/Linux 7
 
 BeagleBoard.org BeagleBone Debian Image 2014-04-23
 
 Support/FAQ: http://elinux.org/Beagleboard:BeagleBoneBlack_Debian
 Last login: Thu Jul  3 14:34:16 2014 from todd.local
 root@beaglebone:~#
{% endhighlight %}

If you see the prompt `root@beaglebone:~#`, then you have connected successfully.

## Stopping Apache

The [Beaglebone Black Rev C](https://www.sparkfun.com/products/12857) comes with the [Debian Wheezy](https://wiki.debian.org/DebianWheezy)
Linux distribution pre-installed.  By default, there is an instance of the
[Apache HTTP Server](http://en.wikipedia.org/wiki/Apache_HTTP_Server) running on the ports phant uses, so we need
to stop Apache.

You can stop Apache by running `service apache2 stop` from the SSH prompt.
{% highlight bash %}
root@beaglebone:~# service apache2 stop
 [ ok ] Stopping apache2 (via systemctl): apache2.service.
{% endhighlight %}

## Installing Phant
Phant is a [node.js](http://nodejs.org/) application that is distributed via [npm](https://www.npmjs.org/). Luckily,
both node.js and npm are part of the default BeagleBone Black install, so we can use `npm` to install the required packages.

Install the `phant` package via npm.

{% highlight bash %}
root@beaglebone:~# npm install -g phant
 npm http GET https://registry.npmjs.org/phant
 npm http 304 https://registry.npmjs.org/phant
 ...etc
{% endhighlight %}

## Starting Phant
Now that you have the required packages installed, you can start the phant server by running `phant` from the SSH prompt.

{% highlight bash %}
root@beaglebone:~# phant
 phant http server running on port 8080
 phant telnet server running on port 8081
{% endhighlight %}

You can now browse to [http://beaglebone.local:8080/](http://beaglebone.local:8080/), and you should see
*phant is ready and listening for input.* in your web browser.

## Creating a Test Stream
By default, the web stream management user interface (like the one [data.sparkfun.com](https://data.sparkfun.com) uses)
is disabled.  It is not included by default because it can become a resource hog on boards like the BeagleBone Black.

Instead, data stream management can all be done via a [telnet](http://en.wikipedia.org/wiki/Telnet) client. If you are using
Mac OSX or a Linux Distro, then you should already have a telnet client installed.  If you are running
Windows, then you can use [PuTTY](http://www.putty.org/) as your telnet client.  You can connect to your phant
server over telnet by running `telnet beaglebone.local 8081`.

{% highlight text %}
$ telnet beaglebone.local 8081
 Trying 10.0.1.10...
 Connected to beaglebone.local.
 Escape character is '^]'.
            .-.._
      __  /`     '.
   .-'  `/   (   a \
  /      (    \,_   \
 /|       '---` |\ =|
 ` \    /__.-/  /  | |
   |  / / \ \  \   \_\  jgs
   |__|_|  |_|__\
  welcome to phant.
 
 Type 'help' for a list of available commands
 
 phant>
{% endhighlight %}

If you see a `phant>` prompt, then you have successfully connected to the telnet stream manager.  You can now type `create`
and follow the prompts to create your first data stream.

{% highlight text %}
phant> create
 Enter a title> Test
 Enter a description> Testing BeagleBone Black.
 Enter fields (comma separated)> test
 Enter tags (comma separated)> test
 
 Stream created!
 PUBLIC KEY: aAYVpdNaOeu6rQ80Ogeau2vxDKq
 PRIVATE KEY:  PW4OPY5B6Ztjd5wD6zOXuY4BD2L
 DELETE KEY:  lAEwmPboWZuBqa10LQ9wcyz9qn8
 
 If you need help getting started, visit http://phant.io/docs.
 phant> quit
 Connection closed by foreign host.
{% endhighlight %}

After responding to all of the prompts, you should be given a unique `PUBLIC KEY`, `PRIVATE KEY`, and `DELETE KEY`. **Write these down.**
You will not be able to retrieve them.

## Logging Data To Your Stream
Now that you have your keys, you can try logging to your stream by pasting the following URL into your web browser. Replace the `PUBLIC_KEY` and `PRIVATE_KEY` with the keys
given to you during the stream creation process.

{% highlight text %}
http://beaglebone.local:8080/input/PUBLIC_KEY?private_key=PRIVATE_KEY&test=testvalue
{% endhighlight %}

If everything worked, you should see `1 success`. If something went wrong, you would see a `0` followed by an error message.

## Retrieving Data From Your Stream
Once you have successfully logged data, you can make a HTTP request to retrieve it. Data is currently available
in [CSV](http://en.wikipedia.org/wiki/Comma-separated_values) and [JSON](http://en.wikipedia.org/wiki/JSON) formats.
You can retrieve to your stream data by pasting the following URL into your web browser. Replace the `PUBLIC_KEY` with the key
given to you during the stream creation process.

**Example** CSV output
{% highlight text %}
http://beaglebone.local:8080/output/PUBLIC_KEY.csv
{% endhighlight %}

**Example** JSON output
{% highlight text %}
http://beaglebone.local:8080/output/PUBLIC_KEY.json
{% endhighlight %}

## Keeping Phant Running
You may have noticed that phant will stop running if you end your SSH connection to the BeagleBone.  You can get around
this by installing the `forever` npm module.

{% highlight bash %}
root@beaglebone:~# npm install -g forever
 npm http GET https://registry.npmjs.org/forever
 npm http 304 https://registry.npmjs.org/forever
 ...etc
{% endhighlight %}

You can now start phant using `forever`.
{% highlight bash %}
root@beaglebone:~# forever start /usr/local/bin/phant
 warn:    --minUptime not set. Defaulting to: 1000ms
 warn:    --spinSleepTime not set. Your script will exit if it does not stay up for at least 1000ms
 info:    Forever processing file: /usr/local/bin/phant
{% endhighlight %}

Phant will now continue running after disconnecting from the SSH session.

## Final Thoughts
You can read more about how to interact with phant by visiting [phant.io/docs](/docs). If you spot any errors, or have any issues,
let us know in the comment section below.
