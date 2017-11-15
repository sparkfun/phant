#include <Phant.h>

// Arduino example stream
// http://data.sparkfun.com/streams/VGb2Y1jD4VIxjX3x196z
// host, public key, private key
Phant phant("data.sparkfun.com", "VGb2Y1jD4VIxjX3x196z", "9YBaDk6yeMtNErDNq4YM");

void setup() {
  Serial.begin(9600);
}

void loop() {

  phant.add("val1", "url");
  phant.add("val2", 22);
  phant.add("val3", 0.1234);

  Serial.println("----TEST URL-----");
  Serial.println(phant.url());

  Serial.println();

  phant.add("val1", "post");
  phant.add("val2", false);
  phant.add("val3", 98.6);

  Serial.println("----HTTP POST----");
  Serial.println(phant.post());

  Serial.println();

  Serial.println("----HTTP GET----");
  Serial.println(phant.get());

  Serial.println("----HTTP DELETE----");
  Serial.println(phant.clear());

  delay(2000);

}

