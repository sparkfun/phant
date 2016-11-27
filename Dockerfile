FROM node

MAINTAINER idcrook@users.noreply.github.com

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

# EXPOSE 8888
# EXPOSE 8889
#    http_port = process.env.PHANT_PORT || 8080,
#    telnet_port = process.env.PHANT_TELNET_PORT || 8081;
# VOLUME /phant_streams

# ENTRYPOINT ["phant"]
# CMD ["/usr/local/bin/phant"]
CMD ["npm", "start"]

# docker built -t <image_name> .
# docker run -d -p 8888:8888 -p 8889:8889 -e PHANT_PORT='8888' -e PHANT_TELNET_PORT='8889' -v ./phant_streams/:/usr/src/app/phant_streams/ dpcrook/phant
