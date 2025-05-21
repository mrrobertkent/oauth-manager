#!/bin/bash

# Script to create a working Dockerfile for Node.js 20 with direct execution

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

# Backup Dockerfile
cp auth-service/Dockerfile auth-service/Dockerfile.backup5

# Create a new Dockerfile that directly runs the TypeScript files using ts-node
cat > auth-service/Dockerfile << 'EOF'
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install latest npm version
RUN npm i -g npm@latest

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with dev dependencies for ts-node
RUN npm ci --include=dev

# Install ts-node globally
RUN npm install -g ts-node typescript

# Copy source code
COPY . .

# Install Doppler CLI
RUN apk add --no-cache curl gnupg && \
    curl -Ls https://cli.doppler.com/install.sh | sh

# Create a startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app' >> /app/start.sh && \
    echo 'exec ts-node --transpile-only src/index.ts' >> /app/start.sh && \
    chmod +x /app/start.sh

# Non-root user for better security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -G nodejs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Create volume for persistent data
VOLUME /app/data

# Run the application
CMD ["/app/start.sh"]
EOF

echo "Created a new Dockerfile that directly runs the TypeScript files using ts-node."
cat auth-service/Dockerfile

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Rebuild and restart containers
echo "Rebuilding containers..."
docker-compose build --no-cache auth-service
docker-compose up -d

# Check container status
echo "Checking container status..."
sleep 5 # Wait for container to start
docker-compose ps

echo "Checking logs..."
docker-compose logs --tail 20 auth-service

echo "Done!" 