# webHydla - Web IDE of HydLa

![CI](https://github.com/HydLa/webHydLa/workflows/CI/badge.svg)

Provided at http://webhydla.ueda.info.waseda.ac.jp

![Editor](https://user-images.githubusercontent.com/39757050/101180365-d3b45980-368e-11eb-8590-e4fb5bef7aae.png)
![3D visualization](https://user-images.githubusercontent.com/39757050/101180368-d57e1d00-368e-11eb-970f-5f6fd012c1f5.png)

## Build by yourself

### On Docker

Exec `docker-compose up` and open http://0.0.0.0:5000/

### Locally

#### System Requirements

- Operating System: Linux
- Software:
  - node 15 or later, and npm 7 or later
  - Python 3.3 or later with flask module (see http://flask.pocoo.org/)

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

## Format

```
/webHydLa$ npm run format
```

## Test

```
/webHydLa$ npm t
```

## Generate Document

```
/webHydLa$ npm run doc
```
