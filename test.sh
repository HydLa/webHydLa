#!/bin/bash

npm run build
cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | fold -w 10 | head -1 > secret_key
python3 server.py
