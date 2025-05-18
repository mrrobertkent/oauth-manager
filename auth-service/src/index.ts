import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { TokenManager } from './tokenManager';
import { apiKeyAuth, adminAuth } from './middleware';
import config from './config';

// Initialize Express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(express.json());
app.use(cors({
  origin: [
    'https://convergex.app',
    'https://api.convergex.app',
    'https://n8n.convergex.app',
    // For local development
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

// Apply rate limiting to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Initialize token manager
const tokenManager = new TokenManager();

// Global error handler for unexpected exceptions
const errorHandler = (error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, error);
  
  // Determine the appropriate status code
  let statusCode = 500; // Default to internal server error
  if (error.name === 'NotFoundError' || error.message.includes('not found')) {
    statusCode = 404;
  } else if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
    statusCode = 400;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
  }

  // Sanitize error message for production
  const message = process.env.NODE_ENV === 'production' 
    ? statusCode === 500 ? 'Internal server error' : error.message
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: error.code || `ERR_${statusCode}`,
      ...(process.env.NODE_ENV !== 'production' && {stack: error.stack})
    }
  });
};

// Health check endpoint (public)
app.get('/health', (req, res) => {
  return res.json({ 
    status: 'healthy',
    version: '1.0.0'
  });
});

// Internal endpoint to get a valid token (requires API key)
app.get('/api/token/:orgId/:serviceType', apiKeyAuth, async (req, res, next) => {
  try {
    const { orgId, serviceType } = req.params;
    
    if (!orgId || !serviceType) {
      return res.status(400).json({ 
        success: false, 
        error: {
          message: 'Both orgId and serviceType are required',
          code: 'MISSING_PARAMETERS'
        }
      });
    }
    
    const token = await tokenManager.getValidToken(orgId, serviceType);
    return res.json({ 
      success: true,
      access_token: token,
      expires_in: tokenManager.getTokenTTL(orgId, serviceType),
      token_type: "Bearer"
    });
  } catch (error: any) {
    next(error); // Pass to global error handler
  }
});

// Specific endpoint for n8n (easier integration)
app.get('/api/n8n/token/:orgId/:serviceType', apiKeyAuth, async (req, res, next) => {
  try {
    const { orgId, serviceType } = req.params;
    
    if (!orgId || !serviceType) {
      return res.status(400).send('Error: Both orgId and serviceType are required');
    }
    
    const token = await tokenManager.getValidToken(orgId, serviceType);
    // Just return the token as plain text for easier n8n integration
    return res.send(token);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).send(`Error: ${error.message}`);
    }
    // For n8n endpoint, return plain text errors
    return res.status(500).send(`Error: ${error.message}`);
  }
});

// Admin endpoint to get service statuses
app.get('/api/admin/status', adminAuth, (req, res, next) => {
  try {
    return res.json({ 
      success: true,
      services: tokenManager.getServiceStatuses()
    });
  } catch (error) {
    next(error); // Pass to global error handler
  }
});

// Admin endpoint to revoke tokens
app.post('/api/admin/revoke/:orgId/:serviceType', adminAuth, async (req, res, next) => {
  try {
    const { orgId, serviceType } = req.params;
    
    if (!orgId || !serviceType) {
      return res.status(400).json({ 
        success: false, 
        error: {
          message: 'Both orgId and serviceType are required',
          code: 'MISSING_PARAMETERS'
        }
      });
    }
    
    await tokenManager.revokeTokens(orgId, serviceType);
    return res.json({ success: true });
  } catch (error: any) {
    next(error); // Pass to global error handler
  }
});

// Route not found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND'
    }
  });
});

// Apply global error handler
app.use(errorHandler);

// Start the server
app.listen(config.port, () => {
  console.log(`Auth service running on port ${config.port}`);
});