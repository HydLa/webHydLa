# マルチステージビルド
FROM node:14 AS builder
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
RUN pip install flask==1.1.2
# ランダムな文字列をシークレットに設定
RUN LC_CTYPE=C tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 10 | head -n 1 > secret_key

CMD ["python", "server.py"]