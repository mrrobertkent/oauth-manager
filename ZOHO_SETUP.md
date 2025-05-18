# Zoho CRM OAuth Setup Guide

This guide walks you through setting up OAuth credentials for Zoho CRM to use with the OAuth Manager.

## 1. Register a Self Client in Zoho API Console

1. Go to [https://api-console.zoho.com/](https://api-console.zoho.com/)
2. Log in with your Zoho account
3. Click on "Self Client" in the left sidebar
4. Fill in the details:
   - Client Name: "OAuth Manager" (or any descriptive name)
   - Homepage URL: Your website or leave blank for self-use
   - Authorized Redirect URIs: Not required for client credentials flow

## 2. Get Your Credentials

After creating your Self Client, you'll receive:
- Client ID
- Client Secret

Make note of these values as they will be used in your OAuth Manager configuration.

## 3. Find Your Organization ID

1. Log in to Zoho CRM
2. Look at the URL in your browser, which should be something like:
   `https://crm.zoho.com/crm/org/XXXXX/`
3. The `XXXXX` part is your organization ID

## 4. Understanding Zoho CRM OAuth Scopes

The OAuth Manager uses the following scopes by default:

| Scope | Description |
|-------|-------------|
| `ZohoCRM.settings.ALL` | Access to CRM settings (fields, layouts, etc.) |
| `ZohoCRM.modules.ALL` | Access to all CRM modules (leads, contacts, deals, etc.) |
| `ZohoCRM.users.ALL` | Access to user information |
| `ZohoCRM.org.ALL` | Access to organization data |

Other useful scopes include:

| Scope | Description |
|-------|-------------|
| `ZohoCRM.coql.READ` | For running COQL queries |
| `ZohoCRM.bulk.ALL` | For bulk operations |
| `ZohoCRM.notifications.ALL` | For notification operations |

## 5. Deploy OAuth Manager with Your Credentials

Run the setup script with your credentials:

```bash
./scripts/setup-zoho-docker.sh "your-client-id" "your-client-secret" "your-org-id"
```

## 6. Test Your Configuration

Test that your OAuth Manager can successfully obtain tokens:

```bash
./scripts/test-docker.sh
```

You should see a JSON response with an access token if everything is configured correctly.

## 7. Common Issues

### Invalid Client Error

If you receive "invalid_client" errors, double-check:
- Client ID and Client Secret are entered correctly
- You're using the client credentials flow (not code flow)
- Your Self Client is active in the Zoho API Console

### Scope Issues

If you receive scope-related errors, verify:
- The scopes are properly formatted (e.g., `ZohoCRM.modules.ALL`)
- Your account has permissions for the requested scopes
- The scopes are appropriate for your integration needs 