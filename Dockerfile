# マルチステージビルド
FROM node:15.1.0 AS builder
WORKDIR /work
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run lint && npm run test && npm run build
# 2ステージ目を軽くするため
RUN rm -rf node_modules ./*.js ./*.json src ui_auto_operation.py

FROM python:3.9.0-alpine
WORKDIR /work
RUN pip install flask==3.0.2

# ランダムな文字列をシークレットに設定
RUN ash -c "LC_CTYPE=C tr -dc 'a-zA-Z0-9' < /dev/urandom | \
  fold -w 10 | head -n 1 > secret_key"
COPY --from=builder /work/ .
CMD ["python", "server.py"]
