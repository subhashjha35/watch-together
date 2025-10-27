# Dockerfile
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY apps/watch-together/nginx.conf /etc/nginx/conf.d/default.conf

COPY dist/apps/watch-together/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
