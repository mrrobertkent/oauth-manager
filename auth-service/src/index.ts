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

// Health check endpoint (public)
app.get('/health', (req, res) => {
  return res.json({ 
    status: 'healthy',
    version: '1.0.0'
  });
});

// Internal endpoint to get a valid token (requires API key)
app.get('/api/token/:serviceId', apiKeyAuth, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const token = await tokenManager.getValidToken(serviceId);
    return res.json({ 
      success: true,
      access_token: token,
      expires_in: tokenManager.getTokenTTL(serviceId),
      token_type: "Bearer"
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Specific endpoint for n8n (easier integration)
app.get('/api/n8n/token/:serviceId', apiKeyAuth, async (req, res) => {
  try {
    const token = await tokenManager.getValidToken(req.params.serviceId);
    // Just return the token as plain text for easier n8n integration
    return res.send(token);
  } catch (error: any) {
    return res.status(500).send(error.message);
  }
});

// Admin endpoint to get service statuses
app.get('/api/admin/status', adminAuth, (req, res) => {
  return res.json({ 
    success: true,
    services: tokenManager.getServiceStatuses()
  });
});

// Admin endpoint to revoke tokens
app.post('/api/admin/revoke/:serviceId', adminAuth, async (req, res) => {
  try {
    await tokenManager.revokeTokens(req.params.serviceId);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start the server
app.listen(config.port, () => {
  console.log(`Auth service running on port ${config.port}`);
});