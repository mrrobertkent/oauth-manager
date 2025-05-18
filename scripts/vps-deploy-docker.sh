#!/bin/bash

# This script deploys the OAuth Manager to a VPS via SSH using only Docker
# Usage: ./scripts/vps-deploy-docker.sh username@hostname clientId clientSecret [orgId]

if [ -z "$1" ]; then
  echo "Error: Please provide SSH connection string."
  echo "Usage: $0 username@hostname clientId clientSecret [orgId]"
  exit 1
fi

if [ -z "$2" ] || [ -z "$3" ]; then
  echo "Error: Please provide Zoho Client ID and Client Secret."
  echo "Usage: $0 username@hostname clientId clientSecret [orgId]"
  exit 1
fi

SSH_HOST="$1"
CLIENT_ID="$2"
CLIENT_SECRET="$3"
ORG_ID="${4:-your-org-id}"
REMOTE_DIR="/home/${SSH_HOST%%@*}/oauth-manager"

echo "Deploying OAuth Manager to VPS at $SSH_HOST..."

# Make archive of the project excluding node_modules, .git, and data
echo "Creating archive of the project..."
tar --exclude="node_modules" --exclude=".git" --exclude="data" -czf oauth-manager.tar.gz .

# Make sure the remote directory exists
echo "Setting up remote directory..."
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR"

# Copy the archive to the server
echo "Copying project to server..."
scp oauth-manager.tar.gz "$SSH_HOST:$REMOTE_DIR/"

# Extract the archive and set up the project
echo "Extracting and setting up project on server..."
ssh "$SSH_HOST" "cd $REMOTE_DIR && tar -xzf oauth-manager.tar.gz && rm oauth-manager.tar.gz"

# Make sure scripts are executable
echo "Making scripts executable..."
ssh "$SSH_HOST" "cd $REMOTE_DIR && chmod +x scripts/*.sh scripts/*.js"

# Generate keys and set up .env file
echo "Setting up environment with Zoho credentials..."
ssh "$SSH_HOST" "cd $REMOTE_DIR && ./scripts/setup-zoho-docker.sh '$CLIENT_ID' '$CLIENT_SECRET' '$ORG_ID'"

echo "Deployment complete!"
echo ""
echo "To check service status, run:"
echo "ssh $SSH_HOST 'docker ps | grep oauth-manager'"
echo ""
echo "To view logs, run:"
echo "ssh $SSH_HOST 'docker logs oauth-manager-auth-service-1'"

# Cleanup local archive
rm oauth-manager.tar.gz 