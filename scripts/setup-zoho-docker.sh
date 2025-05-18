#!/bin/bash

# This script sets up the .env file with Zoho CRM OAuth credentials
# and deploys the OAuth Manager service using Docker only

# Check if we have at least the client ID and secret
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <client_id> <client_secret> [org_id]"
  echo "Example: $0 1000.ABCDEF123456 secretpassword123 123456789"
  exit 1
fi

CLIENT_ID="$1"
CLIENT_SECRET="$2"
ORG_ID="${3:-your-org-id}"

# Generate secure keys using Docker - ensuring encryption key is exactly 32 bytes
echo "Generating secure encryption keys..."
# Generate a 32-byte key (64 hex characters)
ENCRYPTION_KEY=$(docker run --rm node:18-alpine sh -c "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"")
# Generate API key
API_KEY=$(docker run --rm node:18-alpine sh -c "node -e \"console.log(require('crypto').randomBytes(24).toString('hex'))\"")

# Ensure ENCRYPTION_KEY is exactly 32 bytes (64 hex characters)
if [ ${#ENCRYPTION_KEY} -ne 64 ]; then
  echo "Warning: Generated encryption key is not 64 characters. Padding or truncating..."
  # Pad if too short, truncate if too long
  ENCRYPTION_KEY=$(printf %-64s "$ENCRYPTION_KEY" | tr ' ' '0')
  ENCRYPTION_KEY=${ENCRYPTION_KEY:0:64}
fi

# Create .env file with proper syntax
cat > .env << EOF
# Security
ENCRYPTION_KEY=${ENCRYPTION_KEY}
API_KEY=${API_KEY}

# Zoho CRM Configuration
SERVICE_ZOHOCRM_CLIENT_ID=${CLIENT_ID}
SERVICE_ZOHOCRM_CLIENT_SECRET=${CLIENT_SECRET}
SERVICE_ZOHOCRM_TOKEN_URL=https://accounts.zoho.com/oauth/v2/token
SERVICE_ZOHOCRM_SCOPE=ZohoCRM.settings.ALL,ZohoCRM.modules.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL
SERVICE_ZOHOCRM_AUDIENCE=ZohoCRM.${ORG_ID}
EOF

echo "Environment file created successfully with the following configuration:"
echo "==============================================================="
cat .env
echo "==============================================================="
echo "API_KEY: ${API_KEY}"
echo "This key will be needed to authenticate with the OAuth Manager service."
echo ""
echo "Now deploying the OAuth Manager service with Docker..."
docker-compose -f docker-compose-local.yml down
docker-compose -f docker-compose-local.yml up -d --build

echo ""
echo "To test the service, run:"
echo "./scripts/test-docker.sh" 