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
 * Author: Todd Treece <todd@sparkfun.com>
 *
 * Copyright (c) 2014 SparkFun Electronics.
 * Licensed under the GPL v3 license.
 *
 */

#include "Arduino.h"
#include "Phant.h"

#ifdef ARDUINO_ARCH_AVR
#include <avr/pgmspace.h>
#else
#include "pgmspace.h"
#endif

static const char HEADER_POST_URL1[] PROGMEM = "POST /input/";
static const char HEADER_POST_URL2[] PROGMEM = ".txt HTTP/1.1\n";
static const char HEADER_PHANT_PRV_KEY[] PROGMEM = "Phant-Private-Key: ";
static const char HEADER_CONNECTION_CLOSE[] PROGMEM = "Connection: close\n";
static const char HEADER_CONTENT_TYPE[] PROGMEM = "Content-Type: application/x-www-form-urlencoded\n";
static const char HEADER_CONTENT_LENGTH[] PROGMEM = "Content-Length: ";

Phant::Phant(String host, String publicKey, String privateKey) {
  _host = host;
  _pub = publicKey;
  _prv = privateKey;
  _params = "";
}

void Phant::add(String field, String data) {

  _params += "&" + field + "=" + data;

}

void Phant::add(const __FlashStringHelper *field, String data) {
  
  _params += "&";
  addFlashString(field, _params);
  _params += "=" + data;
  
}


void Phant::add(String field, char data) {

  _params += "&" + field + "=" + String(data);

}

void Phant::add(const __FlashStringHelper *field, char data) {
  
  _params += "&";
  addFlashString(field, _params);
  _params += "=" + String(data);
  
}


void Phant::add(String field, int data) {

  _params += "&" + field + "=" + String(data);

}

void Phant::add(const __FlashStringHelper *field, int data) {
  
  _params += "&";
  addFlashString(field, _params);
  _params += '=' + String(data);
  
}


void Phant::add(String field, byte data) {

  _params += "&" + field + "=" + String(data);

}

void Phant::add(const __FlashStringHelper * field, byte data) {
  
  _params += "&";
  addFlashString(field, _params);
  _params += "=" + String(data);
  
}


void Phant::add(String field, long data) {

  _params += "&" + field + "=" + String(data);

}

void Phant::add(const __FlashStringHelper * field,  long data) {
  
  _params += "&";
  addFlashString(field, _params);
  _params += "=" + String(data);
  
}

void Phant::add(String field, unsigned int data) {

  _params += "&" + field + "=" + String(data);

}

void Phant::add(const __FlashStringHelper * field,  unsigned int data) {
  
  _params += "&";
  addFlashString(field, _params);
  _params += "=" + String(data);
  
}


void Phant::add(String field, unsigned long data) {

  _params += "&" + field + "=" + String(data);

}

void Phant::add(const __FlashStringHelper * field,  unsigned long data) {
  
  _params += "&";
  addFlashString(field, _params);
  _params += "=" + String(data);
  
}


void Phant::add(String field, double data) {

  char tmp[30];

  dtostrf(data, 1, 4, tmp);

  _params += "&" + field + "=" + String(tmp);

}

void Phant::add(const __FlashStringHelper * field,  double data) {
  
  char tmp[30];

  dtostrf(data, 1, 4, tmp);

  _params += "&";
  addFlashString(field, _params);
  _params += "=" + String(tmp);
  
}

void Phant::add(String field, float data) {

  char tmp[30];

  dtostrf(data, 1, 4, tmp);

  _params += "&" + field + "=" + String(tmp);

}

void Phant::add(const __FlashStringHelper * field,  float data) {
  
  char tmp[30];

  dtostrf(data, 1, 4, tmp);

  _params += "&";
  addFlashString(field, _params);
  _params += "=" + String(tmp);
  
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
  String result;
  //String result = "POST /input/" + _pub + ".txt HTTP/1.1\n";
  for (int i=0; i<strlen(HEADER_POST_URL1); i++)
  {
    result += (char)pgm_read_byte_near(HEADER_POST_URL1 + i);
  }
  result += _pub;
  for (int i=0; i<strlen(HEADER_POST_URL2); i++)
  {
    result += (char)pgm_read_byte_near(HEADER_POST_URL2 + i);
  }
  result += "Host: " + _host + "\n";
  //result += "Phant-Private-Key: " + _prv + "\n";
  for (int i=0; i<strlen(HEADER_PHANT_PRV_KEY); i++)
  {
    result += (char)pgm_read_byte_near(HEADER_PHANT_PRV_KEY + i);
  }
  result += _prv + '\n';
  //result += "Connection: close\n";
  for (int i=0; i<strlen(HEADER_CONNECTION_CLOSE); i++)
  {
    result += (char)pgm_read_byte_near(HEADER_CONNECTION_CLOSE + i);
  }
  //result += "Content-Type: application/x-www-form-urlencoded\n";
  for (int i=0; i<strlen(HEADER_CONTENT_TYPE); i++)
  {
    result += (char)pgm_read_byte_near(HEADER_CONTENT_TYPE + i);
  }	
  //result += "Content-Length: " + String(params.length()) + "\n\n";
  for (int i=0; i<strlen(HEADER_CONTENT_LENGTH); i++)
  {
    result += (char)pgm_read_byte_near(HEADER_CONTENT_LENGTH + i);
  }	
  result += String(params.length()) + "\n\n";
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

void Phant::addFlashString(const __FlashStringHelper *string, String & dest) {

  PGM_P p = reinterpret_cast<PGM_P>(string);
  size_t n = 0;
  while (1) 
  {
    unsigned char c = pgm_read_byte(p++);
    if (c == 0) break;
    dest += (char)c;
  }

}