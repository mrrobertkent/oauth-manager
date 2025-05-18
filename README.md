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

## Setup with Zoho CRM

The easiest way to set up the OAuth Manager with Zoho CRM is to use the provided Docker scripts:

```bash
# Set up with your Zoho credentials
./scripts/setup-zoho-docker.sh "your-client-id" "your-client-secret" "your-org-id"

# Test the service
./scripts/test-docker.sh
```

### Zoho CRM Integration

To use Zoho CRM with this service:

1. Create a Self Client in Zoho API Console at [https://api-console.zoho.com/](https://api-console.zoho.com/)
2. Generate client ID and secret for your Self Client
3. Note your organization ID from the Zoho CRM URL (e.g., `https://crm.zoho.com/crm/org/XXXXX/`)
4. Deploy the OAuth Manager with your Zoho credentials as shown above

The service uses these scopes by default:
- `ZohoCRM.settings.ALL` - Access to settings API
- `ZohoCRM.modules.ALL` - Access to all CRM modules
- `ZohoCRM.users.ALL` - Access to user information
- `ZohoCRM.org.ALL` - Access to organization data

### Deploy to VPS

To deploy to a VPS with Docker, use the provided script:

```bash
./scripts/vps-deploy-docker.sh username@hostname "your-client-id" "your-client-secret" "your-org-id"
```

This script will:
1. Package and transfer the application to your VPS
2. Set up the Docker environment with your credentials
3. Start the service in a Docker container

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

## Adding a New OAuth Service

To add a new OAuth service (for example, Zoho Projects), follow these steps:

1. **Add service credentials to your `.env` file**

   Use the following pattern, replacing `ZOHOPROJECTS` with your chosen service name (all caps, no spaces), and fill in your actual credentials:

   ```env
   SERVICE_ZOHOPROJECTS_CLIENT_ID=your-zoho-projects-client-id
   SERVICE_ZOHOPROJECTS_CLIENT_SECRET=your-zoho-projects-client-secret
   SERVICE_ZOHOPROJECTS_TOKEN_URL=https://accounts.zoho.com/oauth/v2/token
   SERVICE_ZOHOPROJECTS_SCOPE=ZohoProjects.portals.READ,ZohoProjects.projects.ALL
   # Optionally, add audience if required by the service:
   # SERVICE_ZOHOPROJECTS_AUDIENCE=your-audience
   ```

   - The service name (e.g., `zohoprojects`) will be used as the `serviceId` in the API endpoint.
   - You can add as many services as you need, each with a unique name.

2. **Restart the OAuth Manager service**

   This ensures the new environment variables are loaded. For Docker Compose:
   ```bash
   docker-compose -f docker-compose-local.yml up -d --build
   ```
   Or use your deployment method.

3. **Access the new service's token endpoint**

   Use the service name (lowercase) as the `serviceId` in the API call:
   ```bash
   curl -H "x-api-key: YOUR_API_KEY" https://auth.convergex.app/api/token/zohoprojects
   ```
   Replace `YOUR_API_KEY` with your actual API key from the `.env` file.

**Note:**
- The `serviceId` in the endpoint must match the name you used in your `.env` variables (case-insensitive).
- You can repeat these steps for any new OAuth service you want to add.

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
