#!/usr/bin/env python

""" Simple http POST example using Python 2.7 and urllib and urllib2."""

import urllib
import urllib2

public_hash     = 'KJJGv81n1pUyM4Kbg9by'
private_hash    = 'vzzjDZR6RpfjdEzb1Ybj'
base_url        = 'https://data.sparkfun.com'
post_url        = base_url + '/input/' + public_hash


headers = {
	'Content-type': 'application/x-www-form-urlencoded',
	'Phant-Private-Key': private_hash
}


def main():

	data = {}
	data['who'] = raw_input("Who are you? ")
	data['where'] = raw_input("Where are you? ")
	data['favorite_animal'] = raw_input("What's your favorite animal? ")
	data['code'] = 'python'

	data = urllib.urlencode(data)
	post_request = urllib2.Request(post_url,data,headers)

	try: 
		post_response = urllib2.urlopen(post_request)
		print post_response.read()

	except URLError as e:
		print "Error: ", e.reason

if __name__ == "__main__":
	main()
