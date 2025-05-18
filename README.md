# OAuth Manager

A secure OAuth token management service for handling multiple organizations and service integrations, optimized for Zoho APIs, Docker, and Doppler.

## Features

- Secure token storage with encryption
- Automatic token refresh
- Support for multiple organizations and service types
- Rate limiting and security headers
- Docker and Docker Compose support
- Integrated with Doppler for secrets management
- Comprehensive error handling and logging
- Microservice-ready architecture

## Requirements

- Node.js 18+
- Docker and Docker Compose (for containerized deployment)
- Zoho Developer Account (for Zoho API integration)
- Doppler account (recommended for production secrets management)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/oauth-manager.git
cd oauth-manager
```

### 2. Set up configuration

Create an `auth-service/data/orgs.json` file with your organization and service details:

```json
{
  "org12345678": {
    "id": "org12345678",
    "displayName": "Acme Corp",
    "services": {
      "zohocrm": {
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret",
        "tokenUrl": "https://accounts.zoho.com/oauth/v2/token",
        "scope": "ZohoCRM.settings.ALL,ZohoCRM.modules.ALL",
        "audience": "ZohoCRM.1234567890"
      }
    }
  }
}
```

### 3. Local Development Setup

```bash
# Install dependencies
npm install

# Set up local environment
cp .env.example .env
node scripts/generate-keys.js >> .env

# Run the service
npm run dev
```

### 4. Docker Deployment

```bash
# Build and start containers
docker-compose -f docker-compose-local.yml up -d
```

## Doppler Integration (Recommended for Production)

OAuth Manager supports Doppler for secure secrets management:

1. [Create a Doppler account](https://doppler.com)
2. Set up a project and add your secrets (API keys, encryption keys, etc.)
3. Generate a service token in Doppler
4. Deploy using Docker Compose with Doppler:

```bash
# Set your Doppler service token
export DOPPLER_TOKEN=dp.st.your-token

# Deploy with Docker Compose
docker-compose up -d
```

## API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/health` | GET | Health check | No |
| `/api/token/:orgId/:serviceType` | GET | Get a valid access token | Yes (API Key) |
| `/api/n8n/token/:orgId/:serviceType` | GET | Get token for n8n integrations | Yes (API Key) |
| `/api/admin/status` | GET | Get status of all token services | Yes (Admin) |
| `/api/admin/revoke/:orgId/:serviceType` | POST | Revoke cached tokens | Yes (Admin) |

## Error Handling

The service provides detailed error responses to help troubleshoot issues:

```json
{
  "success": false,
  "error": {
    "message": "Service 'unknownservice' not found for org 'org12345678'",
    "code": "ERR_404"
  }
}
```

Common error codes include:
- `MISSING_PARAMETERS`: Required parameters missing
- `ERR_401`: Authentication failure
- `ERR_404`: Resource not found
- `AUTH_FAILED`: Provider authentication failed
- `ERR_500`: Unexpected server error

For more details, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Multi-Organization Setup

OAuth Manager supports multiple organizations, with each organization supporting multiple services:

1. Each organization needs a unique ID (`org12345678`)
2. Each organization can have multiple services (e.g., `zohocrm`, `zohoprojects`)
3. Each service has its own credentials and configuration

For more detailed information, see [auth-service/README.md](auth-service/README.md).

## Security Considerations

- Never commit `orgs.json` to version control (it's in `.gitignore`)
- In production, use Doppler or another secrets manager
- All tokens are encrypted at rest using AES-256
- API endpoints are protected by API key authentication
- Rate limiting is enabled to prevent abuse

## Documentation

- [AUTH_WEB_UI_PLAN.md](AUTH_WEB_UI_PLAN.md) - Future UI plans
- [DOCKER_COMMANDS.md](DOCKER_COMMANDS.md) - Docker reference
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - GitHub integration guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [ZOHO_SETUP.md](ZOHO_SETUP.md) - Zoho integration guide

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Zoho API Documentation](https://www.zoho.com/crm/developer/docs/api/v2/oauth-overview.html)
- [Doppler](https://doppler.com) for secrets management
