import fs from 'fs';
import path from 'path';
import { encrypt, decrypt } from './encryption';

const DATA_DIR = path.join(process.cwd(), 'data');
const TOKEN_FILE = path.join(DATA_DIR, 'tokens.json');

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize token file if it doesn't exist
if (!fs.existsSync(TOKEN_FILE)) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({}), 'utf8');
}

export function saveToken(serviceId: string, tokenData: TokenData): void {
  // Read existing tokens
  let tokens: Record<string, string> = {};
  try {
    const data = fs.readFileSync(TOKEN_FILE, 'utf8');
    tokens = JSON.parse(data);
  } catch (error) {
    console.error('Error reading token file:', error);
  }

  // Encrypt and save the new token
  tokens[serviceId] = encrypt(JSON.stringify(tokenData));
  
  // Write back to file
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf8');
}

export function getToken(serviceId: string): TokenData | null {
  try {
    const data = fs.readFileSync(TOKEN_FILE, 'utf8');
    const tokens: Record<string, string> = JSON.parse(data);
    
    if (tokens[serviceId]) {
      return JSON.parse(decrypt(tokens[serviceId]));
    }
  } catch (error) {
    console.error('Error retrieving token:', error);
  }
  
  return null;
}

export function deleteToken(serviceId: string): boolean {
  try {
    const data = fs.readFileSync(TOKEN_FILE, 'utf8');
    const tokens: Record<string, string> = JSON.parse(data);
    
    if (tokens[serviceId]) {
      delete tokens[serviceId];
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf8');
      return true;
    }
  } catch (error) {
    console.error('Error deleting token:', error);
  }
  
  return false;
}