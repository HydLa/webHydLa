================================================================================

System Requirements
- Operating System: Linux
- Software:
  - npm
  - Python 3.3 or superior with flask module (see http://flask.pocoo.org/)
  - HyLaGI


================================================================================

Usage
- Install packages and build from source with following commands.
  ```
  /webHydLa$ npm install
  /webHydLa$ npm run build
  ```
- Execute server.py, then webHydLa will start on http://0.0.0.0:5000.  
  (If the port has been already in use, it will use another port.)
- You have to add the path to the command 'hylagi' into your $PATH variable to  
  execute HydLa programs in webHydLa.
- The session of webHydLa is encrypted with a secret key ("secret_key" by default).
  If you allow your webHydLa to communicate with remote clients, modify the
  secret key at the line starting with "app.secret_key = " in server.py.
