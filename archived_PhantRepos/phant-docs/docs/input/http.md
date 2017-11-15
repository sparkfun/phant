---
layout: docs
title: HTTP
docs: Input
order: 1
---

To log data, you will need your list of field names, your `PUBLIC_KEY`, and your `PRIVATE_KEY`.  You can use
one of the [phant libraries](/libraries) to log data, or you can make a HTTP request using any web client.  We will
soon be releasing info about how to log data via TCP & UDP, but for now only HTTP based input is available.

## Data Types
All data is logged as a string, so anything that can be converted to a UTF-8 compatible string can be logged.  There
is no length limit to field data, but each request is currently limited to 50 kilobytes.

## HTTP Request Examples
You can make either a `HTTP GET` or `HTTP POST` request to log data, but when possible you should use `HTTP POST`.
We will be using `temp` and `humidity` as the field names in the following examples, but you should replace them
with the names of the fields you entered when creating your data stream. Replace `PUBLIC_KEY` and `DELETE_KEY`
with the keys provided to you when you created the stream.  You should make sure that you
[URL encode](http://en.wikipedia.org/wiki/Percent-encoding) your data before sending it.  When your data is logged,
a `timestamp` field is automatically added to each row with the current server time in
[ISO-8601 extended format](http://en.wikipedia.org/wiki/ISO_8601).

<div class="url">
  <span class="method GET">GET</span>
  http://data.sparkfun.com/input/PUBLIC_KEY?private_key=PRIVATE_KEY&FIELD1=VALUE1&=FIELD2=VALUE2
</div>

{% highlight bash %}
curl -X GET 'http://data.sparkfun.com/input/PUBLIC_KEY?private_key=PRIVATE_KEY&temp=91.4&humidity=86%25'
{% endhighlight %}

When making a `HTTP POST` request, you should send your `PRIVATE_KEY` using the `Phant-Private-Key` request header.

<div class="url">
  <span class="method POST">POST</span>
  http://data.sparkfun.com/input/PUBLIC_KEY
</div>

{% highlight bash %}
curl -X POST 'http://data.sparkfun.com/input/PUBLIC_KEY' \
  -H 'Phant-Private-Key: PRIVATE_KEY' \
  -d 'temp=91.4&humidity=86%25'
{% endhighlight %}

### Plain Text Response Examples

Currently, responses are sent back in plain text format by default.  The first character of the text response
will always be a `0` or a `1`, and the second character will always be a space. If the server responds with a `0`
as the first character, assume the request failed.  If the server responds with a `1` as the first character, you
can assume the post succeeded. The success or error message will start with the third character, and in some cases
error messages can span multiple lines.

**Example** Text response body from a successful post:

    1 success

**Example** Text response body from failed post:

    0 temperature is not a valid field for this stream.

     expecting: humidity, temp

If your client doesn't separate the response headers from the body, the response from the server
would look like this:

    HTTP/1.1 400 Bad Request
     Content-Type: text/plain
     X-Rate-Limit-Limit: 100
     X-Rate-Limit-Remaining: 99
     X-Rate-Limit-Reset: 1403798400
     Date: Wed, 25 Jun 2014 20:41:53 GMT
     Connection: keep-alive
     Transfer-Encoding: chunked

     0 temperature is not a valid field for this stream.

     expecting: humidity, temp

### JSON Response Examples

If you are using a client that can parse [JSON](http://en.wikipedia.org/wiki/JSON), you can make a
request that asks for the response to be returned in JSON format.  The simplest way to accomplish this
is to append `.json` to the public key in the URL.

<div class="url">
  <span class="method POST">POST</span>
  http://data.sparkfun.com/input/PUBLIC_KEY.json
</div>

**Example** JSON response body from a successful post:
{% highlight json %}
{"success":true,"message":"success"}
{% endhighlight %}

**Example** JSON response body from failed post:
{% highlight json %}
{"success":false,"message":"temperature is not a valid field for this stream. \n\nexpecting: humidity, temp"}
{% endhighlight %}

If your client doesn't separate the response headers from the body, the response from the server
would look like this:
{% highlight text %}
HTTP/1.1 400 Bad Request
 Content-Type: application/json
 X-Rate-Limit-Limit: 100
 X-Rate-Limit-Remaining: 99
 X-Rate-Limit-Reset: 1403798400
 Date: Wed, 25 Jun 2014 21:11:55 GMT
 Connection: keep-alive
 Transfer-Encoding: chunked

 {"success":false,"message":"temperature is not a valid field for this stream. \n\nexpecting: humidity, temp"}
{% endhighlight %}

### JSONP Response Examples

If you are using JavaScript in a web browser to log data, then you might be interested in using the
[JSONP](http://en.wikipedia.org/wiki/JSONP) format.  JSONP allows you to make to requests from a server
from a different domain, which is normally not possible because of the
[same-origin policy](http://en.wikipedia.org/wiki/Same-origin_policy).

Unlike all of the other methods, JSONP responses will always be sent with the `HTTP 200` success code.  We respond
this way for the JSONP format because browsers will not parse the response body when the server replies with a HTTP error code.

**Example** [jQuery](http://jquery.com) JSONP logging request

{% highlight js %}
var public_key = 'YOUR_PUBLIC_KEY';
 $.ajax({
   url: 'http://data.sparkfun.com/input/' + public_key + '.json',
   jsonp: 'callback',
   cache: true,
   dataType: 'jsonp',
   data: {
     temp: '91.4',
     humidity: '80%'
   },
   success: function(response) {
     console.log(response.message);
   }
 });
{% endhighlight %}

**Example** JSONP response body from a successful post:
{% highlight js %}
typeof handler === 'function' && handler({"success":true,"message":"success"});
{% endhighlight %}

**Example** JSONP response body from failed post:
{% highlight js %}
typeof handler === 'function' && handler({"success":false,"message":"humidity missing from sent data. \n\nexpecting: humidity, temp"});
{% endhighlight %}

If your client doesn't separate the response headers from the body, the response from the server
would look like this:
{% highlight text %}
HTTP/1.1 200 OK
 Content-Type: text/javascript
 X-Rate-Limit-Limit: 100
 X-Rate-Limit-Remaining: 99
 X-Rate-Limit-Reset: 1403798400
 Date: Wed, 25 Jun 2014 21:32:44 GMT
 Connection: keep-alive
 Transfer-Encoding: chunked

 typeof handler === 'function' && handler({"success":false,"message":"humidity missing from sent data. \n\nexpecting: humidity, temp"});
{% endhighlight %}

