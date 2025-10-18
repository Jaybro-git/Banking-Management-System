# Use official Node.js image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy backend package.json and lock file first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code
COPY . .

# Expose backend port
EXPOSE 5000

# Default command to run your dev script
CMD ["npm", "run", "dev"]
