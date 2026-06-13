FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/coffee-shop.db

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]
