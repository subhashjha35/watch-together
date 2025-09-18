FROM docker.io/nginx:stable-alpine

COPY dist/apps/watch-together /usr/share/nginx/html
COPY apps/watch-together/nginx.conf  /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
