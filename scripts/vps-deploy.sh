#!/bin/bash

# This script deploys the OAuth Manager to a VPS via SSH
# Usage: ./scripts/vps-deploy.sh username@hostname

if [ -z "$1" ]; then
  echo "Error: Please provide SSH connection string."
  echo "Usage: $0 username@hostname"
  exit 1
fi

SSH_HOST="$1"
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

# Check if .env exists on the server
ssh "$SSH_HOST" "cd $REMOTE_DIR && [ -f .env ] || (echo '.env file not found on server. Creating from .env.example...' && cp .env.example .env)"

echo "Project files deployed successfully!"
echo ""
echo "Next steps:"
echo "1. SSH into your server:"
echo "   ssh $SSH_HOST"
echo ""
echo "2. Navigate to the project directory:"
echo "   cd $REMOTE_DIR"
echo ""
echo "3. Configure your Zoho credentials (if not already done):"
echo "   node scripts/setup-zoho.js"
echo ""
echo "4. Deploy the service:"
echo "   ./scripts/local-deploy.sh"
echo ""
echo "5. Test your deployment:"
echo "   node scripts/test-token.js"
echo ""
echo "Note: Make sure Docker is installed on your server."

# Cleanup local archive
rm oauth-manager.tar.gz 