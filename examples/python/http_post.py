#!/usr/bin/env python3

"""Simple HTTP POST example using Python 3 and requests."""

import requests
import sys


public_hash = 'KJJGv81n1pUyM4Kbg9by'
private_hash = 'vzzjDZR6RpfjdEzb1Ybj'
url = ''.join(('https://data.sparkfun.com/input/', public_hash))

headers = {
    'Content-type': 'application/x-www-form-urlencoded',
    'Phant-Private-Key': private_hash
}


def main():
    data = {
        'who': input('Who are you? '),
        'where': input('Where are you? '),
        'favorite_animal': input("What's your favorite animal? "),
    }
    data['code'] = 'python'

    try:
        r = requests.post(url, data=data, headers=headers)
        print(r.text)

    except requests.exceptions.RequestException as e:
        print(e)
        sys.exit(1)

if __name__ == "__main__":
    main()
