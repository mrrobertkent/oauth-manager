#!/bin/bash

# Script to directly modify config.ts in the container

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

# Create a modified config.ts file
cat > auth-service/src/config.ts << 'EOF'
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';

interface ServiceConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope?: string;
  audience?: string;
}

export interface OrgConfig {
  id: string; // internal org id (e.g., org12345678)
  displayName: string; // human-friendly name
  services: Record<string, ServiceConfig>; // keyed by serviceType (e.g., zohocrm, zohoprojects)
}

export interface Config {
  port: number;
  encryptionKey: string;
  apiKey: string;
}

// Validate environment variables
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is required');
}

// Update the path to look directly in /app/data
const ORGS_FILE = path.join('/app', 'data', 'orgs.json');

if (!fs.existsSync(ORGS_FILE)) {
  throw new Error(`Multi-org config file not found: ${ORGS_FILE}. Please create orgs.json with org configs.`);
}

const orgs: Record<string, OrgConfig> = JSON.parse(fs.readFileSync(ORGS_FILE, 'utf8'));

export function getOrgConfig(orgId: string): OrgConfig | undefined {
  return orgs[orgId];
}

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  encryptionKey: process.env.ENCRYPTION_KEY,
  apiKey: process.env.API_KEY,
};

export default config;
export { orgs };
EOF

echo "Updated config.ts with correct path to orgs.json"

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Rebuild and restart containers
echo "Rebuilding containers..."
docker-compose build --no-cache auth-service
docker-compose up -d

# Check container status
echo "Checking container status..."
sleep 8
docker-compose ps

# Check logs
echo "Checking logs..."
docker-compose logs --tail 30 auth-service

echo "Done!" 