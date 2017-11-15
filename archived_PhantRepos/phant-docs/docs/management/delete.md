---
layout: docs
title: Delete
docs: Management
order: 2
---

If you would like to completely remove a stream, visit the [delete form](https://data.sparkfun.com/streams/delete)
and fill in the form with your keys.  If you would like to clear all data from your stream without removing
the stream definition, visit the documentation on how to [clear a stream](/docs/management/clear).

## HTTP Request Examples

If you would like to make the delete request manually, you can make either a `HTTP GET` or `HTTP DELETE`
request. If your client supports it, you should always use the `HTTP DELETE` method to delete streams. Replace
`PUBLIC_KEY` and `DELETE_KEY` with the keys provided to you when you created the stream.

<div class="url">
  <span class="method GET">GET</span>
  http://data.sparkfun.com/streams/PUBLIC_KEY/delete/DELETE_KEY
</div>

{% highlight bash %}
curl -X GET 'http://data.sparkfun.com/streams/PUBLIC_KEY/delete/DELETE_KEY'
{% endhighlight %}

When making a `HTTP DELETE` request, you should send your `DELETE_KEY` using the `Phant-Delete-Key` request header.

<div class="url">
  <span class="method DELETE">DELETE</span>
  http://data.sparkfun.com/streams/PUBLIC_KEY
</div>

{% highlight bash %}
curl -X DELETE 'http://data.sparkfun.com/streams/PUBLIC_KEY' \
  -H 'Phant-Delete-Key: DELETE_KEY'
{% endhighlight %}
