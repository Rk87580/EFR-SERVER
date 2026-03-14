FROM node:10-buster-slim

WORKDIR /efr

COPY . /efr/

RUN chmod +x run.sh app/node

RUN npm install

EXPOSE 5618
EXPOSE 3000

CMD ["bash", "-c", "node server.js & bash run.sh"]
