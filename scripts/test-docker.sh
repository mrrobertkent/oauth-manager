#!/bin/bash

# This script tests the OAuth Manager service entirely within Docker
SERVICE_ID="${1:-zohocrm}"

# Check if the container is running
if ! docker ps | grep -q oauth-manager-auth-service; then
  echo "Error: OAuth Manager service is not running."
  echo "Start it first with: docker-compose -f docker-compose-local.yml up -d"
  exit 1
fi

# Load API key from .env file
if [ -f .env ]; then
  API_KEY=$(grep API_KEY .env | cut -d= -f2)
else
  echo "Error: .env file not found."
  echo "Set up the service first with: ./scripts/setup-zoho-docker.sh"
  exit 1
fi

echo "Testing OAuth Manager service for service ID: $SERVICE_ID"
echo "Using API Key: $API_KEY"

# First try the direct approach without Docker
echo "Testing with direct HTTP request..."
curl -s -H "x-api-key: $API_KEY" "http://localhost:3001/api/token/$SERVICE_ID" | jq .

echo -e "\nDone! Use the API key and base URL in your applications:"
echo -e "API Key: $API_KEY"
echo -e "Base URL: http://localhost:3001\n"

echo "Example usage in shell:"
echo "curl -H \"x-api-key: $API_KEY\" http://localhost:3001/api/token/$SERVICE_ID"

echo -e "\nExample usage in JavaScript/Node.js:"
echo -e "const axios = require('axios');\n"
echo "axios.get('http://localhost:3001/api/token/$SERVICE_ID', {"
echo "  headers: {"
echo "    'x-api-key': '$API_KEY'"
echo "  }"
echo "}).then(response => {"
echo "  console.log('Token:', response.data.access_token);"
echo "});" 