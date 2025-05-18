#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Path to .env file
const envPath = path.resolve(__dirname, '../.env');

// Load existing .env variables
const existingEnv = dotenv.config({ path: envPath }).parsed || {};

// Zoho CRM configuration
const zohoConfig = {
  SERVICE_ZOHOCRM_CLIENT_ID: process.argv[2] || 'your-zoho-client-id',
  SERVICE_ZOHOCRM_CLIENT_SECRET: process.argv[3] || 'your-zoho-client-secret',
  SERVICE_ZOHOCRM_TOKEN_URL: 'https://accounts.zoho.com/oauth/v2/token',
  SERVICE_ZOHOCRM_SCOPE: 'ZohoCRM.settings.READ,ZohoCRM.modules.ALL',
  SERVICE_ZOHOCRM_AUDIENCE: process.argv[4] || 'ZohoCRM.your-org-id'
};

// Merge existing env with new Zoho config
const newEnv = { ...existingEnv, ...zohoConfig };

// Convert to env file format
const envContent = Object.entries(newEnv)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// Write to .env file
fs.writeFileSync(envPath, envContent);

console.log('Environment variables updated with Zoho CRM configuration.');
console.log('You can now redeploy the service with:');
console.log('./scripts/local-deploy.sh'); 