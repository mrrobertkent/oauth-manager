#!/bin/bash

# Script to fix the path to orgs.json in config.ts

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

# Create a modified Dockerfile to update the config.ts file
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

# Update config.ts to use the correct path to orgs.json
RUN sed -i 's|/app/auth-service/data/orgs.json|/app/data/orgs.json|g' /app/src/config.ts

# Create a start script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'ts-node src/index.ts' >> /app/start.sh && \
    chmod +x /app/start.sh

# Command to start the service
CMD ["/app/start.sh"]
EOF

# Review the changes
echo "Updated Dockerfile to modify config.ts path:"
grep -n "sed -i" auth-service/Dockerfile

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Rebuild and restart containers
echo "Rebuilding containers..."
docker-compose build --no-cache auth-service
docker-compose up -d

# Check container status
echo "Checking container status..."
sleep 5
docker-compose ps

# Check logs
echo "Checking logs..."
docker-compose logs --tail 20 auth-service

echo "Done!" 