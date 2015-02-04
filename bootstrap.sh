#!/usr/bin/env bash

# Exit on error
set -e

has?() {
    command -v "$1" > /dev/null 2>&1
}

if ! has? npm; then
  # Update apt-cache
  DEBIAN_FRONTEND=noninteractive apt-get -qqy update 2>&1

  # Install npm
  DEBIAN_FRONTEND=noninteractive apt-get -qqy install npm 2>&1

  # Update npm
  npm cache clean -f && npm install -g n && n stable 2>&1
fi

has? phant || npm install -g phant
has? forever || npm install -g forever

/usr/local/bin/forever start /usr/local/bin/phant
