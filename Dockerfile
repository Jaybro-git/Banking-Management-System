# Use Node.js 18 for building and running Next.js
FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all frontend source code
COPY . .

# Expose Next.js default port
EXPOSE 3000

# Start the frontend in dev mode
CMD ["npm", "run", "dev"]
