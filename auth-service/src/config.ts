import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';

interface ServiceConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scope?: string;
  audience?: string;
}

export interface OrgConfig {
  id: string; // internal org id (e.g., org12345678)
  displayName: string; // human-friendly name
  services: Record<string, ServiceConfig>; // keyed by serviceType (e.g., zohocrm, zohoprojects)
}

export interface Config {
  port: number;
  encryptionKey: string;
  apiKey: string;
}

// Validate environment variables
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is required');
}

const ORGS_FILE = path.join(process.cwd(), 'auth-service', 'data', 'orgs.json');

if (!fs.existsSync(ORGS_FILE)) {
  throw new Error(`Multi-org config file not found: ${ORGS_FILE}. Please create orgs.json with org configs.`);
}

const orgs: Record<string, OrgConfig> = JSON.parse(fs.readFileSync(ORGS_FILE, 'utf8'));

export function getOrgConfig(orgId: string): OrgConfig | undefined {
  return orgs[orgId];
}

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  encryptionKey: process.env.ENCRYPTION_KEY,
  apiKey: process.env.API_KEY,
};

export default config;
export { orgs };