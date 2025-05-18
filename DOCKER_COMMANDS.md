# Docker Commands for OAuth Manager

This document provides useful Docker commands for managing your OAuth Manager service.

## Local Development

### Deploy the Service

```bash
# Initial deployment
./scripts/setup-zoho-docker.sh "your-client-id" "your-client-secret" "your-org-id"

# If already set up, just restart
docker-compose -f docker-compose-local.yml up -d
```

### Check Service Status

```bash
# See all containers
docker ps -a

# Filter to just see oauth-manager
docker ps | grep oauth-manager
```

### View Logs

```bash
# View logs
docker logs oauth-manager-auth-service

# Follow logs in real-time
docker logs -f oauth-manager-auth-service
```

### Stop and Remove Service

```bash
# Stop containers
docker-compose -f docker-compose-local.yml down

# Remove volumes too (will delete stored tokens)
docker-compose -f docker-compose-local.yml down -v
```

### Rebuild the Service

```bash
# Rebuild and restart
docker-compose -f docker-compose-local.yml up -d --build
```

## Remote VPS Management

These commands can be run locally to manage your VPS deployment.

### SSH into the VPS

```bash
ssh username@hostname
```

### Check Remote Service Status

```bash
ssh username@hostname "docker ps | grep oauth-manager"
```

### View Remote Logs

```bash
ssh username@hostname "docker logs oauth-manager-auth-service"
```

### Restart Remote Service

```bash
ssh username@hostname "cd /home/username/oauth-manager && docker-compose -f docker-compose-local.yml restart"
```

### Complete Redeploy

This will redeploy the entire application to your VPS with updated credentials:

```bash
./scripts/vps-deploy-docker.sh username@hostname "your-client-id" "your-client-secret" "your-org-id"
```

## Testing the API

### From Local Machine to Local Service

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3001/api/token/zohocrm
```

### From VPS to VPS Service 

SSH into your VPS first, then:

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3001/api/token/zohocrm
```

### From Docker Container to Service

```bash
./scripts/test-docker.sh
``` 