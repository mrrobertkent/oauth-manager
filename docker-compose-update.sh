#!/bin/bash

# Script to update docker-compose.yml to use ts-node

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

# Backup docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Update the command in docker-compose.yml to use our custom start.sh script
sed -i 's/command: \["node", "dist\/index.js"\]/command: ["\/app\/start.sh"]/' docker-compose.yml

echo "Updated docker-compose.yml:"
cat docker-compose.yml

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