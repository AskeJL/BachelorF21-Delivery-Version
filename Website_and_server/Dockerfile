FROM node:10-alpine

WORKDIR /app

COPY . .
RUN npm i kubernetes-client --save
RUN npm install
RUN npm install cors
RUN npm install socket.io
EXPOSE 80
EXPOSE 3000

ENTRYPOINT ["node", "server.js"]