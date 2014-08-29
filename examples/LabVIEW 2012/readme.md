# LabVIEW Example for Phant #

This example was created in LabVIEW 2012.

Implements the GET and POST methods for Sparkfun's Phant service, available at [https://github.com/sparkfun/phant](https://github.com/sparkfun/phant).

Phant configuration control allows user to enter the base URL of the service (https://data.sparkfun.com), the public key for their stream, and the private key for their stream.

The **GET** method only requires the public key for the stream. Even if a stream is not "published publically", it can still be accessed using the public key.

The Response Type control allows you to choose csv or json response types. LabVIEW versions 2013 and forward include a json parser function.

The Page control can be used to request 50kb pages of data from the server. This value defaults to -1, which means to omit the page argument from the url and return all historical data in the stream.

The **SET** method requires the public and private key. The private key is used in the HTTP header. 