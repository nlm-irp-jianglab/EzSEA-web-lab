# Stage 0 -- Building node listener assests
FROM node:20.5.1-alpine AS build

WORKDIR /usr/src/app

COPY /listener/package*.json ./
RUN npm install
RUN apk add --no-cache docker-cli
RUN apk add --no-cache curl
RUN apk add --no-cache python3
# Downloading gcloud package
RUN curl https://dl.google.com/dl/cloudsdk/release/google-cloud-sdk.tar.gz > /tmp/google-cloud-sdk.tar.gz

# Installing the gcloud
RUN mkdir -p /usr/local/gcloud 
RUN tar -C /usr/local/gcloud -xvf /tmp/google-cloud-sdk.tar.gz 
RUN /usr/local/gcloud/google-cloud-sdk/install.sh

# Adding the package path to local
ENV PATH $PATH:/usr/local/gcloud/google-cloud-sdk/bin

# Installing kubectl
RUN gcloud components install kubectl

# Getting credentials for GKE
RUN gcloud container clusters get-credentials ezsea-cluster --zone us-central1 --project ncbi-research-cbb-jiang

COPY /listener/ .
EXPOSE 5000

CMD ["node", "listener.js"]