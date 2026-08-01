# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency locks
COPY package*.json ./
RUN npm install

# Copy frontend source files
COPY . .

# Set relative API path config during build time
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Compile production bundle
RUN npm run build

# Nginx runner stage
FROM nginx:alpine

# Copy custom proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
