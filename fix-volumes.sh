#!/bin/bash

# Script to fix Docker volume mapping and create orgs.json in the correct location

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

echo "Creating better orgs.json file in the data directory..."
mkdir -p data

# Create a new orgs.json file with correct structure
cat > data/orgs.json << 'EOF'
{
  "default": {
    "name": "Default Organization",
    "id": "default",
    "displayName": "Default Organization",
    "services": {
      "zohocrm": {
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret",
        "redirectUri": "https://your-redirect-uri.com/callback",
        "tokenUrl": "https://accounts.zoho.com/oauth/v2/token",
        "scope": "ZohoCRM.settings.all,ZohoCRM.modules.all",
        "audience": "zohocrm"
      }
    }
  }
}
EOF

echo "Created orgs.json with proper structure"

# Create a better .env file
cat > .env << 'EOF'
# Server configuration
PORT=3001

# Security 
ENCRYPTION_KEY=test-encryption-key-for-development
API_KEY=test-api-key-for-development
EOF

echo "Created .env file with required variables"

# Fix the docker-compose.yml volume mapping
echo "Updating docker-compose.yml file..."
cp docker-compose.yml docker-compose.yml.backup3

# Create a new docker-compose.yml file with corrected volume mapping
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  auth-service:
    build:
      context: ./auth-service
    image: oauth-manager_auth-service
    container_name: oauth-manager-auth-service
    restart: always
    env_file:
      - ./.env
    volumes:
      - ./data:/app/data
    ports:
      - "127.0.0.1:3001:3001"
    networks:
      - automation_net
    command: ["/app/start.sh"]
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  automation_net:
    external: true
EOF

echo "Updated docker-compose.yml with correct volume mapping"

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

# Check if the orgs.json file is accessible inside the container
echo "Checking if orgs.json is accessible inside the container..."
docker exec -it oauth-manager-auth-service ls -la /app/data

# Check logs
echo "Checking logs..."
docker-compose logs --tail 20 auth-service

echo "Done!" 