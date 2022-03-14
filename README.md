# webHydla - Web IDE of HydLa

![](https://img.shields.io/badge/node->=17.0.0-brightgreen)
![](https://img.shields.io/badge/python->=3.3-blue)
[![CI](https://github.com/HydLa/webHydLa/workflows/CI/badge.svg)](https://github.com/HydLa/webHydLa/actions?query=workflow:CI)
![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)
![license: MIT](https://img.shields.io/badge/license-MIT-blue)

[View Demo](http://webhydla.ueda.info.waseda.ac.jp)

[![Editor](https://user-images.githubusercontent.com/39757050/101180365-d3b45980-368e-11eb-8590-e4fb5bef7aae.png)](http://webhydla.ueda.info.waseda.ac.jp)
[![3D visualization](https://user-images.githubusercontent.com/39757050/101180368-d57e1d00-368e-11eb-970f-5f6fd012c1f5.png)](http://webhydla.ueda.info.waseda.ac.jp)

## Build by yourself

```sh
git clone https://github.com/HydLa/webHydLa.git
cd webHydLa
```

### On Docker

Execute `docker-compose up` and open <http://0.0.0.0:5000/>

### Locally

#### System Requirements

- Operating System: Linux
- Software:
  - node 15 or later, and npm 7 or later
  - Python 3.3 or later

#### Build and Start the Server

1. Install packages and build from source with following commands.
   ```sh
   pip3 install -r requirements.txt
   npm install
   npm run build
   ```
2. The session of webHydLa is encrypted with a secret key.
   To set the key, run a command such as,
   ```sh
   cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | fold -w 10 | head -1 > secret_key
   ```
3. Execute `server.py`, then webHydLa will start on <http://0.0.0.0:5000/>.
   (If the port has been already in use, it will use another port.)
   ```sh
   python3 serve.py
   ```

## Development

### Lint

```sh
npm run lint
```

### Format

```sh
npm run format
```

### Test

```sh
npm t
```

### Generate Document

```sh
npm run doc
```

[Here is the generated document](https://hydla.github.io/webHydLa/)

> そのままだと怒られる（いまいち理由はよくわかっていない）ので，
> typedoc-plugin-missing-exports を用いている．

## System overview

### architecture

```
client side
- src/ and static/

server side
- server.py
```

### sequence

```
client (src/ and static/)    server.py            chaurose (???)
|                                |                    |
write down hydla code            |                    |
press button "run"               |                    |
----------------------> if the local machine          |
|                       has mathematica               |
|                       then                          |
|                  <----- run on the machine          |
|                       else                          |
|                         run with chaurose (???) --->
|                                                    run
render the result  <----------------------------------
as a graph
```

web 上のエディタで hydla コードを入力させ，
run ボタンを押されると server.py（サーバサイド）と通信して
サーバサイドで hylagi を実行する．
hylagi の実行が終わると，結果（hydat）を受信し，グラフとして描画する．
