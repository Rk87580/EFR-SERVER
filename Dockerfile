FROM node:10-buster-slim

WORKDIR /efr

COPY . /efr/

RUN chmod +x run.sh app/node

RUN npm install

EXPOSE 8080

CMD ["bash", "-c", "node proxy.js & bash run.sh"]
