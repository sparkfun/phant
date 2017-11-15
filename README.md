### SparkFun Phant Particle Library

A Phant library for the Particle Core and Photon.

About
-------------------

This is a firmware library SparkFun's Phant data storage/stream service, implemented on [data.sparkfun.com](https://data.sparkfun.com)

[![Phant logo](http://phant.io/img/phant.svg)](https://data.sparkfun.com)

Repository Contents
-------------------

* **/firmware** - Source files for the library (.cpp, .h).
* **/firmware/examples** - Example sketches for the library (.cpp). Run these from the Particle IDE. 
* **spark.json** - General library properties for the Particle library manager. 

Example Usage
-------------------

#### Create a Phant Stream

Visit [data.sparkfun.com](https://data.sparkfun.com) to create a Phant stream of your own. You'll be given public and private keys, don't lose them!

If you want to set up Phant on a server of your own, visit [phant.io](http://phant.io/).

#### Include & Constructor

Make sure you include "SparkFun-Spark-Phant/SparkFun-Spark-Phant.h":

	// Include the Phant library:
	#include "SparkFun-Spark-Phant/SparkFun-Spark-Phant.h":

Then create a Phant object, which requires a **server**, **public key** and **private key**:

	const char server[] = "data.sparkfun.com"; // Phant destination server
	const char publicKey[] = "DJjNowwjgxFR9ogvr45Q"; // Phant public key
	const char privateKey[] = "P4eKwGGek5tJVz9Ar84n"; // Phant private key
	Phant phant(server, publicKey, privateKey); // Create a Phant object
	
#### Adding Fields/Data

Before posting, update every field in the stream using the `add([field], [value])` function. The `[field]` variable will always be a String (or const char array), `[value]` can be just about any basic data type -- `int`, `byte`, `long`, `float`, `double`, `String`, `const char`, etc.

For example:

	phant.add("myByte", 127);
	phant.add("myInt", -42);
	phant.add("myString", "Hello, world");
	phant.add("myFloat", 3.1415);

#### POSTing

After you've phant.add()'ed, you can call `phant.post()` to create a Phant POST string. `phant.post()` returns a string, which you can send straight to a print function.

Most of the time, you'll want to send your `phant.post()` string straight out of a TCPClient print. For example:

	TCPClient client;
	if (client.connect(server, 80)) // Connect to the server
    {
        client.print(phant.post());
	}

After calling `phant.post()` all of the field/value parameters are erased. You'll need to make all of your phant.add() calls before calling post again.

Recommended Components
-------------------

* [Particle Photon](https://www.sparkfun.com/products/13345)
* A [Photon Shield](https://www.sparkfun.com/categories/278) or [sensor](https://www.sparkfun.com/categories/23) to interface with your Photon and post data to Phant.

License Information
-------------------

This product is _**open source**_! 

Please review the LICENSE.md file for license information. 

If you have any questions or concerns on licensing, please contact techsupport@sparkfun.com.

Distributed as-is; no warranty is given.

- Your friends at SparkFun.