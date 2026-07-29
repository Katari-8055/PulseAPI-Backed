FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY node_modules ./node_modules

COPY . .

RUN mkdir -p logs

EXPOSE 5000

CMD [ "node", "src/server.js" ]