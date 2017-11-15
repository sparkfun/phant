---
layout: docs
title: Stats
docs: Output
order: 2
---

If you would like to retrieve info about the current state of your stream, you can make a request to the stats endpoint.

The data returned will include:

* `pageCount` - The number of pages your data will span when paging your data during output.
* `remaining` - The number of bytes you have remaining before hitting your data cap.
* `used` - The number of bytes your stream is currently using.
* `cap` - The current cap setting for your stream in bytes.

## Data Formats
Stats are currently available in `CSV`, `JSON`, and `JSONP` formats, but more formats will be available soon.  If you
would like to see a specific stats output format supported, [submit an issue on GitHub](https://github.com/sparkfun/phant/issues),
and we will try to make it available.

## HTTP Request Examples
Data can be retrieved by using your `PUBLIC_KEY` to make a `HTTP GET` request for the `FORMAT` you would like
returned by the server.

<div class="url">
  <span class="method GET">GET</span>
  http://data.sparkfun.com/output/PUBLIC_KEY/stats.FORMAT
</div>

**Example** Retrieve the stats for a stream in JSON format:

{% highlight bash %}
curl -X GET 'http://data.sparkfun.com/output/PUBLIC_KEY/stats.json'
{% endhighlight %}

The JSON response would look like this:
{% highlight json %}
{
    "pageCount": 1,
    "remaining": 2147483551,
    "used": 97,
    "cap": 2147483648
  }
{% endhighlight %}

### JSONP Output
If you are using JavaScript in a web browser to retrieve stats, then you might be interested in using the
[JSONP](http://en.wikipedia.org/wiki/JSONP) format.  JSONP allows you to make to requests from a server
from a different domain, which is normally not possible because of the
[same-origin policy](http://en.wikipedia.org/wiki/Same-origin_policy).

Unlike all of the other methods, JSONP responses will always be sent with the `HTTP 200` success code.  We respond
this way for the JSONP format because browsers will not parse the response body when the server replies with a HTTP error code.

**Example** Retrieve the stats for a stream in JSONP format with [jQuery](http://jquery.com):

{% highlight js %}
var public_key = 'YOUR_PUBLIC_KEY';
 $.ajax({
   url: 'http://data.sparkfun.com/output/' + public_key + '/stats.json',
   jsonp: 'callback',
   cache: true,
   dataType: 'jsonp',
   success: function(response) {
     // response will be a javascript object
     // with the stats as properties
     console.log(response);
   }
 });
{% endhighlight %}

The JSONP response to this request would look like this:
{% highlight js %}
typeof handler === 'function' && handler({"pageCount":1,"remaining":2147483551,"used":97,"cap":2147483648});
{% endhighlight %}

