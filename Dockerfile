# マルチステージビルド
FROM node:latest AS builder
WORKDIR /work
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run test
RUN npm run build
# 2ステージ目を軽くするため
RUN rm -rf node_modules

FROM python:alpine
COPY --from=builder /work/ /root/
WORKDIR /root
RUN pip install flask
# ランダムな文字列をシークレットに設定
RUN cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | fold -w 10 | head -1 > secret_key

CMD python server.py