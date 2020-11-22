# webHydla

## Installation

### Build on Docker
Exec `docker-compose up` and open http://0.0.0.0:5000/

### Build locally

#### System Requirements
- Operating System: Linux
- Software:
  - npm
  - Python 3.3 or superior with flask module (see http://flask.pocoo.org/)

#### Build and Start the Server
- Install packages and build from source with following commands.
  ```
  /webHydLa$ npm install
  /webHydLa$ npm run build
  ```
- The session of webHydLa is encrypted with a secret key.  
  To set the key, run a command such as,
  ```
  /webHydLa$ cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | fold -w 10 | head -1 > secret_key
  ```
- Execute server.py, then webHydLa will start on http://0.0.0.0:5000/.  
  (If the port has been already in use, it will use another port.)

## Lint
```
/webHydLa$ npm run lint
```

## Test
```
/webHydLa$ npm t
```

## Generate Document
```
/webHydLa$ npm run doc
```