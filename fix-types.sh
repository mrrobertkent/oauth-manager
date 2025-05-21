#!/bin/bash

# Script to fix TypeScript type definitions in Dockerfile

if [ ! -d "/root/oauth-manager" ]; then
  echo "Error: oauth-manager directory not found"
  exit 1
fi

cd /root/oauth-manager

# Backup Dockerfile
cp auth-service/Dockerfile auth-service/Dockerfile.backup3

echo "Updating Dockerfile to include TypeScript type definitions..."
sed -i '/RUN npm ci/c\
# Install dependencies including developer dependencies\
RUN npm ci\
RUN npm install -g typescript\
RUN npm install --save-dev @types/node @types/express @types/cors' auth-service/Dockerfile

# Create tsconfig.json that includes the node types
cat > auth-service/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules"
  ]
}
EOF

echo "Updated Dockerfile:"
cat auth-service/Dockerfile

echo "Updated tsconfig.json:"
cat auth-service/tsconfig.json

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Rebuild and restart containers
echo "Rebuilding containers..."
docker-compose build --no-cache auth-service
docker-compose up -d

# Check container status
echo "Checking container status..."
sleep 5 # Wait for container to start
docker-compose ps

echo "Done!" 