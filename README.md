================================================================================

System Requirements
- Operating System: Linux
- Software:
  - npm
  - Python 3.3 or superior with flask module (see http://flask.pocoo.org/)
  - HyLaGI


================================================================================

Build and Start the Server
- Install packages and build from source with following commands.
  ```
  /webHydLa$ npm install
  /webHydLa$ npm run build
  ```
- The session of webHydLa is encrypted with a secret key.  
  To set the key, run a command such as,
  ```
  /webHydLa$ openssl rand -base64 10 | fold -w 10 | head -1 > secret_key
  ```
- Execute server.py, then webHydLa will start on http://0.0.0.0:5000.  
  (If the port has been already in use, it will use another port.)
- You have to add the path to the command 'hylagi' into your $PATH variable to  
  execute HydLa programs in webHydLa.

Test
```
/webHydLa$ npm t
```

Generate Document
```
/webHydLa$ npm run doc
```