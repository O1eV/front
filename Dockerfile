FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# 운영 번들은 한 출처의 nginx 프록시를 사용합니다. 로컬 .env 파일은 복사하지 않습니다.
ENV VITE_API_BASE_URL=/api VITE_WS_URL=/ws
RUN npm run build

FROM nginx:1.28-alpine
ENV BACKEND_HOST=app BACKEND_PORT=8080 \
    NGINX_ENVSUBST_FILTER="^(BACKEND_HOST|BACKEND_PORT)$"
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
