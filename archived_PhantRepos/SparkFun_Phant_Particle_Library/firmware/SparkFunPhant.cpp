/**
 * Phant.cpp
 *
 *             .-.._
 *       __  /`     '.
 *    .-'  `/   (   a \
 *   /      (    \,_   \
 *  /|       '---` |\ =|
 * ` \    /__.-/  /  | |
 *    |  / / \ \  \   \_\  jgs
 *    |__|_|  |_|__\
 *    never   forget.
 *
 * Original Author: Todd Treece <todd@sparkfun.com>
 * Edited for Particle by: Jim Lindblom <jim@sparkfun.com>
 *
 * Copyright (c) 2014 SparkFun Electronics.
 * Licensed under the GPL v3 license.
 *
 */

#include "SparkFunPhant.h"
#include <stdlib.h>

Phant::Phant(String host, String publicKey, String privateKey) {
  _host = host;
  _pub = publicKey;
  _prv = privateKey;
  _params = "";
}

void Phant::add(String field, String data) {

  _params += "&" + field + "=" + data;

}


void Phant::add(String field, char data) {

  _params += "&" + field + "=" + String(data);

}


void Phant::add(String field, int data) {

  _params += "&" + field + "=" + String(data);

}


void Phant::add(String field, byte data) {

  _params += "&" + field + "=" + String(data);

}


void Phant::add(String field, long data) {

  _params += "&" + field + "=" + String(data);

}

void Phant::add(String field, unsigned int data) {

  _params += "&" + field + "=" + String(data);

}

void Phant::add(String field, unsigned long data) {

  _params += "&" + field + "=" + String(data);

}

void Phant::add(String field, double data, unsigned int precision) {

  String sd(data, precision);
  _params += "&" + field + "=" + sd;

}

void Phant::add(String field, float data, unsigned int precision) {

  String sf(data, precision);
  _params += "&" + field + "=" + sf;

}

String Phant::queryString() {
  return String(_params);
}

String Phant::url() {

  String result = "http://" + _host + "/input/" + _pub + ".txt";
  result += "?private_key=" + _prv + _params;

  _params = "";

  return result;

}

String Phant::get() {

  String result = "GET /output/" + _pub + ".csv HTTP/1.1\n";
  result += "Host: " + _host + "\n";
  result += "Connection: close\n";

  return result;

}

String Phant::post() {

	String params = _params.substring(1);
	String result = "POST /input/" + _pub + ".txt HTTP/1.1\n";
	result += "Host: " + _host + "\n";
	result += "Phant-Private-Key: " + _prv + "\n";
	result += "Connection: close\n";
	result += "Content-Type: application/x-www-form-urlencoded\n";
	result += "Content-Length: " + String(params.length()) + "\n\n";
	result += params;

	_params = "";
	return result;

}

String Phant::clear() {

  String result = "DELETE /input/" + _pub + ".txt HTTP/1.1\n";
  result += "Host: " + _host + "\n";
  result += "Phant-Private-Key: " + _prv + "\n";
  result += "Connection: close\n";

  return result;

}
int Phant::particlePost()
{
	String postString = post();

	TCPClient client;
	char response[512];
	int i = 0;
	int retVal = 0;

	if (client.connect(_host, 80)) // Connect to the server
	{
		// phant.post() will return a string formatted as an HTTP POST.
		// It'll include all of the field/data values we added before.
		// Use client.print() to send that string to the server.
		client.print(postString);
		//delay(1000);
		// Now we'll do some simple checking to see what (if any) response
		// the server gives us.
		int timeout = 1000;
		while (client.available() || (timeout-- > 0))
		{
			char c = client.read();
			//Serial.print(c);	// Print the response for debugging help.
			if (i < 512)
				response[i++] = c; // Add character to response string
			delay(1);
		}
		// Search the response string for "200 OK", if that's found the post
		// succeeded.
		if (strstr(response, "200 OK"))
		{
			retVal = 1;
		}
		else if (strstr(response, "400 Bad Request"))
		{	// "400 Bad Request" means the Phant POST was formatted incorrectly.
			// This most commonly ocurrs because a field is either missing,
			// duplicated, or misspelled.
			retVal = -1;
		}
		else
		{
			// Otherwise we got a response we weren't looking for.
			retVal = -2;
		}
	}
	else
	{	// If the connection failed:
		retVal = -3;
	}
	client.stop();	// Close the connection to server.
	return retVal;	// Return error (or success) code.
    
}
