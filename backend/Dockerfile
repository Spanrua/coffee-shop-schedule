FROM node:20-alpine

# 安装编译 native 模块所需的依赖
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 只复制 package 文件，利用 Docker 缓存
COPY package*.json ./

# 在容器内安装依赖（包括重新编译 native 模块）
RUN npm ci --production=false

# 复制源代码（node_modules 被 .dockerignore 排除）
COPY . .

# 编译 TypeScript
RUN npm run build

# 清理开发依赖以减小镜像大小
RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/coffee-shop.db

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]
