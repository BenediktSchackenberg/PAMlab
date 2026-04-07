FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/30-runtime-config.sh /docker-entrypoint.d/30-runtime-config.sh
EXPOSE 3000
RUN chmod +x /docker-entrypoint.d/30-runtime-config.sh
RUN sed -i 's/listen\s*80;/listen 3000;/g' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
