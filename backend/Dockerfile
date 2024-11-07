# Stage 0 -- Building node listener assests
FROM node:20.5.1-alpine AS build

WORKDIR /usr/src/app

COPY /listener/package*.json ./
RUN npm install
RUN apk add --no-cache docker-cli

RUN gcloud container clusters get-credentials ezsea-cluster --zone us-central1 --project ncbi-research-cbb-jiang

COPY /listener/ .
EXPOSE 5000
 
CMD ["node", "listener.js"]