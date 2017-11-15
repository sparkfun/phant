/**
 * Phant.h
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

#ifndef Phant_h
#define Phant_h

#include "Arduino.h"

class Phant {

  public:
    Phant(String host, String publicKey, String privateKey);
    void add(String field, String data);
    void add(String field, char data);
    void add(String field, int data);
    void add(String field, byte data);
    void add(String field, long data);
    void add(String field, unsigned int data);
    void add(String field, unsigned long data);
    void add(String field, float data);
    void add(String field, double data);

    void add(const __FlashStringHelper * field, String data);
    void add(const __FlashStringHelper * field, char data);
    void add(const __FlashStringHelper * field, int data);
    void add(const __FlashStringHelper * field, byte data);
    void add(const __FlashStringHelper * field, long data);
    void add(const __FlashStringHelper * field, unsigned int data);
    void add(const __FlashStringHelper * field, unsigned long data);
    void add(const __FlashStringHelper * field, float data);
    void add(const __FlashStringHelper * field, double data);

    String queryString();
    String url();
    String get();
    String post();
    String clear();

  private:
    String _pub;
    String _prv;
    String _host;
    String _params;

    void addFlashString(const __FlashStringHelper *string, String & dest);
};

#endif
