FROM node:20-alpine

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.cloud.tencent.com/g' /etc/apk/repositories \
    && apk add --no-cache python3 make g++ tzdata

WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci --production=false

COPY . .
RUN npm run build
RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/coffee-shop.db
ENV TZ=Asia/Shanghai

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]
