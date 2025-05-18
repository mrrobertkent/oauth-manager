#!/usr/bin/env node

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_KEY = process.env.API_KEY;
const SERVICE_ID = process.argv[2] || 'zohocrm';

if (!API_KEY) {
  console.error('Error: API_KEY environment variable is not set.');
  console.error('Make sure you have created a .env file with the API_KEY.');
  process.exit(1);
}

// Function to get token from OAuth Manager
async function getToken() {
  try {
    console.log(`Requesting token for service: ${SERVICE_ID}`);
    
    const response = await axios.get(`http://localhost:3001/api/token/${SERVICE_ID}`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    console.log('\nSuccess! Token received:');
    console.log('========================');
    console.log(`Access Token: ${response.data.access_token}`);
    console.log(`Expires In: ${response.data.expires_in} seconds`);
    console.log(`Token Type: ${response.data.token_type}`);
    
    // Test using the token with a basic Zoho CRM API call if it's Zoho
    if (SERVICE_ID.toLowerCase() === 'zohocrm') {
      console.log('\nTesting token with Zoho CRM API...');
      
      try {
        // Get the current user's profile using the token
        const apiDomain = response.data.api_domain || 'https://www.zohoapis.com';
        const zohoResponse = await axios.get(`${apiDomain}/crm/v3/users?type=CurrentUser`, {
          headers: {
            'Authorization': `Bearer ${response.data.access_token}`
          }
        });
        
        console.log('\nAPI call successful!');
        console.log('User Info:', zohoResponse.data.users[0].full_name);
      } catch (apiError) {
        console.error('\nAPI call failed:');
        if (apiError.response) {
          console.error(`Status: ${apiError.response.status}`);
          console.error('Response:', apiError.response.data);
        } else {
          console.error(apiError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('\nError:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\nMake sure the OAuth Manager service is running.');
      console.error('You can start it with: ./scripts/local-deploy.sh');
    }
  }
}

getToken(); 