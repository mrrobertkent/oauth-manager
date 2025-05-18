#!/bin/bash

# Check if .env exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it first." 
  echo "You can copy .env.example and fill in your values."
  exit 1
fi

# Build and deploy
echo "Building and deploying OAuth Manager to the automation stack..."
docker stack deploy -c docker-compose.yml automation

# Check deployment status
echo "Deployment initiated. Checking service status..."
sleep 5
docker stack services automation

echo "OAuth Manager deployment complete."
echo "Use the following command to view logs:"
echo "docker service logs automation_auth-service" 