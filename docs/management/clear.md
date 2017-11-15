---
layout: docs
title: Clear
docs: Management
order: 2
---

If you would like to clear all logged data from a stream, use the [clear stream form](https://data.sparkfun.com/streams/clear)
and fill in the form with your public and private keys.  If you would like to completely remove your stream
including all stream metadata, please visit the documentation for [deleting a stream](/docs/management/delete).

## HTTP Request Examples

If you would like to make the clear request manually, you can make either a `HTTP GET` or `HTTP DELETE`
request. If your client supports it, you should always use the `HTTP DELETE` method to clear data.
Replace `PUBLIC_KEY` and `PRIVATE_KEY` with the keys provided to you when you created the stream.

<div class="url">
  <span class="method GET">GET</span>
  http://data.sparkfun.com/input/PUBLIC_KEY/clear?private_key=PRIVATE_KEY
</div>

{% highlight bash %}
curl -X GET 'http://data.sparkfun.com/input/PUBLIC_KEY/clear?private_key=PRIVATE_KEY'
{% endhighlight %}

When making a `HTTP DELETE` request, you should send your `PRIVATE_KEY` using the `Phant-Private-Key`
request header.

<div class="url">
  <span class="method DELETE">DELETE</span>
  http://data.sparkfun.com/input/PUBLIC_KEY
</div>

{% highlight bash %}
curl -X DELETE 'http://data.sparkfun.com/input/PUBLIC_KEY' \
  -H 'Phant-Private-Key: PRIVATE_KEY'
{% endhighlight %}
