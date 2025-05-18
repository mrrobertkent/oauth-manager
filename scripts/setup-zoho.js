#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the absolute path to the .env file
const envFilePath = path.resolve(__dirname, '../.env');

// Check if .env exists
if (!fs.existsSync(envFilePath)) {
  console.log('No .env file found. Creating one from .env.example...');
  
  // Check if .env.example exists
  const examplePath = path.resolve(__dirname, '../.env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envFilePath);
  } else {
    fs.writeFileSync(envFilePath, '# Security\nENCRYPTION_KEY=\nAPI_KEY=\n\n# Zoho CRM configuration\n');
  }
}

// Generate encryption and API keys if they don't exist
let needKeysGenerated = false;
let currentEnv = fs.readFileSync(envFilePath, 'utf8');

if (!currentEnv.includes('ENCRYPTION_KEY=') || 
    currentEnv.includes('ENCRYPTION_KEY=your-32-character-encryption-key') ||
    currentEnv.includes('ENCRYPTION_KEY=') && currentEnv.split('ENCRYPTION_KEY=')[1].split('\n')[0].length < 32) {
  needKeysGenerated = true;
}

if (needKeysGenerated) {
  const crypto = require('crypto');
  const encryptionKey = crypto.randomBytes(32).toString('hex');
  const apiKey = crypto.randomBytes(24).toString('hex');
  
  console.log('\nGenerated new secure keys:');
  console.log(`ENCRYPTION_KEY=${encryptionKey}`);
  console.log(`API_KEY=${apiKey}\n`);
  
  // Update .env file with new keys
  currentEnv = currentEnv.replace(/ENCRYPTION_KEY=.*(\n|$)/, `ENCRYPTION_KEY=${encryptionKey}\n`);
  currentEnv = currentEnv.replace(/API_KEY=.*(\n|$)/, `API_KEY=${apiKey}\n`);
  fs.writeFileSync(envFilePath, currentEnv);
}

console.log('Setting up Zoho CRM OAuth credentials\n');

const questions = [
  {
    name: 'clientId',
    question: 'Enter your Zoho Client ID: ',
    envVar: 'SERVICE_ZOHOCRM_CLIENT_ID'
  },
  {
    name: 'clientSecret',
    question: 'Enter your Zoho Client Secret: ',
    envVar: 'SERVICE_ZOHOCRM_CLIENT_SECRET'
  },
  {
    name: 'orgId',
    question: 'Enter your Zoho Organization ID: ',
    envVar: 'SERVICE_ZOHOCRM_AUDIENCE',
    transform: value => `ZohoCRM.${value}`
  }
];

const answers = {};

// Process each question sequentially using recursion
function askQuestion(index) {
  if (index >= questions.length) {
    updateEnvFile();
    return;
  }
  
  const q = questions[index];
  rl.question(q.question, (answer) => {
    if (answer.trim() === '') {
      console.log('This field is required. Please try again.');
      askQuestion(index);
      return;
    }
    
    answers[q.name] = q.transform ? q.transform(answer) : answer;
    askQuestion(index + 1);
  });
}

function updateEnvFile() {
  console.log('\nUpdating .env file with Zoho credentials...');
  
  let envContent = fs.readFileSync(envFilePath, 'utf8');
  
  // Add/update Zoho CRM config
  const zohoConfig = `
# Service: Zoho CRM
SERVICE_ZOHOCRM_CLIENT_ID=${answers.clientId}
SERVICE_ZOHOCRM_CLIENT_SECRET=${answers.clientSecret}
SERVICE_ZOHOCRM_TOKEN_URL=https://accounts.zoho.com/oauth/v2/token
SERVICE_ZOHOCRM_SCOPE=ZohoCRM.settings.READ,ZohoCRM.modules.ALL
SERVICE_ZOHOCRM_AUDIENCE=${answers.orgId}
`;

  // Check if Zoho config exists
  if (envContent.includes('SERVICE_ZOHOCRM_CLIENT_ID')) {
    // Replace existing config
    const regex = /# Service: Zoho CRM[\s\S]*?SERVICE_ZOHOCRM_AUDIENCE=.*/g;
    envContent = envContent.replace(regex, zohoConfig.trim());
  } else {
    // Add new config
    envContent += zohoConfig;
  }
  
  // Remove any example service config
  if (envContent.includes('SERVICE_EXAMPLE_CLIENT_ID')) {
    envContent = envContent.replace(/# Service: Example[\s\S]*?SERVICE_EXAMPLE_AUDIENCE=.*(\n|$)/g, '');
  }
  
  // Write updated content back to .env file
  fs.writeFileSync(envFilePath, envContent);
  
  console.log('\nZoho CRM credentials have been configured successfully!');
  console.log('\nYou can now deploy the OAuth Manager service with:');
  console.log('chmod +x scripts/local-deploy.sh');
  console.log('./scripts/local-deploy.sh');
  
  rl.close();
}

// Start asking questions
askQuestion(0); 