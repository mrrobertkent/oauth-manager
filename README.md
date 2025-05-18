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
3. Deploy using Docker Stack:

```bash
# Create the .env file with your configuration
cp .env.example .env
nano .env  # Edit with your actual credentials

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