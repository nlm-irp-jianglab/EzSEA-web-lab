# Stage 0 -- Building frontend assests
FROM node:20.5.1-alpine AS build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000

CMD ["node", "listener.js"]
