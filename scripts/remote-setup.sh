#!/bin/bash

# Set up the OAuth Manager with Zoho CRM on a remote server
# This script should be run on the VPS

# Navigate to the project directory
cd /home/root/oauth-manager

# Install npm dependencies first
npm install dotenv

# Generate encryption and API keys
node scripts/generate-keys.js > .env

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    apt update
    apt install -y docker.io docker-compose
    systemctl enable docker
    systemctl start docker
fi

# Deploy with Docker Compose
chmod +x scripts/local-deploy.sh
./scripts/local-deploy.sh

# Show the logs
docker-compose -f docker-compose-local.yml logs auth-service 