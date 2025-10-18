# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Production stage
FROM node:18-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
# Add other necessary files (e.g., if you have routes/ or utils/)
COPY --from=builder /app ./
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "server.js"]