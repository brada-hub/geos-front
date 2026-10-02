# Etapa 1: Build de la aplicación Quasar SPA
FROM node:20-alpine AS build-stage

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar
COPY . .
RUN npx quasar build

# Etapa 2: Servidor web ultraligero Nginx
FROM nginx:1.27-alpine AS production-stage

# Copiar configuración para SPA en Nginx
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Copiar bundle compilado desde la etapa de build
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
