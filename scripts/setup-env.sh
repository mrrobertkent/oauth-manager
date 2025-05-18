#!/bin/bash

# Generate secure keys
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_KEY=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")

# Create .env file with proper syntax
cat > .env << EOF
# Security
ENCRYPTION_KEY=${ENCRYPTION_KEY}
API_KEY=${API_KEY}

# Zoho CRM Configuration
SERVICE_ZOHOCRM_CLIENT_ID=${1:-your-zoho-client-id}
SERVICE_ZOHOCRM_CLIENT_SECRET=${2:-your-zoho-client-secret}
SERVICE_ZOHOCRM_TOKEN_URL=https://accounts.zoho.com/oauth/v2/token
SERVICE_ZOHOCRM_SCOPE=ZohoCRM.settings.READ,ZohoCRM.modules.ALL
SERVICE_ZOHOCRM_AUDIENCE=${3:-ZohoCRM.your-org-id}
EOF

echo "Environment file created successfully with the following configuration:"
echo "==============================================================="
cat .env
echo "==============================================================="
echo "You may need to edit this file to add your actual Zoho credentials." 