#!/bin/bash

# Script to check and update Docker containers with newer Node.js version

echo "===== Current Docker Containers ====="
docker ps -a

echo "===== Current Docker Images ====="
docker images

echo "===== Node.js Version in Containers ====="
# Find containers with node in name and check version
CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -i node)
for container in $CONTAINERS; do
  echo "Container: $container"
  docker exec -i $container node -v 2>/dev/null || echo "Cannot exec into container"
  docker exec -i $container npm -v 2>/dev/null || echo "Cannot exec npm"
done

echo "===== Checking Docker Compose Files ====="
if [ -d "/root/oauth-manager" ]; then
  cd /root/oauth-manager
  echo "Contents of docker-compose.yml:"
  cat docker-compose.yml
  echo "Contents of auth-service/Dockerfile:"
  cat auth-service/Dockerfile
fi

echo "===== System Info ====="
uname -a
docker --version
docker-compose --version 