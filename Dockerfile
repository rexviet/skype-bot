FROM node:12

RUN rm -rf /var/lib/apt/lists/* && apt-get update -y
RUN apt-get install -y telnet vim git
RUN npm install -g nodemon ts-node@8.0.2 typescript pm2 --unsafe-perm=true --allow-root

RUN mkdir -p /app
WORKDIR /app

# Copy app files into app folder
COPY . /app
RUN npm install
RUN ls -la /app
VOLUME /app

# Clear old entrypoint
RUN rm -rf /usr/local/bin/docker-entrypoint.sh
COPY docker-entrypoint.sh /usr/local/bin/
RUN sed -i -e 's/\r$//' /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && ln -s /usr/local/bin/docker-entrypoint.sh /
ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 8100
