#!/bin/bash

# Script to fix TypeScript dependency issue in Dockerfile

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

# Backup Dockerfile
cp auth-service/Dockerfile auth-service/Dockerfile.backup2

echo "Updating Dockerfile to include TypeScript..."
sed -i '/RUN npm ci/c\
# Install dependencies including TypeScript\
RUN npm ci\
RUN npm install -g typescript' auth-service/Dockerfile

echo "Updated Dockerfile:"
cat auth-service/Dockerfile

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Rebuild and restart containers
echo "Rebuilding containers..."
docker-compose build --no-cache auth-service
docker-compose up -d

# Check Node.js version in new container
echo "Checking Node.js version in new container..."
sleep 5 # Wait for container to start
docker-compose exec auth-service node -v
docker-compose exec auth-service npm -v
docker-compose exec auth-service tsc --version

echo "Done!" 