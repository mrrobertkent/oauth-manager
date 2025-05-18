# OAuth Manager

A secure OAuth token management service for handling OAuth 2.0 client credentials flow and token refresh.

## Features

- Manages OAuth 2.0 tokens for multiple services
- Securely stores encrypted tokens
- Automatic token refresh
- API key authentication
- Rate limiting
- Docker containerization

## Setup

1. Clone the repository
2. Create a `.env` file based on the `.env.example` (ensure the ENCRYPTION_KEY is exactly 32 characters)
3. Deploy using one of the methods below:

### Deploy with Docker Compose (Recommended)

Docker Compose is the simplest way to deploy the service locally or on a VPS:

```bash
# Create the .env file with your configuration
cp .env.example .env
nano .env  # Edit with your actual credentials

# Make the deployment script executable
chmod +x scripts/local-deploy.sh

# Deploy locally
./scripts/local-deploy.sh

# Or manually:
docker-compose -f docker-compose-local.yml up -d
```

### Deploy with Docker Swarm

Note: Docker Swarm deployment requires an external network named `automation_net` to be in swarm scope. If you're experiencing network issues, use Docker Compose instead.

```bash
# Create the .env file with your configuration
cp .env.example .env
nano .env  # Edit with your actual credentials

# Make the deployment script executable
chmod +x scripts/deploy.sh

# Deploy to the automation stack
docker stack deploy -c docker-compose.yml automation
```

## Environment Variables

The following environment variables are required:

- `ENCRYPTION_KEY`: 32-character key for token encryption
- `API_KEY`: Secret key for accessing the API
- Service-specific variables for each OAuth service:
  - `SERVICE_{NAME}_CLIENT_ID`
  - `SERVICE_{NAME}_CLIENT_SECRET`
  - `SERVICE_{NAME}_TOKEN_URL`
  - `SERVICE_{NAME}_SCOPE` (optional)
  - `SERVICE_{NAME}_AUDIENCE` (optional)

You can generate secure keys using the provided script:

```bash
node scripts/generate-keys.js
```

## API Endpoints

- `GET /health`: Health check endpoint
- `GET /api/token/:serviceId`: Get valid token for a service (API key required)
- `GET /api/n8n/token/:serviceId`: Get token as plain text for n8n integration
- `GET /api/admin/status`: Get service statuses
- `POST /api/admin/revoke/:serviceId`: Revoke tokens for a service

## Usage

To get a token for a service:

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3001/api/token/example
```

## Troubleshooting

### Port Already Allocated
If you encounter an error like `Bind for 127.0.0.1:3001 failed: port is already allocated`, you already have a container using this port. Stop or remove the conflicting container:

```bash
# Find containers using port 3001
docker ps | grep 3001

# Stop and remove conflicting containers
docker stop [CONTAINER_ID]
docker rm [CONTAINER_ID]
```

### Directory Structure
Ensure you aren't running from a nested directory structure. If you see `oauth-manager/oauth-manager`, you should fix this by moving the files:

```bash
# From nested directory
cd ~/oauth-manager
cp -a oauth-manager/. .
rm -rf oauth-manager
```
