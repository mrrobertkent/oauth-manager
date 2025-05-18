import axios from 'axios';
import NodeCache from 'node-cache';
import config from './config';
import * as storage from './storage';

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export class TokenManager {
  private tokenCache: NodeCache;
  private refreshInProgress: Map<string, Promise<TokenData>>;
  
  constructor() {
    // Cache with TTL slightly shorter than token expiry
    this.tokenCache = new NodeCache({ checkperiod: 60 });
    this.refreshInProgress = new Map();
    
    // Load tokens from storage into cache on startup
    this.loadTokensFromStorage();
  }
  
  private loadTokensFromStorage(): void {
    // For each configured service, try to load token from storage
    Object.keys(config.services).forEach(serviceId => {
      const tokenData = storage.getToken(serviceId);
      if (tokenData) {
        const ttl = Math.floor((tokenData.expiresAt - Date.now()) / 1000);
        if (ttl > 0) {
          this.tokenCache.set(serviceId, tokenData, ttl);
        }
      }
    });
  }
  
  public async getValidToken(serviceId: string): Promise<string> {
    // Check if this is a valid service
    if (!config.services[serviceId]) {
      throw new Error(`Service configuration for '${serviceId}' not found`);
    }
    
    // Check if we have a valid token in cache
    const cachedData = this.tokenCache.get<TokenData>(serviceId);
    
    if (cachedData && Date.now() < cachedData.expiresAt - 60000) {
      return cachedData.accessToken;
    }
    
    // We need a new token - check if refresh is already in progress
    if (this.refreshInProgress.has(serviceId)) {
      const tokenData = await this.refreshInProgress.get(serviceId)!;
      return tokenData.accessToken;
    }
    
    // Start new refresh process
    const refreshPromise = this.refreshToken(serviceId);
    this.refreshInProgress.set(serviceId, refreshPromise);
    
    try {
      const tokenData = await refreshPromise;
      return tokenData.accessToken;
    } finally {
      this.refreshInProgress.delete(serviceId);
    }
  }
  
  public getTokenTTL(serviceId: string): number {
    const cachedData = this.tokenCache.get<TokenData>(serviceId);
    if (cachedData) {
      return Math.max(0, Math.floor((cachedData.expiresAt - Date.now()) / 1000));
    }
    return 0;
  }
  
  private async refreshToken(serviceId: string): Promise<TokenData> {
    // Get service configuration
    const serviceConfig = config.services[serviceId];
    
    // Get existing token data if available
    const existingData = this.tokenCache.get<TokenData>(serviceId) || storage.getToken(serviceId);
    
    let tokenData: TokenData;
    
    if (existingData?.refreshToken) {
      // Use refresh token flow
      try {
        tokenData = await this.performTokenRefresh(serviceId, existingData.refreshToken);
      } catch (error) {
        console.error(`Error refreshing token for ${serviceId}:`, error);
        // If refresh fails, fall back to initial auth
        tokenData = await this.performInitialAuth(serviceId);
      }
    } else {
      // Use client credentials flow or other initial auth flow
      tokenData = await this.performInitialAuth(serviceId);
    }
    
    // Store in cache with TTL
    const ttl = Math.floor((tokenData.expiresAt - Date.now()) / 1000);
    this.tokenCache.set(serviceId, tokenData, ttl > 0 ? ttl : 3600);
    
    // Persist to storage
    storage.saveToken(serviceId, tokenData);
    
    return tokenData;
  }
  
  private async performInitialAuth(serviceId: string): Promise<TokenData> {
    const serviceConfig = config.services[serviceId];
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', serviceConfig.clientId);
    params.append('client_secret', serviceConfig.clientSecret);
    
    if (serviceConfig.scope) {
      params.append('scope', serviceConfig.scope);
    }
    
    if (serviceConfig.audience) {
      params.append('audience', serviceConfig.audience);
    }
    
    const response = await axios.post(serviceConfig.tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const expiresIn = response.data.expires_in || 3600;
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: Date.now() + (expiresIn * 1000)
    };
  }
  
  private async performTokenRefresh(serviceId: string, refreshToken: string): Promise<TokenData> {
    const serviceConfig = config.services[serviceId];
    
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('client_id', serviceConfig.clientId);
    params.append('client_secret', serviceConfig.clientSecret);
    
    const response = await axios.post(serviceConfig.tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const expiresIn = response.data.expires_in || 3600;
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken, // Keep old refresh token if not provided
      expiresAt: Date.now() + (expiresIn * 1000)
    };
  }
  
  public async revokeTokens(serviceId: string): Promise<boolean> {
    // Remove from cache
    this.tokenCache.del(serviceId);
    
    // Remove from storage
    return storage.deleteToken(serviceId);
  }
  
  public getServiceStatuses(): Record<string, { active: boolean, ttl: number }> {
    const statuses: Record<string, { active: boolean, ttl: number }> = {};
    
    Object.keys(config.services).forEach(serviceId => {
      const cachedData = this.tokenCache.get<TokenData>(serviceId);
      const ttl = this.getTokenTTL(serviceId);
      
      statuses[serviceId] = {
        active: !!cachedData && ttl > 0,
        ttl
      };
    });
    
    return statuses;
  }
}