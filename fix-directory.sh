#!/bin/bash

# Script to fix directory structure and environment variables

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

# Create directories with proper structure
echo "Creating proper directory structure..."
mkdir -p data
mv auth-service/data/orgs.json data/orgs.json 2>/dev/null || echo "No orgs.json to move"

# Create a new orgs.json file in the correct location
cat > data/orgs.json << 'EOF'
{
  "default": {
    "name": "Default Organization",
    "config": {
      "zohocrm": {
        "client_id": "your-client-id",
        "client_secret": "your-client-secret",
        "redirect_uri": "https://your-redirect-uri.com/callback",
        "token_url": "https://accounts.zoho.com/oauth/v2/token",
        "scope": "ZohoCRM.settings.all,ZohoCRM.modules.all",
        "audience": "zohocrm"
      }
    }
  }
}
EOF

echo "Created orgs.json in the correct location."

# Create a basic .env file
cat > .env << 'EOF'
# Server configuration
PORT=3001

# Security (generate a random encryption key)
ENCRYPTION_KEY=$(openssl rand -base64 24)
API_KEY=test-api-key-for-development

# Service: Zoho CRM
SERVICE_ZOHOCRM_CLIENT_ID=your-client-id
SERVICE_ZOHOCRM_CLIENT_SECRET=your-client-secret
SERVICE_ZOHOCRM_TOKEN_URL=https://accounts.zoho.com/oauth/v2/token
SERVICE_ZOHOCRM_SCOPE=ZohoCRM.settings.all,ZohoCRM.modules.all
SERVICE_ZOHOCRM_AUDIENCE=zohocrm
EOF

echo "Created basic .env file."

# Update Docker volume mapping in docker-compose.yml
echo "Updating Docker volume mapping..."
cp docker-compose.yml docker-compose.yml.backup2
sed -i 's|- ./auth-service/data:/app/data|- ./data:/app/data|g' docker-compose.yml
sed -i 's|.- auth-service/data:/app/data|.- ./data:/app/data|g' docker-compose.yml  # Alternative format

# Add environment variable reference in docker-compose.yml
if ! grep -q "env_file:" docker-compose.yml; then
  sed -i '/services:/a\  auth-service:\n    env_file:\n      - ./.env' docker-compose.yml
fi

echo "Updated Docker configuration."

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