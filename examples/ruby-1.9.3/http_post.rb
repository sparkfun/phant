#!/usr/bin/env ruby

# Very basic Ruby script to post to a phant instance.
# This is unlikely to be very idiomatic; better examples
# welcome.

require 'net/http'

endpoint = 'https://data.sparkfun.com'
pubhash  = '6JJ4dEYoqNTwjyMVn0ZM'
privhash = 'WwwZVA7W5PiMG92Ym0p2'

data = { 'code' => 'ruby-1.9.3' }

puts "Who are you? "
data['who'] = gets

puts "Where are you at? "
data['where'] = gets

puts "What's your favorite animal? "
data['favorite_animal'] = gets

path = "#{endpoint}/input/#{pubhash}"
uri = URI(path)

req = Net::HTTP::Post.new(uri.path)
req.set_form_data(data)
req['Phant-Private-Key'] = privhash

res = Net::HTTP.start(uri.hostname, uri.port, :use_ssl => true) do |http|
  http.request(req)
end

puts res.body
