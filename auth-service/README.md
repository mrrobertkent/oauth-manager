# OAuth Manager Auth Service

> **Security Warning:**
> The `auth-service/data/orgs.json` file contains sensitive credentials for all organizations and services. **Do NOT commit this file to version control.**
> In production, use a secrets manager (e.g., Doppler, Infisical) or mount this file as a secret. See below for recommendations.

## Multi-Organization & Multi-Service Configuration

This service now supports multiple organizations and multiple Zoho (or other) services per organization. Each org is assigned a unique internal ID (e.g., `org12345678`) and a human-friendly display name. Each org can have multiple services (e.g., `zohocrm`, `zohoprojects`), each with its own credentials.

### Configuration File: `auth-service/data/orgs.json`

Example structure:

```json
{
  "org12345678": {
    "id": "org12345678",
    "displayName": "Acme Corp",
    "services": {
      "zohocrm": {
        "clientId": "acme-crm-client-id",
        "clientSecret": "acme-crm-secret",
        "tokenUrl": "https://accounts.zoho.com/oauth/v2/token",
        "scope": "ZohoCRM.settings.ALL,ZohoCRM.modules.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL",
        "audience": "ZohoCRM.12345678"
      },
      "zohoprojects": {
        "clientId": "acme-projects-client-id",
        "clientSecret": "acme-projects-secret",
        "tokenUrl": "https://accounts.zoho.com/oauth/v2/token",
        "scope": "ZohoProjects.portals.READ,ZohoProjects.projects.ALL",
        "audience": "ZohoCRM.12345678"
      }
    }
  }
}
```

- Add new orgs by creating a new key (e.g., `org98765432`) with the same structure.
- Add new services under the `services` object for each org.
- Each org must have a unique `id` and a `displayName`.

### API Endpoints

- **Get Token:**
  - `GET /api/token/:orgId/:serviceType`
  - Example: `/api/token/org12345678/zohocrm`
- **n8n Integration:**
  - `GET /api/n8n/token/:orgId/:serviceType`
- **Admin Revoke Token:**
  - `POST /api/admin/revoke/:orgId/:serviceType`
- **Admin Status:**
  - `GET /api/admin/status`

All endpoints now require both `orgId` and `serviceType` as path parameters.

### Notes
- Only one DC (data center) per org is supported at this time.
- Credentials are no longer loaded from environment variables for services; use `orgs.json` instead.
- Future plans include full multi-tenancy, where different users can access the authentication service but cannot access other users' data. The current design is future-proofed for this.

### Migration
- Remove any old service-related environment variables from your `.env` file.
- Create and maintain your org/service configs in `auth-service/data/orgs.json`.

### Adding a New Organization
1. Generate a unique org ID (e.g., `org98765432`).
2. Add a new entry in `orgs.json` with the org's display name and service configs.
3. Use the new API endpoints with the org ID and service type.

## Secrets Management in Production

- **Never commit real secrets to version control.**
- For local development, use `auth-service/data/orgs.json` (which is now in `.gitignore`).
- For production, use a secrets manager:
  - **[Doppler](https://doppler.com/):** Free, easy to integrate, cloud-agnostic, and supports Node.js. Recommended for most teams.
  - **[Infisical](https://infisical.com/):** Open source, free tier, easy Node.js integration.
  - **1Password Developer Secrets** and **HashiCorp Vault** are also good options, but may require more setup.
- You can also mount `orgs.json` as a Docker/Kubernetes secret if not using a secrets manager.

**See [GitGuardian: Top Secrets Management Tools for 2024](https://blog.gitguardian.com/top-secrets-management-tools-for-2024/) for a comparison.**

---

For more details, see the code comments and the example `orgs.json` file. 