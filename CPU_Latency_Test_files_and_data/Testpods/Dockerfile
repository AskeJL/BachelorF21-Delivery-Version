FROM restreamio/gstreamer:latest-prod

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    alsa-utils

RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_15.x | bash -
RUN apt-get update && apt-get install -y nodejs

RUN npm i kubernetes-client --save

RUN npm install

COPY ./ /app

EXPOSE 7000

ENTRYPOINT ["node", "server_hidden.js"]