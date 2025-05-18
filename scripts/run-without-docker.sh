#!/bin/bash

# Run the OAuth Manager service without Docker
cd "$(dirname "$0")/.."
BASEDIR=$(pwd)

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing..."
    apt update
    apt install -y nodejs npm
fi

# Generate environment configuration
echo "Generating security keys..."
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_KEY=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")

# Create .env file
cat > .env << EOF
# Security
ENCRYPTION_KEY=${ENCRYPTION_KEY}
API_KEY=${API_KEY}

# Zoho CRM Configuration
SERVICE_ZOHOCRM_CLIENT_ID=your-zoho-client-id
SERVICE_ZOHOCRM_CLIENT_SECRET=your-zoho-client-secret
SERVICE_ZOHOCRM_TOKEN_URL=https://accounts.zoho.com/oauth/v2/token
SERVICE_ZOHOCRM_SCOPE=ZohoCRM.settings.READ,ZohoCRM.modules.ALL
SERVICE_ZOHOCRM_AUDIENCE=ZohoCRM.your-org-id
EOF

echo "Environment configuration created."
echo "API Key: ${API_KEY}"

# Install dependencies and build the auth service
echo "Installing dependencies for auth service..."
cd "${BASEDIR}/auth-service"
npm install
npm run build

# Create data directory if it doesn't exist
mkdir -p "${BASEDIR}/auth-service/data"

# Run the service
echo "Starting auth service..."
PORT=3001 \
NODE_ENV=production \
ENCRYPTION_KEY="${ENCRYPTION_KEY}" \
API_KEY="${API_KEY}" \
SERVICE_ZOHOCRM_CLIENT_ID="your-zoho-client-id" \
SERVICE_ZOHOCRM_CLIENT_SECRET="your-zoho-client-secret" \
SERVICE_ZOHOCRM_TOKEN_URL="https://accounts.zoho.com/oauth/v2/token" \
SERVICE_ZOHOCRM_SCOPE="ZohoCRM.settings.READ,ZohoCRM.modules.ALL" \
SERVICE_ZOHOCRM_AUDIENCE="ZohoCRM.your-org-id" \
nohup node dist/index.js > ../oauth-manager.log 2>&1 &

echo "Auth service started on port 3001 in background."
echo "To view logs: tail -f ${BASEDIR}/oauth-manager.log"
echo "To test: node ${BASEDIR}/scripts/test-token.js" 