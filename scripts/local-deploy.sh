#!/bin/bash

# Check if .env exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it first." 
  echo "You can copy .env.example and fill in your values."
  exit 1
fi

# Build and deploy
echo "Building and deploying OAuth Manager locally..."
docker-compose -f docker-compose-local.yml up -d --build

# Check deployment status
echo "Deployment complete. Checking container status..."
docker-compose -f docker-compose-local.yml ps

echo "OAuth Manager local deployment complete."
echo "Use the following command to view logs:"
echo "docker-compose -f docker-compose-local.yml logs -f auth-service" 