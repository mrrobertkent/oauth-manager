import fs from 'fs';
import path from 'path';
import { encrypt, decrypt } from './encryption';

const DATA_DIR = path.join(process.cwd(), 'auth-service', 'data');
const TOKEN_FILE = path.join(DATA_DIR, 'tokens.json');

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// Custom storage-related errors
export class StorageError extends Error {
  name = 'StorageError';
  constructor(message: string) {
    super(message);
  }
}

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory: ${DATA_DIR}`);
  }
} catch (error: any) {
  console.error(`Failed to create data directory ${DATA_DIR}:`, error.message);
  throw new StorageError(`Failed to initialize storage: ${error.message}`);
}

// Initialize token file if it doesn't exist
try {
  if (!fs.existsSync(TOKEN_FILE)) {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({}), 'utf8');
    console.log(`Created tokens file: ${TOKEN_FILE}`);
  }
} catch (error: any) {
  console.error(`Failed to create token file ${TOKEN_FILE}:`, error.message);
  throw new StorageError(`Failed to initialize token storage: ${error.message}`);
}

/**
 * Save token data for a specific org/service
 * @param key The org:service key
 * @param tokenData The token data to save
 * @throws StorageError if writing to file fails
 */
export function saveToken(key: string, tokenData: TokenData): void {
  if (!key) {
    throw new StorageError('Cannot save token: Key is required');
  }
  
  if (!tokenData || !tokenData.accessToken) {
    throw new StorageError('Cannot save token: Invalid token data');
  }
  
  let tokens: Record<string, string> = {};
  
  try {
    // Read existing tokens
    try {
      const data = fs.readFileSync(TOKEN_FILE, 'utf8');
      tokens = JSON.parse(data);
    } catch (readError: any) {
      console.warn(`Token file could not be read, will create new: ${readError.message}`);
      // Continue with empty tokens object
    }
    
    // Encrypt and save
    tokens[key] = encrypt(JSON.stringify(tokenData));
    
    // Write atomically by creating a temporary file first
    const tempFile = `${TOKEN_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(tokens, null, 2), 'utf8');
    fs.renameSync(tempFile, TOKEN_FILE);
    
    console.log(`Token saved successfully for ${key}`);
  } catch (error: any) {
    console.error(`Failed to save token for ${key}:`, error);
    throw new StorageError(`Failed to save token: ${error.message}`);
  }
}

/**
 * Get token data for a specific org/service
 * @param key The org:service key
 * @returns The token data or null if not found
 */
export function getToken(key: string): TokenData | null {
  if (!key) {
    console.warn('Cannot get token: Key is required');
    return null;
  }
  
  try {
    // Check if file exists
    if (!fs.existsSync(TOKEN_FILE)) {
      console.warn(`Token file does not exist: ${TOKEN_FILE}`);
      return null;
    }
    
    const data = fs.readFileSync(TOKEN_FILE, 'utf8');
    
    if (!data || data.trim() === '') {
      console.warn('Token file is empty');
      return null;
    }
    
    const tokens: Record<string, string> = JSON.parse(data);
    
    if (!tokens[key]) {
      return null; // Key not found, but not an error
    }
    
    try {
      return JSON.parse(decrypt(tokens[key]));
    } catch (decryptError: any) {
      console.error(`Failed to decrypt token for ${key}:`, decryptError);
      return null;
    }
  } catch (error: any) {
    console.error(`Error retrieving token for ${key}:`, error);
    
    if (error instanceof SyntaxError) {
      console.error('Token file contains invalid JSON, attempting to reset');
      try {
        fs.writeFileSync(TOKEN_FILE, JSON.stringify({}), 'utf8');
      } catch (resetError: any) {
        console.error('Failed to reset token file:', resetError);
      }
    }
    
    return null;
  }
}

/**
 * Delete token data for a specific org/service
 * @param key The org:service key
 * @returns true if token was deleted, false otherwise
 */
export function deleteToken(key: string): boolean {
  if (!key) {
    console.warn('Cannot delete token: Key is required');
    return false;
  }
  
  try {
    // Check if file exists
    if (!fs.existsSync(TOKEN_FILE)) {
      console.warn(`Token file does not exist: ${TOKEN_FILE}`);
      return false;
    }
    
    const data = fs.readFileSync(TOKEN_FILE, 'utf8');
    
    if (!data || data.trim() === '') {
      console.warn('Token file is empty');
      return false;
    }
    
    const tokens: Record<string, string> = JSON.parse(data);
    
    if (!tokens[key]) {
      return false; // Token doesn't exist, nothing to delete
    }
    
    delete tokens[key];
    
    // Write atomically by creating a temporary file first
    const tempFile = `${TOKEN_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(tokens, null, 2), 'utf8');
    fs.renameSync(tempFile, TOKEN_FILE);
    
    console.log(`Token deleted successfully for ${key}`);
    return true;
  } catch (error: any) {
    console.error(`Error deleting token for ${key}:`, error);
    return false;
  }
}