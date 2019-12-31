FROM node
COPY nginx.vhost /etc/nginx/sites-available/default
WORKDIR /
RUN chmod +x docker-entrypoint.sh
RUN npm install 
CMD ["./docker-entrypoint.sh"]