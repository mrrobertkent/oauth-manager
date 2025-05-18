#!/usr/bin/env node

const crypto = require('crypto');

// Generate a 32-character (256-bit) encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Generate an API key
const apiKey = crypto.randomBytes(24).toString('hex');

console.log('Generated keys for your .env file:');
console.log('==================================');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`API_KEY=${apiKey}`);
console.log('==================================');
console.log('Remember to keep these keys secure and never commit them to version control.'); 