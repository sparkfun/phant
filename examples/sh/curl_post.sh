#!/bin/sh

echo -n "Who are you? "
read PHANT_WHO

echo -n "Where are you at? "
read PHANT_WHERE

PHANT_CODE=sh

echo -n "What is your favorite animal? "
read PHANT_ANIMAL

curl --header "Phant-Private-Key: aP2g6rdxlRIxJ9Pr6YgV" \
     --data "who=$PHANT_WHO" \
     --data "where=$PHANT_WHERE" \
     --data "code=$PHANT_CODE" \
     --data "favorite_animal=$PHANT_ANIMAL" \
     'https://data.sparkfun.com/input/v0gxy8OnGVCOGl38oqM4' \
