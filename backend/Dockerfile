# Stage 0 -- Building node listener assests
FROM node:20.5.1-alpine AS build

WORKDIR /usr/src/app

COPY /listener/package*.json ./
RUN npm install
RUN apk add --no-cache docker-cli

COPY /listener/ .
EXPOSE 5000
 
CMD ["node", "listener.js"]