#!/usr/bin/env perl

=pod

=head1 NAME

http_post.pl - post some data to a Phant instance (like data.sparkfun.com)

=cut

use warnings;
use strict;
use LWP::UserAgent;
use HTTP::Request::Common qw(POST);

my $endpoint = 'https://data.sparkfun.com';
my $pubhash  = '6JJ4dEYoqNTwjyMVn0ZM';
my $privhash = 'WwwZVA7W5PiMG92Ym0p2';

my %data = (code => 'Perl');

print "Who are you? ";
$data{who} = <STDIN>;

print "Where are you at? ";
$data{where} = <STDIN>;

print "What's your favorite animal? ";
$data{favorite_animal} = <STDIN>;

my $ua = LWP::UserAgent->new;
$ua->agent('http_post.pl 1.0');

my $response = $ua->request(
  POST $endpoint . '/input/' . $pubhash,
       'Phant-Private-Key' => $privhash,
       Content => \%data
);

if ($response->is_success) {
  print $response->decoded_content;
} else {
  die $response->status_line . ' ' . $response->content;
}
