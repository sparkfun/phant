#!/bin/sh

echo -n "Who are you? "
read PHANT_WHO

echo -n "Where are you at? "
read PHANT_WHERE

PHANT_CODE=sh

echo -n "What is your favorite animal? "
read PHANT_ANIMAL

curl --header "Phant-Private-Key: aP2g6rdxlRIxJ9Pr6YgV" \
     "https://data.sparkfun.com/input/v0gxy8OnGVCOGl38oqM4?who=$PHANT_WHO&where=$PHANT_WHERE&code=$PHANT_CODE&favorite_animal=$PHANT_ANIMAL"
