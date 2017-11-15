---
layout: docs
title: HTTP
docs: Output
order: 1
---

To retrieve your data, you will only need your `PUBLIC_KEY`.  All data on [data.sparkfun.com](https://data.sparkfun.com)
**should be considered publicly accessible**, but you can host your own [phant server](https://github.com/sparkfun/phant)
if you would like your data to be private.

## Data Formats
Data is currently available in `CSV`, `JSON`, and `JSONP` formats, but more formats will be available soon.  If you
would like to see a specific output format supported, [submit an issue on GitHub](https://github.com/sparkfun/phant/issues),
and we will try to make it available.

## Paging
By default, [data.sparkfun.com](https://data.sparkfun.com) returns all of your logged data in the format you requested.
If there is a need, you can also request output in 250 kilobyte chunks by setting the `page` parameter in the
[query string](http://en.wikipedia.org/wiki/Query_string) portion of the URL.  This can be very helpful if you just
want to check out the latest logged data without requesting the entire data set.

## HTTP Request Examples
Data can be retrieved by using your `PUBLIC_KEY` to make a `HTTP GET` request for the `FORMAT` you would like
returned by the server.  Data will be returned in **reverse chronological order**.

<div class="url">
  <span class="method GET">GET</span>
  http://data.sparkfun.com/output/PUBLIC_KEY.FORMAT
</div>

{% highlight bash %}
curl -X GET 'http://data.sparkfun.com/output/PUBLIC_KEY.json'
{% endhighlight %}

**Example** Retrieve the first page of data in CSV format:

<div class="url">
  <span class="method GET">GET</span>
  http://data.sparkfun.com/output/PUBLIC_KEY.FORMAT?page=PAGE_NUMBER
</div>

{% highlight bash %}
curl -X GET 'http://data.sparkfun.com/output/PUBLIC_KEY.csv?page=1'
{% endhighlight %}

The CSV response would look like this:
{% highlight text %}
humidity,temp,timestamp
2,3,2014-06-25T21:35:29.827Z
86%,91.4,2014-06-25T21:10:08.112Z
86%,91.4,2014-06-25T20:40:56.425Z
{% endhighlight %}

## Filters
Filters can be added to the output query string using the following format: `FILTER[FIELD]=VALUE`.

* `FILTER` - the short name of the filter you would like to use. i.e. `gte`
* `FIELD` - the name of one of the fields you defined (or the auto generated timestamp field). i.e. `temperature`
* `VALUE` - the value used to compare against the values of the field you specified.  The value is used in different ways
by each filter, so check the documentation for the filter you are using in order to find acceptable values.

### [Grep](http://en.wikipedia.org/wiki/Grep) for value (grep)

```
?grep[FIELD]=VALUE
```

The `VALUE` can be any valid Javascript regex pattern.

```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?grep[humidity]=2952$
```
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?grep[wood]=^bl
```

### Equal to value (eq)

```
?eq[FIELD]=VALUE
```

The `VALUE` can be any string or number. Numbers will be parsed as floats for comparison.

```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?eq[temp]=98.6
```
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?eq[name]=black%20walnut
```

### Not equal to value (ne)

```
?ne[FIELD]=VALUE
```

The `VALUE` can be any string or number. Numbers will be parsed as floats for comparison.

```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?ne[temp]=98.6
```

### Greater than value (gt)

```
?gt[FIELD]=VALUE
```

The `VALUE` can be any number or in the case of the timestamp field,
any [date.js](http://www.datejs.com/) compatible string. Numbers will be
parsed as floats for comparison.

Temp greater than 100:
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?gt[temp]=100.0
```

Get the last day of logged values:
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?gt[timestamp]=now%20-1day
```

### Less than value (lt)

```
?lt[FIELD]=VALUE
```

The `VALUE` can be any number or in the case of the timestamp field,
any [date.js](http://www.datejs.com/) compatible string. Numbers will be
parsed as floats for comparison.

Temp less than 80:
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?lt[temp]=80.0
```

Get the logged values older than 11/30/2014:
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?lt[timestamp]=11-30-2014
```

### Greater than value (gte)

```
?gte[FIELD]=VALUE
```

The `VALUE` can be any number or in the case of the timestamp field,
any [date.js](http://www.datejs.com/) compatible string. Numbers will be
parsed as floats for comparison.

Temp greater than or equal to 100:
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?gte[temp]=100.0
```

Get the logged values from 11/30/2014 or newer:
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?gte[timestamp]=12-02-2014
```

### Less than or equal to value (lte)

```
?lte[FIELD]=VALUE
```

The `VALUE` can be any number or in the case of the timestamp field,
any [date.js](http://www.datejs.com/) compatible string. Numbers will be
parsed as floats for comparison.

Temp less than or equal to 80:
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?lte[temp]=80.0
```

Get the logged values from 11/30/2014 or older:
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?lte[timestamp]=11-30-2014
```

###Combining Filters

You can combine as many filters as you would like using standard query string syntax.


Get the logged values from 11/30/2014 or older with a temp greater than or equal to 100:
```
https://data.sparkfun.com/output/xROQyrNEMoU6xQA2wro1?lte[timestamp]=11-30-2014&gte[temp]=100.0
```



## Output Formats

### JSONP Output
If you are using JavaScript in a web browser to retrieve data, then you might be interested in using the
[JSONP](http://en.wikipedia.org/wiki/JSONP) format.  JSONP allows you to make to requests from a server
from a different domain, which is normally not possible because of the
[same-origin policy](http://en.wikipedia.org/wiki/Same-origin_policy).

Unlike all of the other methods, JSONP responses will always be sent with the `HTTP 200` success code.  We respond
this way for the JSONP format because browsers will not parse the response body when the server replies with a HTTP error code.

**Example** Retrieve the first page of data in JSONP format with [jQuery](http://jquery.com):

{% highlight js %}
var public_key = 'YOUR_PUBLIC_KEY';
 $.ajax({
   url: 'http://data.sparkfun.com/output/' + public_key + '.json',
   jsonp: 'callback',
   cache: true,
   dataType: 'jsonp',
   data: {
     page: 1
   },
   success: function(response) {
     // response will be a javascript
     // array of objects
     console.log(response);
   }
 });
{% endhighlight %}

The JSONP response to this request would look like this:
{% highlight js %}
typeof handler === 'function' && handler([{"humidity":"2","temp":"3","timestamp":"2014-06-25T21:35:29.827Z"},{"humidity":"86%","temp":"91.4","timestamp":"2014-06-25T21:10:08.112Z"},{"humidity":"86%","temp":"91.4","timestamp":"2014-06-25T20:40:56.425Z"}]);
{% endhighlight %}

