---
layout: post
title:  "Graphing Live Data With Google Charts"
date:   2014-07-07 12:39:00
categories: graphing google
---

There are plenty of services and JavaScript libraries that will allow you to graph your logged data. So
instead of trying to reinvent one of those services on [data.sparkfun.com](https://data.sparkfun.com), 
we'll show you how to connect existing services and libraries to your data streams.
In this tutorial, we will help you graph live data from [data.sparkfun.com](https://data.sparkfun.com)
using the [Google Charts](https://developers.google.com/chart/) JavaScript library.

**Table of Contents**

* toc
{:toc}

## Getting Started
This tutorial assumes you already have pushed data to a stream on [data.sparkfun.com](https://data.sparkfun.com),
and that you know the `public key` to your stream.  If you need help posting data to a stream, check out
[the usage docs](/docs) for more info.

We are going to use [this weather station stream](https://data.sparkfun.com/streams/dZ4EVmE8yGCRGx5XRX1W) in this
tutorial, but you can replace the fields and public key with the appropriate info from your stream.

## Example Chart
Here is a live demo of the line chart we will be making.  You can use any of the types of charts in the
[example gallery](https://google-developers.appspot.com/chart/interactive/docs/gallery), but we will only
be using the line chart during this tutorial.  Due to the size of streams, we will only be requesting the
first page of data.  This will allow us to graph the most recent data without having to wait for megabytes of
JSON to load.

<div id="chart" style="width: 100%"></div>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="https://www.google.com/jsapi"></script>
<script>

function drawChart() {

  var jsonData = $.ajax({
    url: 'https://data.sparkfun.com/output/dZ4EVmE8yGCRGx5XRX1W.json',
    data: {page: 1},
    dataType: 'jsonp',
  }).done(function (results) {

    var data = new google.visualization.DataTable();

    data.addColumn('datetime', 'Time');
    data.addColumn('number', 'Temp');
    data.addColumn('number', 'Wind Speed MPH');

    $.each(results, function (i, v) {
      data.addRow([
        (new Date(v.timestamp)),
        parseFloat(v.tempf),
        parseFloat(v.windspeedmph)
      ]);
    });

    var chart = new google.visualization.LineChart($('#chart').get(0));

    chart.draw(data, {
      title: 'Wimp Weather Station'
    });

  });

}

google.load('visualization', '1', {
  packages: ['corechart']
});
google.setOnLoadCallback(drawChart);

</script>

## Loading Google Charts
Google Charts needs to be loaded before it can be used. In order to ensure we create the chart after the library is
loaded, we need to create a callback for the loader to call after it has finished loading. In this example, we
will call our callback `drawChart`.

**Example** Load Google Charts, and call drawChart once the library is loaded

{% highlight js %}

// onload callback
function drawChart() {
  alert('google charts is loaded');
}

// load chart library
google.load('visualization', '1', {
  packages: ['corechart']
});

// tell loader to call drawChart once google charts is loaded
google.setOnLoadCallback(drawChart);
{% endhighlight %}

## Loading Data via JSONP
We will be using [jQuery](http://jquery.com/) in this example to load data via a [JSONP](http://en.wikipedia.org/wiki/JSONP)
request.  JSONP allows you to request data from [data.sparkfun.com](https://data.sparkfun.com) without violating the
[same-origin policy](http://en.wikipedia.org/wiki/Same-origin_policy). Below is an example of how you can make a JSONP
request for your stream's data.  We will be using this approach to fill in chart data.

**Example** Make a JSONP request for the first page of data
{% highlight js %}

var public_key = 'dZ4EVmE8yGCRGx5XRX1W';

$.ajax({
  url: 'https://data.sparkfun.com/output/' + public_key + '.json',
  data: {page: 1},
  dataType: 'jsonp',
}).done(function (results) {

  // loop through results and log temperature to the console
  $.each(results, function (index, row) {
    console.log(row.temp);
  });

});
{% endhighlight%}

## Creating the DataTable
Google Charts use [DataTables](https://google-developers.appspot.com/chart/interactive/docs/reference#DataTable)
as their data source, and we will need to create one to connect our data to the line chart. Now that you know how to load your data with jQuery,
you are ready to create a DataTable and fill it with data.  You will first need to tell the DataTable which columns it should create,
and the data type for each column.  Available data types include: `string`, `number`, `boolean`, `date`, `datetime`, and `timeofday`.
In our example, we will be using `datetime` and `number`. You can add as many columns as you need to your chart, but we are only adding three in this example.

**Example** Create a DataTable and add column definitions
{% highlight js %}
var data = new google.visualization.DataTable();

data.addColumn('datetime', 'Time');
data.addColumn('number', 'Temp');
data.addColumn('number', 'Wind Speed MPH');
{% endhighlight%}

Now that you have added your column definitions to the DataTable, you are ready to load it with your logged data. Row data
is always returned from the server as strings, so you will need to convert the data to the appropriate data type before
adding it to the DataTable.  You will need to add your data to the array passed to `addRow` in the order of your column
definition.  In this example, we will be using the `timestamp`, `tempf`, and `windspeedmph`, which are
fields that were defined during the creation of the weather station data stream.

**Example** Loop through data and add rows to the DataTable
{% highlight js %}
$.each(results, function (i, row) {
  data.addRow([
    (new Date(row.timestamp)),
    parseFloat(row.tempf),
    parseFloat(row.windspeedmph)
  ]);
});
{% endhighlight%}

## Creating the Chart
The chart creation process is fairly simple once you have created the DataTable.  We will be adding our chart
to a HTML div with the id of `chart`.

**Example** Create chart and add it to div

{% highlight js %}
var chart = new google.visualization.LineChart($('#chart').get(0));

chart.draw(data, {
  title: 'Wimp Weather Station'
});
{% endhighlight%}

## Putting It All Together
{% highlight html %}
<!DOCTYPE html>
<html>
  <head>
    <!-- EXTERNAL LIBS-->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="https://www.google.com/jsapi"></script>

    <!-- EXAMPLE SCRIPT -->
    <script>

      // onload callback
      function drawChart() {

        var public_key = 'dZ4EVmE8yGCRGx5XRX1W';

        // JSONP request
        var jsonData = $.ajax({
          url: 'https://data.sparkfun.com/output/' + public_key + '.json',
          data: {page: 1},
          dataType: 'jsonp',
        }).done(function (results) {

          var data = new google.visualization.DataTable();

          data.addColumn('datetime', 'Time');
          data.addColumn('number', 'Temp');
          data.addColumn('number', 'Wind Speed MPH');

          $.each(results, function (i, row) {
            data.addRow([
              (new Date(row.timestamp)),
              parseFloat(row.tempf),
              parseFloat(row.windspeedmph)
            ]);
          });

          var chart = new google.visualization.LineChart($('#chart').get(0));

          chart.draw(data, {
            title: 'Wimp Weather Station'
          });

        });

      }

      // load chart lib
      google.load('visualization', '1', {
        packages: ['corechart']
      });

      // call drawChart once google charts is loaded
      google.setOnLoadCallback(drawChart);

    </script>

  </head>
  <body>
    <div id="chart" style="width: 100%;"></div>
  </body>
</html>
{% endhighlight%}

## Final Thoughts
You can read more about how to interact with phant by visiting [phant.io/docs](/docs). If you spot any errors, or have any issues,
let us know in the comment section below.
