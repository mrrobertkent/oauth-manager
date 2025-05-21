#!/bin/bash

# Script to create necessary configuration files for the auth service

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

# Create data directory if it doesn't exist
mkdir -p auth-service/data

# Create a basic orgs.json file
cat > auth-service/data/orgs.json << 'EOF'
{
  "default": {
    "name": "Default Organization",
    "config": {
      "zohocrm": {
        "client_id": "${SERVICE_ZOHOCRM_CLIENT_ID}",
        "client_secret": "${SERVICE_ZOHOCRM_CLIENT_SECRET}",
        "redirect_uri": "https://your-redirect-uri.com/callback",
        "token_url": "${SERVICE_ZOHOCRM_TOKEN_URL}",
        "scope": "${SERVICE_ZOHOCRM_SCOPE}",
        "audience": "${SERVICE_ZOHOCRM_AUDIENCE}"
      }
    }
  }
}
EOF

echo "Created orgs.json file:"
cat auth-service/data/orgs.json

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Rebuild and restart containers
echo "Rebuilding containers..."
docker-compose up -d

# Check container status
echo "Checking container status..."
sleep 5 # Wait for container to start
docker-compose ps

echo "Checking logs..."
docker-compose logs --tail 20 auth-service

echo "Done!" 