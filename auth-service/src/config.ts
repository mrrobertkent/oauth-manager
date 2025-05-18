import dotenv from 'dotenv';
dotenv.config();

interface ServiceConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope?: string;
  audience?: string;
}

interface Config {
  port: number;
  encryptionKey: string;
  apiKey: string;
  services: Record<string, ServiceConfig>;
}

// Validate environment variables
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is required');
}

// Load service configurations from environment variables
const services: Record<string, ServiceConfig> = {};

// Find all service-related environment variables
Object.keys(process.env).forEach(key => {
  const match = key.match(/^SERVICE_([A-Z0-9_]+)_CLIENT_ID$/);
  if (match) {
    const serviceName = match[1].toLowerCase();
    const clientId = process.env[key];
    const clientSecret = process.env[`SERVICE_${match[1]}_CLIENT_SECRET`];
    const tokenUrl = process.env[`SERVICE_${match[1]}_TOKEN_URL`];
    const scope = process.env[`SERVICE_${match[1]}_SCOPE`];
    const audience = process.env[`SERVICE_${match[1]}_AUDIENCE`];

    if (!clientSecret) {
      throw new Error(`CLIENT_SECRET for service ${serviceName} is missing`);
    }
    
    if (!tokenUrl) {
      throw new Error(`TOKEN_URL for service ${serviceName} is missing`);
    }

    services[serviceName] = {
      clientId: clientId!,
      clientSecret,
      tokenUrl,
      scope,
      audience
    };
  }
});

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  encryptionKey: process.env.ENCRYPTION_KEY,
  apiKey: process.env.API_KEY,
  services
};

export default config;