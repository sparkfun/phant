# phant-arduino

The goal of this library is to provide a simple interface for logging data to phant.
It should take any data type, convert it to a `String`, and build a url. This
library will not handle interaction with WiFi or ethernet shields, it's only purpose is
to make it easier for users to build phant compatible requests without worrying about data
types and string concatenation.

## Installation

**Linux & Mac:**
```bash
$ cd ~
$ git clone git@github.com:sparkfun/phant-arduino.git
$ ln -s ~/phant-arduino/Phant/ ~/Documents/Arduino/libraries/Phant
```

**Windows:** :cry:

## Usage

To create a new instance of the request builder, pass the server's `hostname`, your `public key`,
and your `private key` to the `Phant` constructor.

```
Phant phant("data.sparkfun.com", "VGb2Y1jD4VIxjX3x196z", "9YBaDk6yeMtNErDNq4YM");
```

To add data, you can make calls to `phant.add(key, value)`. The library will convert any value data type
to a string, so there is no need for conversion before sending data. For example, if you have a stream
with fields titled `wind`, `temp`, and `raining`, your code would add data to the request like this:

```
phant.add("wind", 12.0);
phant.add("temp", 70.1);
phant.add("raining", false);
```

To get the request string for adding data, you have two options `phant.url()` and `phant.post()`.
Both methods will clear the current request data after building and returning the current request. Unless
there is some compelling reason to do otherwise, you should always use `phant.post()` to get a
[HTTP POST](http://en.wikipedia.org/wiki/POST_(HTTP)) request string. `phant.url()` will return a URL that you
can use in your web browser to test data logging.

In this example `client` would be an instance of whatever ethernet library you are using:

```
client.println(phant.post());
```

To clear all of the data in your stream, you can use `phant.clear()` to get a `HTTP DELETE` request string. Clearing the
data will not delete the stream definition, it will only delete the logged data.

```
client.println(phant.clear());
```

If you would like to retrieve your logged data, `phant.get()` will return a [HTTP GET](http://en.wikipedia.org/wiki/GET_(HTTP))
request string that will cause the server to respond with your logged data in [CSV](http://en.wikipedia.org/wiki/Comma-separated_values)
format. Parsing CSV is outside of the scope of this library.

```
client.println(phant.get());
```

## Output Example

### Sketch

```ino
#include <Phant.h>

// Arduino example stream
// http://data.sparkfun.com/streams/VGb2Y1jD4VIxjX3x196z
// hostname, public key, private key
Phant phant("data.sparkfun.com", "VGb2Y1jD4VIxjX3x196z", "9YBaDk6yeMtNErDNq4YM");

void setup() {
  Serial.begin(9600);
}

void loop() {

  phant.add("val1", "url");
  phant.add("val2", 22);
  phant.add("val3", 0.1234);

  Serial.println("----TEST URL-----");
  Serial.println(phant.url());

  Serial.println();

  phant.add("val1", "post");
  phant.add("val2", false);
  phant.add("val3", 98.6);

  Serial.println("----HTTP POST----");
  Serial.println(phant.post());

  Serial.println();

  Serial.println("----HTTP GET----");
  Serial.println(phant.get());

  Serial.println("----HTTP DELETE----");
  Serial.println(phant.clear());

  delay(2000);

}
```

### Output

This example prints the following to the serial monitor:

```
----TEST URL-----
http://data.sparkfun.com/input/VGb2Y1jD4VIxjX3x196z.txt?private_key=9YBaDk6yeMtNErDNq4YM&val1=url&val2=22&val3=0.1234

----HTTP POST----
POST /input/VGb2Y1jD4VIxjX3x196z.txt HTTP/1.1
Host: data.sparkfun.com
Connection: close
Content-Type: application/x-www-form-urlencoded
Content-Length: 29

val1=post&val2=0&val3=98.6000

----HTTP GET----
GET /output/VGb2Y1jD4VIxjX3x196z.csv HTTP/1.1
Host: data.sparkfun.com
Connection: close

----HTTP DELETE----
DELETE /input/VGb2Y1jD4VIxjX3x196z/clear.txt HTTP/1.1
Host: data.sparkfun.com
Phant-Private-Key: 9YBaDk6yeMtNErDNq4YM
Connection: close
```
