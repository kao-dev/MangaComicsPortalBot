# Production Build
FROM node:lts-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Run
FROM node:lts-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /usr/src/app/dist ./dist
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
