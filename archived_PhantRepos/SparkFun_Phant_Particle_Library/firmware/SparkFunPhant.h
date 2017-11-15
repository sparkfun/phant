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
 * Original Author: Todd Treece <todd@sparkfun.com>
 * Edited for Particle by: Jim Lindblom <jim@sparkfun.com>
 *
 * Copyright (c) 2014 SparkFun Electronics.
 * Licensed under the GPL v3 license.
 *
 */

#ifndef Phant_h
#define Phant_h

#include "application.h"

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
    void add(String field, float data, unsigned int precision = 4);
    void add(String field, double data, unsigned int precision = 4);

    String queryString();
    String url();
    String get();
    String post();
    String clear();
	
    int particlePost();

  private:
    String _pub;
    String _prv;
    String _host;
    String _params;
};

#endif
