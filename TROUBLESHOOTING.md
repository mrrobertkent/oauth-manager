# Troubleshooting Guide

This document covers common issues you might encounter when setting up and running the OAuth Manager service.

## Deployment Issues

### Nested Directory Structure

**Problem:** After cloning from GitHub, you might end up with a nested directory structure (`oauth-manager/oauth-manager`).

**Solution:** Fix the directory structure by moving all files to the parent directory:

```bash
# From the parent directory
cd ~/oauth-manager
cp -a oauth-manager/. .
rm -rf oauth-manager
```

### Port Already Allocated

**Problem:** When starting the container, you encounter: `Bind for 127.0.0.1:3001 failed: port is already allocated`.

**Solution:** Find and remove the conflicting container:

```bash
# Find containers using port 3001
docker ps | grep 3001

# Stop and remove conflicting containers
docker stop [CONTAINER_ID]
docker rm [CONTAINER_ID]
```

### Docker Swarm Network Issues

**Problem:** When using Docker Swarm, you get: `network "automation_net" is declared as external, but it is not in the right scope: "local" instead of "swarm"`.

**Solution:** Either:
1. Switch to Docker Compose deployment (`docker-compose -f docker-compose-local.yml up -d`), or
2. Create the network in swarm scope:

```bash
# Remove the existing network
docker network rm automation_net

# Create the network in swarm scope
docker network create --driver overlay --attachable automation_net
```

## Environment Variables

### Encryption Key Issues

**Problem:** Application fails with error about invalid encryption key length.

**Solution:** The encryption key must be exactly 32 characters. Generate a new one:

```bash
node scripts/generate-keys.js
```

## Container Management

### View Container Logs

To check the logs if the service isn't working as expected:

```bash
# For Docker Compose deployment
docker-compose -f docker-compose-local.yml logs -f auth-service

# For Docker Swarm deployment
docker service logs automation_auth-service
```

### Remove and Rebuild Container

If you need to start fresh:

```bash
# For Docker Compose
docker-compose -f docker-compose-local.yml down
docker-compose -f docker-compose-local.yml up -d --build

# For Docker Swarm
docker stack rm automation
docker stack deploy -c docker-compose.yml automation
```

## Data Persistence

OAuth tokens are stored in a Docker volume. To reset all tokens:

```bash
# List volumes
docker volume ls | grep auth-data

# Remove the volume
docker volume rm oauth-manager_auth-data
# or
docker volume rm automation_auth-data
``` 