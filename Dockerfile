FROM node
RUN apt update && apt install -y curl gnupg netcat

COPY . /build
WORKDIR /build
RUN chmod +x docker-entrypoint.sh
RUN npm install 
CMD ["./docker-entrypoint.sh"]