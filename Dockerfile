FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y bash coreutils && rm -rf /var/lib/apt/lists/*

WORKDIR /efr

COPY . /efr/

RUN chmod +x run.sh app/node

EXPOSE 5618

CMD ["bash", "run.sh"]
