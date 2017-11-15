---
layout: docs
title: Rate Limits
docs: Input
order: 1
---

Unfortunately we have to enforce rate limits on [data.sparkfun.com](https://data.sparkfun.com) in order to prevent service outages.
Most users won't hit the rate limit during normal use, but it is something you should be aware of if your device needs to send a lot of logging requests in a short
period of time.

## 15 Minute Windows

Limits are divided into 15 minute intervals on [data.sparkfun.com](https://data.sparkfun.com).  You are currently
limited to making 100 log requests every 15 minutes.  You can make those requests in bursts, or spread them out over the entire window.

## HTTP Headers and Response Codes

The server will respond with HTTP rate limit headers for every logging request you make.  These HTTP headers are contextual,
so they only indicate the rate limit for the current stream.  You will have separate rate limits for each stream you create on
[data.sparkfun.com](https://data.sparkfun.com).

* `X-Rate-Limit-Limit` - The rate limit ceiling for that given request
* `X-Rate-Limit-Remaining` - The number of requests left for the 15 minute window
* `X-Rate-Limit-Reset` - The remaining window before the rate limit resets in UTC epoch seconds

**Example** Standard response:

    HTTP/1.1 200 OK
    Content-Type: text/plain
    X-Rate-Limit-Limit: 100
    X-Rate-Limit-Remaining: 99
    X-Rate-Limit-Reset: 1403798400
    Date: Thu, 26 Jun 2014 15:45:03 GMT
    Transfer-Encoding: chunked

    1 success

When you exceed the rate limit for a given stream, [data.sparkfun.com](https://data.sparkfun.com)
will return a `HTTP 429 Too Many Requests` response code, along with an error message.

**Example** Over the limit response:

    HTTP/1.1 429 Too Many Requests
    Content-Type: text/plain
    X-Rate-Limit-Limit: 100
    X-Rate-Limit-Remaining: 0
    X-Rate-Limit-Reset: 1403798130
    Date: Thu, 26 Jun 2014 15:41:30 GMT
    Transfer-Encoding: chunked

    0 rate limit exceeded. try again in 840 seconds.
