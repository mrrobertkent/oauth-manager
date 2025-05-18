import { Request, Response, NextFunction } from 'express';
import config from './config';

// API Key authentication middleware
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized: Invalid API key' 
    });
  }
  
  next();
}

// Admin authentication middleware (could be enhanced with JWT, etc.)
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized: Admin access required' 
    });
  }
  
  next();
}