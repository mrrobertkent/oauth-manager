import axios from 'axios';
import NodeCache from 'node-cache';
import config, { getOrgConfig, OrgConfig } from './config';
import * as storage from './storage';

// Custom error classes for better error handling
export class NotFoundError extends Error {
  name = 'NotFoundError';
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends Error {
  name = 'ValidationError';
  constructor(message: string) {
    super(message);
  }
}

export class AuthenticationError extends Error {
  name = 'AuthenticationError';
  code = 'AUTH_FAILED';
  constructor(message: string) {
    super(message);
  }
}

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
    
    // No eager load; tokens are loaded on demand per org/service
  }
  
  private getCacheKey(orgId: string, serviceType: string): string {
    return `${orgId}:${serviceType}`;
  }
  
  public async getValidToken(orgId: string, serviceType: string): Promise<string> {
    if (!orgId) throw new ValidationError('Organization ID is required');
    if (!serviceType) throw new ValidationError('Service type is required');
    
    const org = getOrgConfig(orgId);
    if (!org) throw new NotFoundError(`Org config for '${orgId}' not found`);
    
    const serviceConfig = org.services[serviceType];
    if (!serviceConfig) throw new NotFoundError(`Service '${serviceType}' not found for org '${orgId}'`);
    
    const cacheKey = this.getCacheKey(orgId, serviceType);
    const cachedData = this.tokenCache.get<TokenData>(cacheKey);
    
    if (cachedData && Date.now() < cachedData.expiresAt - 60000) {
      return cachedData.accessToken;
    }
    
    if (this.refreshInProgress.has(cacheKey)) {
      try {
        const tokenData = await this.refreshInProgress.get(cacheKey)!;
        return tokenData.accessToken;
      } catch (error) {
        this.refreshInProgress.delete(cacheKey);
        throw error;
      }
    }
    
    const refreshPromise = this.refreshToken(orgId, serviceType);
    this.refreshInProgress.set(cacheKey, refreshPromise);
    
    try {
      const tokenData = await refreshPromise;
      return tokenData.accessToken;
    } catch (error) {
      console.error(`Failed to get valid token for ${orgId}/${serviceType}:`, error);
      throw error;
    } finally {
      this.refreshInProgress.delete(cacheKey);
    }
  }
  
  public getTokenTTL(orgId: string, serviceType: string): number {
    if (!orgId || !serviceType) {
      return 0;
    }
    
    const cacheKey = this.getCacheKey(orgId, serviceType);
    const cachedData = this.tokenCache.get<TokenData>(cacheKey);
    
    if (cachedData) {
      return Math.max(0, Math.floor((cachedData.expiresAt - Date.now()) / 1000));
    }
    
    return 0;
  }
  
  private async refreshToken(orgId: string, serviceType: string): Promise<TokenData> {
    const org = getOrgConfig(orgId);
    if (!org) throw new NotFoundError(`Org config for '${orgId}' not found`);
    
    const serviceConfig = org.services[serviceType];
    if (!serviceConfig) throw new NotFoundError(`Service '${serviceType}' not found for org '${orgId}'`);
    
    const cacheKey = this.getCacheKey(orgId, serviceType);
    const existingData = this.tokenCache.get<TokenData>(cacheKey) || storage.getToken(cacheKey);
    
    let tokenData: TokenData;
    
    if (existingData?.refreshToken) {
      try {
        tokenData = await this.performTokenRefresh(serviceConfig, existingData.refreshToken, orgId, serviceType);
      } catch (error) {
        console.error(`Error refreshing token for ${orgId}/${serviceType}:`, error);
        
        // Fall back to initial auth if refresh fails
        tokenData = await this.performInitialAuth(serviceConfig, orgId, serviceType);
      }
    } else {
      tokenData = await this.performInitialAuth(serviceConfig, orgId, serviceType);
    }
    
    const ttl = Math.floor((tokenData.expiresAt - Date.now()) / 1000);
    this.tokenCache.set(cacheKey, tokenData, ttl > 0 ? ttl : 3600);
    storage.saveToken(cacheKey, tokenData);
    
    return tokenData;
  }
  
  private async performInitialAuth(serviceConfig: any, orgId: string, serviceType: string): Promise<TokenData> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', serviceConfig.clientId);
      params.append('client_secret', serviceConfig.clientSecret);
      
      if (serviceConfig.scope) {
        params.append('scope', serviceConfig.scope);
      }
      
      if (serviceConfig.audience) {
        // Special handling for Zoho CRM which needs soid parameter
        if (serviceType === 'zohocrm' && serviceConfig.audience.startsWith('ZohoCRM.')) {
          params.append('soid', serviceConfig.audience);
        } else {
          params.append('audience', serviceConfig.audience);
        }
      }
      
      console.log(`Making token request to ${serviceConfig.tokenUrl} for ${orgId}/${serviceType} with params:`, Object.fromEntries(params.entries()));
      
      const response = await axios.post(serviceConfig.tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log(`Token response for ${orgId}/${serviceType}:`, response.data);
      
      if (!response.data.access_token) {
        throw new AuthenticationError(`No access token returned for ${orgId}/${serviceType}`);
      }
      
      const expiresIn = response.data.expires_in || 3600;
      
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + (expiresIn * 1000)
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        if (status === 401 || status === 403) {
          throw new AuthenticationError(`Authentication failed for ${orgId}/${serviceType}: ${data?.error || error.message}`);
        }
        
        if (status === 404) {
          throw new NotFoundError(`Token endpoint not found for ${orgId}/${serviceType}: ${serviceConfig.tokenUrl}`);
        }
        
        throw new Error(`Failed to obtain token for ${orgId}/${serviceType}: ${data?.error || error.message}`);
      }
      
      throw new Error(`Unexpected error authenticating ${orgId}/${serviceType}: ${error.message}`);
    }
  }
  
  private async performTokenRefresh(serviceConfig: any, refreshToken: string, orgId: string, serviceType: string): Promise<TokenData> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);
      params.append('client_id', serviceConfig.clientId);
      params.append('client_secret', serviceConfig.clientSecret);
      
      const response = await axios.post(serviceConfig.tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.data.access_token) {
        throw new AuthenticationError(`No access token returned when refreshing for ${orgId}/${serviceType}`);
      }
      
      const expiresIn = response.data.expires_in || 3600;
      
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
        expiresAt: Date.now() + (expiresIn * 1000)
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        if (status === 401 || status === 403) {
          throw new AuthenticationError(`Refresh token expired or invalid for ${orgId}/${serviceType}`);
        }
        
        throw new Error(`Failed to refresh token for ${orgId}/${serviceType}: ${data?.error || error.message}`);
      }
      
      throw new Error(`Unexpected error refreshing token for ${orgId}/${serviceType}: ${error.message}`);
    }
  }
  
  public async revokeTokens(orgId: string, serviceType: string): Promise<boolean> {
    if (!orgId) throw new ValidationError('Organization ID is required');
    if (!serviceType) throw new ValidationError('Service type is required');
    
    const org = getOrgConfig(orgId);
    if (!org) throw new NotFoundError(`Org config for '${orgId}' not found`);
    
    const serviceConfig = org.services[serviceType];
    if (!serviceConfig) throw new NotFoundError(`Service '${serviceType}' not found for org '${orgId}'`);
    
    const cacheKey = this.getCacheKey(orgId, serviceType);
    this.tokenCache.del(cacheKey);
    
    return storage.deleteToken(cacheKey);
  }
  
  public getServiceStatuses(): Record<string, { active: boolean, ttl: number }> {
    // For admin: return all cached tokens by org/service
    const statuses: Record<string, { active: boolean, ttl: number }> = {};
    
    this.tokenCache.keys().forEach(key => {
      const cachedData = this.tokenCache.get<TokenData>(key);
      const ttl = cachedData ? Math.max(0, Math.floor((cachedData.expiresAt - Date.now()) / 1000)) : 0;
      
      statuses[key] = {
        active: !!cachedData && ttl > 0,
        ttl
      };
    });
    
    return statuses;
  }
}