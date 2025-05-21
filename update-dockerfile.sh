#!/bin/bash

# Script to update Node.js version in Dockerfile and rebuild containers

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

# Backup Dockerfile
cp auth-service/Dockerfile auth-service/Dockerfile.backup

# Update Node.js version in Dockerfile
echo "Updating Node.js version in Dockerfile..."
sed -i 's/FROM node:.*-alpine/FROM node:20-alpine/' auth-service/Dockerfile

# Add npm update commands if needed
if ! grep -q "RUN npm i npm" auth-service/Dockerfile; then
  # Insert after WORKDIR line
  sed -i '/WORKDIR \/app/a \
# Update npm to latest version\
RUN npm i npm\
RUN mv node_modules/npm /usr/local/lib/node_modules/npm' auth-service/Dockerfile
fi

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

echo "Done!" 