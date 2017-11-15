/*	ExampleStream.ino
	Jim Lindblom <jim@sparkfun.com>
	March 24, 2015
	https://github.com/jimblom/Spark_Phant_Library
	
	This is a simple example sketch for the Particle Core (or Photon) that
	demonstrates how to use the SparkFunPhant library to post
	to Phant.
	
	It's set up to post to this test stream: 
	https://data.sparkfun.com/streams/DJjNowwjgxFR9ogvr45Q
	(please don't abuse it.)
	
	The postToPhant() functions demonstrates how to first use
	phant.add() to add your field/value parameters. Then use phant.post()
	to create an HTTP POST and send it.
	

	Development environment specifics:
	Particle Build environment (https://www.particle.io/build)
	Particle Photon
	Distributed as-is; no warranty is given. 
*/
// Include the library:
#include "SparkFunPhant/SparkFunPhant.h"

const char server[] = "data.sparkfun.com"; // Phant destination server
const char publicKey[] = "DJjNowwjgxFR9ogvr45Q"; // Phant public key
const char privateKey[] = "P4eKwGGek5tJVz9Ar84n"; // Phant private key
Phant phant(server, publicKey, privateKey); // Create a Phant object

const int POST_RATE = 30000; // Time between posts, in ms.
unsigned long lastPost = 0; // global variable to keep track of last post time

void setup()
{
	// We'll use serial to debug. We'll post information about post successes/
	// failures here.
	Serial.begin(9600); 
	pinMode(A0, INPUT);
	pinMode(A1, INPUT);
	pinMode(A2, INPUT);
	pinMode(A3, INPUT);
	pinMode(A4, INPUT);
	pinMode(A5, INPUT);
}

void loop()
{
	// If it's been POST_RATE ms (default 30 seconds), try to post again.
    if (lastPost + POST_RATE < millis())
    {
		// If the post succeeds, update lastPost so we don't post for
		// another 30 seconds.
        if (postToPhant() > 0)
        {
            lastPost = millis();
        }
		// If the post fails, delay 1s and try again.
    }
	delay(1000);
}

int postToPhant()
{
	// Use phant.add(<field>, <value>) to add data to each field.
	// Phant requires you to update each and every field before posting,
	// make sure all fields defined in the stream are added here.
    phant.add("analog0", analogRead(A0));
    phant.add("analog1", analogRead(A1));
    phant.add("analog2", analogRead(A2));
    phant.add("analog3", analogRead(A3));
    phant.add("analog4", analogRead(A4));
    phant.add("analog5", analogRead(A5));
	
    TCPClient client;
    char response[512];
    int i = 0;
    int retVal = 0;
    
    if (client.connect(server, 80)) // Connect to the server
    {
		// Post message to indicate connect success
        Serial.println("Posting!"); 
		
		// phant.post() will return a string formatted as an HTTP POST.
		// It'll include all of the field/data values we added before.
		// Use client.print() to send that string to the server.
        client.print(phant.post());
        delay(1000);
		// Now we'll do some simple checking to see what (if any) response
		// the server gives us.
        while (client.available())
        {
            char c = client.read();
            Serial.print(c);	// Print the response for debugging help.
            if (i < 512)
                response[i++] = c; // Add character to response string
        }
		// Search the response string for "200 OK", if that's found the post
		// succeeded.
        if (strstr(response, "200 OK"))
        {
            Serial.println("Post success!");
            retVal = 1;
        }
        else if (strstr(response, "400 Bad Request"))
        {	// "400 Bad Request" means the Phant POST was formatted incorrectly.
			// This most commonly ocurrs because a field is either missing,
			// duplicated, or misspelled.
            Serial.println("Bad request");
            retVal = -1;
        }
        else
        {
			// Otherwise we got a response we weren't looking for.
            retVal = -2;
        }
    }
    else
    {	// If the connection failed, print a message:
        Serial.println("connection failed");
        retVal = -3;
    }
    client.stop();	// Close the connection to server.
    return retVal;	// Return error (or success) code.
}