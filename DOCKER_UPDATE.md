# Docker and Node.js Update

## Changes Implemented

This update includes the following improvements:

1. **Node.js Version Upgrade**:
   - Updated from Node.js 18 to Node.js 20 LTS (Iron)
   - Node.js 20 has Long Term Support until April 2026

2. **Docker Security Enhancements**:
   - Added non-root user to the Docker container
   - Set NODE_ENV to production
   - Fixed volume mapping in docker-compose files

3. **Container Stability Improvements**:
   - Added health check to monitor container health
   - Improved restart policy
   - Changed command from `npm start` to direct `node dist/index.js` execution

4. **Volume Path Correction**:
   - Fixed the volume path in docker-compose-local.yml to properly map to the container path

## Benefits

- **Security**: Running as a non-root user reduces the potential impact of container breakouts
- **Performance**: Node.js 20 offers improved performance and reduced memory usage
- **Stability**: Health checks enable automatic recovery from failures
- **Maintenance**: Using LTS version ensures long-term security updates

## Testing

Before merging these changes, please test the updates using the following steps:

1. Build and run locally:
   ```bash
   docker-compose -f docker-compose-local.yml build
   docker-compose -f docker-compose-local.yml up
   ```

2. Test the API endpoints to ensure functionality is preserved
3. Check container logs for any errors or warnings
4. Verify the health endpoint is accessible

## Rollback

If issues are found, you can revert to the previous version by checking out the main branch:

```bash
git checkout main
docker-compose -f docker-compose-local.yml build
docker-compose -f docker-compose-local.yml up
``` 