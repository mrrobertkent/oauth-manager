# Troubleshooting OAuth Manager

This document provides solutions for common issues you might encounter when using the OAuth Manager.

## Common Error Codes and Solutions

### API Errors

| Status Code | Error Code | Description | Solution |
|-------------|------------|-------------|----------|
| 400 | `MISSING_PARAMETERS` | Required parameters are missing in the request. | Ensure your request includes both the `orgId` and `serviceType` parameters. |
| 401 | `ERR_401` | Unauthorized: Invalid API key. | Check that you're providing a valid API key in the `x-api-key` header. |
| 404 | `ERR_404` | Org config or service not found. | Verify the `orgId` and `serviceType` exist in your `auth-service/data/orgs.json` file. |
| 500 | `ERR_500` | Internal server error. | Check the service logs for more detailed information. |
| 500 | `AUTH_FAILED` | Authentication with the service provider failed. | Verify the client ID and secret for the service are correct. |

### Common Issues

#### "Cannot GET /api/token/orgId/serviceType"

This error occurs when the requested API endpoint is not formatted correctly.

**Solution:**
- Ensure you're using the correct API endpoint format: `/api/token/:orgId/:serviceType`
- Verify that both `orgId` and `serviceType` match entries in your `orgs.json` file
- Make sure the URL path doesn't have any typos or extra characters

#### "Org config for 'X' not found"

This error occurs when the specified organization ID doesn't exist in the configuration.

**Solution:**
- Check your `auth-service/data/orgs.json` file to confirm the organization ID exists
- Verify the spelling of the organization ID in your request
- Remember that organization IDs are case-sensitive

#### "Service 'X' not found for org 'Y'"

This error occurs when the specified service type doesn't exist for the given organization.

**Solution:**
- Check your `auth-service/data/orgs.json` file to confirm the service type exists for that organization
- Verify the spelling of the service type in your request
- Add the service configuration to the organization if needed

#### Authentication Failures

If you're getting authentication errors when the service tries to obtain tokens:

**Solution:**
- Verify that client ID and secret values in `orgs.json` are correct
- Check that the service account has the necessary permissions
- For Zoho services, ensure the scope and audience values are correctly set
- Make sure your tokens aren't expired or revoked in the service provider's console

#### Docker Volume Mount Issues

If Docker can't find the `orgs.json` file:

**Solution:**
- Ensure you've created the `auth-service/data/orgs.json` file on your host system
- Check that your volume mount in `docker-compose.yml` is correctly configured: 
  ```yaml
  volumes:
    - ./auth-service/data:/app/auth-service/data
  ```
- Verify file permissions allow Docker to read the file
- Try restarting the Docker container after confirming the file exists

## Doppler Integration Issues

### Missing Secrets

If your application can't find environment variables from Doppler:

**Solution:**
- Verify your Doppler token is correctly set: `export DOPPLER_TOKEN=dp.st.xxxx`
- Make sure Docker Compose is configured to use the Doppler token
- Check that the secrets exist in your Doppler project
- Try running `doppler run -- env` to verify that secrets are correctly loaded

### Container Startup Failures with Doppler

If your container fails to start with Doppler:

**Solution:**
- Check that the Doppler CLI is correctly installed in your Dockerfile
- Ensure the `DOPPLER_TOKEN` environment variable is passed to the container
- Verify the service token has the correct permissions in Doppler
- Look at container logs for specific Doppler-related errors: 
  ```
  docker-compose logs auth-service
  ```

## Configuration Issues

### Multiple Organization Setup

Problems with multiple organizations configuration:

**Solution:**
- Ensure each organization has a unique ID in `orgs.json`
- Verify that each organization has the required fields (`id`, `displayName`, `services`)
- Check that each service has the required fields (`clientId`, `clientSecret`, `tokenUrl`)
- Validate your JSON syntax with a JSON validator

## Storage Issues

If token storage is failing:

**Solution:**
- Check that the `auth-service/data` directory exists and is writable
- Verify file permissions for the `tokens.json` file
- If using Docker, ensure the volume mount for the data directory is correct
- Try deleting the `tokens.json` file and letting the service recreate it

## Additional Help

If you're still experiencing issues:

1. Check the auth service logs for detailed error messages:
   ```
   docker-compose logs auth-service
   ```

2. Try enabling more verbose logging by setting the `NODE_ENV` to `development` in your `.env` file or Doppler config.

3. Report the issue with:
   - The exact error message you're receiving
   - Your `docker-compose.yml` configuration (without secrets)
   - The steps to reproduce the issue 