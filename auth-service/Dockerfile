FROM node:18-alpine

WORKDIR /app

# Update npm to latest version
RUN npm install -g npm@latest

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Create volume for persistent data
VOLUME /app/data

# Run the application
CMD ["npm", "start"]