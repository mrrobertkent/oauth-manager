# OAuth Manager Web UI and Authorization Code Flow Implementation

This document outlines the architecture and implementation plan for adding two key features to the OAuth Manager:

1. **Web UI for OAuth Credential Management**: A Next.js application for administrators to configure OAuth services
2. **OAuth 2.0 Authorization Code Flow Support**: Implementation of user consent flows for services like Google, QuickBooks, etc.

## Overall Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│   Next.js     │◄───►│   API Layer   │◄───►│ OAuth Manager │
│   Web UI      │     │   (Express)   │     │  (Existing)   │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │   Secrets     │
                                            │   Storage     │
                                            │               │
                                            └───────────────┘
```

Based on modern OAuth 2.0 architecture best practices, we'll maintain a clear separation between:
- **Authorization Server**: The component that issues tokens (part of our new implementation)
- **Resource Server**: The existing OAuth Manager that validates and uses tokens

This separation aligns with security recommendations and allows for cleaner code organization and maintenance.

## 1. Web UI for OAuth Credential Management

### Technology Stack
- **Frontend**: Next.js (v14+) with App Router
- **API Layer**: Express.js
- **Auth**: NextAuth.js with JWT or session-based authentication
- **Secrets Management**: AWS Secrets Manager, HashiCorp Vault, or similar
- **UI Components**: Tailwind CSS + Shadcn/UI for a modern admin interface

### Key Features
- Admin login interface with MFA support
- Dashboard showing configured OAuth services
- Forms to add/edit OAuth service configurations
- Real-time validation of credentials
- Credential override confirmation
- Audit logging for all configuration changes
- Role-based access controls

### Implementation Steps

1. **Create Next.js Application**
   ```bash
   npx create-next-app@latest oauth-manager-ui --ts --tailwind --app
   cd oauth-manager-ui
   npm install next-auth axios jsonwebtoken react-hook-form zod
   ```

2. **Implement Admin Authentication**
   - Create login page with secure credential handling
   - Set up NextAuth.js with JWT-based authentication
   - Implement protected routes using middleware
   - Add support for MFA (time-based OTP)

3. **Create Service Management UI**
   - Dashboard view of all configured services
   - Forms for adding new services with validation
   - Edit/delete functionality for existing services
   - Interactive wizards for common OAuth providers
   - Visual indicators for service status

4. **Set Up API Endpoints**
   - `/api/admin/services` - GET, POST, PUT, DELETE operations
   - `/api/admin/validate` - Test credentials are valid
   - `/api/admin/auth` - Authentication endpoints
   - `/api/admin/logs` - Audit log access

5. **Connect to OAuth Manager Service**
   - Set up secure communication between web UI and existing service
   - Implement credential updating mechanism
   - Add real-time validation of service configurations

## 2. OAuth 2.0 Authorization Code Flow

### Key Components
- OAuth redirect handlers
- PKCE implementation for all clients
- Code exchange implementation
- User session management
- Token storage for multiple users/organizations
- Refresh token handling
- Proper error handling and user-friendly error pages

### Implementation Steps

1. **Extend TokenManager**
   - Add support for authorization code flow with PKCE
   - Implement token refresh for user-specific tokens
   - Create user/organization token isolation
   - Implement proper token validation and security checks

   ```typescript
   public async initiateAuthCodeFlow(
     serviceId: string, 
     redirectUri: string, 
     codeChallenge: string, 
     codeChallengeMethod: string = 'S256',
     state: string,
     scope?: string
   ) {
     // Generate authorization URL with proper parameters
     // Store PKCE and state parameters securely
     // Return URL for redirect
   }
   
   public async handleAuthCodeCallback(
     serviceId: string, 
     code: string, 
     state: string,
     codeVerifier: string
   ) {
     // Validate state parameter to prevent CSRF
     // Exchange code for tokens using codeVerifier
     // Store tokens securely with proper user isolation
     // Return success or error information
   }
   ```

2. **Create Redirect Handlers**
   - Implement `/oauth/authorize/:serviceId` to initiate flow
   - Set up `/oauth/callback/:serviceId` for redirect handling
   - Create success/failure landing pages
   - Implement proper CORS configuration
   - Add proper handling for window/redirect interactions

3. **Update Storage Layer**
   - Modify token storage to support multiple users
   - Implement secure organization/user isolation
   - Add metadata for managing authorizations
   - Include token expiration and refresh management

4. **Add Support for Multiple Environments**
   - Development redirects (localhost)
   - Production redirects (your domain)
   - Testing tools
   - Debug logging for troubleshooting

5. **Implement PKCE (Proof Key for Code Exchange)**
   - Generate cryptographically secure code verifier
   - Create code challenge using SHA-256
   - Include in authorization requests
   - Validate during token exchange

   ```typescript
   // PKCE helper functions
   function generateCodeVerifier(): string {
     // Generate random string of 43-128 chars
     // Base64URL encode
     return base64UrlEncode(crypto.randomBytes(32));
   }
   
   function generateCodeChallenge(verifier: string): string {
     // SHA256 hash the verifier
     // Base64URL encode the hash
     const hash = crypto.createHash('sha256').update(verifier).digest();
     return base64UrlEncode(hash);
   }
   ```

6. **Handle Redirect Windows and Popups**
   - Implement proper window communication
   - Support both popup and same-window redirects
   - Handle edge cases like popup blockers
   - Provide fallback mechanisms

## Secrets Management

### Options
1. **AWS Secrets Manager**
   - Most secure, fully managed
   - Automatic rotation capabilities
   - Pay-per-use pricing

2. **HashiCorp Vault**
   - Self-hosted option
   - Comprehensive secrets management
   - Free open-source version available

3. **Firebase Secret Manager**
   - Integrates well with Firebase ecosystem
   - Easier setup for smaller projects
   - Reasonable free tier

4. **Cloudflare Workers KV**
   - Simple key-value storage
   - Global distribution
   - Free tier available

### Implementation
1. Choose a secrets provider based on your needs
2. Create secure access patterns (principle of least privilege)
3. Implement encryption at rest and in transit
4. Set up backup and recovery procedures
5. Implement secret rotation policies
6. Add audit logging for all secret access

## Connection Details for OAuth Manager

To connect your Next.js web UI to the existing OAuth Manager service, you'll need:

1. **Service Connection Information**
   - Service URL: `http://localhost:3001` (development) or your production URL
   - API Key: The API key from your `.env` file

2. **Required API Endpoints**
   - `GET /api/admin/status` - Current service status
   - `POST /api/admin/services` - Create new service (to be implemented)
   - `PUT /api/admin/services/:serviceId` - Update service (to be implemented)
   - `DELETE /api/admin/services/:serviceId` - Delete service (to be implemented)
   - `POST /api/admin/validate` - Validate service configuration

3. **Environment Variables**
   ```
   OAUTH_MANAGER_URL=http://localhost:3001
   OAUTH_MANAGER_API_KEY=your-api-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   JWT_SECRET=your-jwt-secret
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

## Implementation Timeline

1. **Week 1: Basic Setup**
   - Create Next.js application
   - Set up admin authentication with NextAuth.js
   - Implement service listing API

2. **Week 2: Service Management**
   - Implement service CRUD operations
   - Create validation endpoints
   - Connect to secrets manager

3. **Week 3: Authorization Code Flow**
   - Extend token manager with PKCE support
   - Implement redirect handlers
   - Update storage layer for multi-user support

4. **Week 4: Testing & Deployment**
   - End-to-end testing
   - Security review
   - Production deployment
   - Documentation

## Required Extensions to OAuth Manager

1. Add new endpoints to the existing service:
   ```javascript
   // Service management endpoints (protected by admin auth)
   app.get('/api/admin/services', adminAuth, (req, res) => {...});
   app.post('/api/admin/services', adminAuth, (req, res) => {...});
   app.put('/api/admin/services/:serviceId', adminAuth, (req, res) => {...});
   app.delete('/api/admin/services/:serviceId', adminAuth, (req, res) => {...});

   // OAuth flow endpoints
   app.get('/oauth/authorize/:serviceId', (req, res) => {...});
   app.get('/oauth/callback/:serviceId', (req, res) => {...});
   ```

2. Extend TokenManager class to support authorization code flow with PKCE:
   ```javascript
   // Add new methods to TokenManager
   public async initiateAuthCodeFlow(serviceId, redirectUri, codeChallenge, codeChallengeMethod, state) {...}
   public async handleAuthCodeCallback(serviceId, code, state, codeVerifier) {...}
   public async getTokenByUserId(serviceId, userId) {...}
   ```

3. Update storage layer to support user-specific tokens:
   ```javascript
   // New functions in storage.ts
   export function saveUserToken(serviceId, userId, tokenData) {...}
   export function getUserToken(serviceId, userId) {...}
   export function deleteUserToken(serviceId, userId) {...}
   ```

4. Implement proper redirect handling with window management:
   ```javascript
   // Helper for generating the OAuth redirect HTML
   function generateRedirectHtml(callbackData) {
     return `
       <!DOCTYPE html>
       <html lang="en">
       <head>
         <meta charset="UTF-8">
         <title>Authentication Complete</title>
         <script>
           try {
             if (window.opener) {
               window.opener.postMessage(${JSON.stringify(callbackData)}, '${process.env.APP_URL}');
               window.close();
             } else {
               window.location.href = '${process.env.APP_URL}/auth/callback?data=${encodeURIComponent(JSON.stringify(callbackData))}';
             }
           } catch (e) {
             console.error('Error during redirect:', e);
             document.getElementById('message').textContent = 'Authentication complete. You can close this window.';
           }
         </script>
       </head>
       <body>
         <p id="message">Completing authentication, please wait...</p>
       </body>
       </html>
     `;
   }
   ```

## Security Considerations

1. **Authentication**
   - Implement proper admin authentication with MFA
   - Use short-lived JWTs for service-to-service communication
   - Implement IP-based restrictions for admin access

2. **Authorization**
   - Strict permission models for service management
   - Role-based access controls for admin interfaces
   - Proper validation of all inputs

3. **Encryption**
   - Encrypt all credentials and tokens at rest
   - Use TLS 1.3 for all connections
   - Implement proper key management

4. **Rate Limiting**
   - Prevent brute force attacks on admin login
   - Limit API requests to prevent abuse
   - Implement exponential backoff for failed attempts

5. **Audit Logging**
   - Track all credential changes with user attribution
   - Log access to sensitive information
   - Include IP addresses and timestamps

6. **CSRF Protection**
   - Implement CSRF tokens for all state-changing operations
   - Validate Origin and Referer headers
   - Use SameSite cookies with Strict or Lax settings

7. **HTTPS**
   - Enforce HTTPS for all connections
   - Implement proper certificate management
   - Use HSTS headers

8. **Content Security Policy**
   - Limit resource loading to trusted sources
   - Prevent XSS attacks
   - Implement frame-ancestors restrictions

## Common OAuth Implementation Challenges

1. **Redirect Window Management**
   - Issue: OAuth redirects sometimes fail to properly close popup windows
   - Solution: Use reliable window communication patterns with fallbacks for different browsers

2. **CORS Issues with Callbacks**
   - Issue: Callback URLs may face CORS restrictions
   - Solution: Host redirect pages on the same domain or implement proper CORS headers

3. **PKCE Implementation**
   - Issue: PKCE must be correctly implemented for security
   - Solution: Follow RFC 7636 strictly with proper code verifier generation and challenge methods

4. **Token Storage Security**
   - Issue: Secure storage of multiple user tokens
   - Solution: Implement proper encryption and isolation patterns

## Deployment Options

1. **Same VPS as OAuth Manager**
   - Simplest approach
   - Use Nginx as reverse proxy
   - Docker Compose for service orchestration

2. **Separate Services**
   - More scalable
   - Use API Gateway for routing
   - Containerize all components

3. **Serverless Deployment**
   - Next.js on Vercel
   - API functions as serverless functions
   - Keep OAuth Manager as container

## Getting Started

1. Clone the OAuth Manager repository
2. Implement the required extensions
3. Create the Next.js application
4. Set up development environment
5. Begin implementation following the timeline

## References

1. Microsoft OAuth 2.0 Authorization Code Flow: [Microsoft Identity Platform](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
2. OAuth 2.0 Simplified by Aaron Parecki: [OAuth 2 Simplified](https://aaronparecki.com/oauth-2-simplified/)
3. OAuth 2.0 for Browser-Based Apps (RFC 8252 + BCP 212): [OAuth Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
4. Proof Key for Code Exchange (RFC 7636): [PKCE Extension](https://datatracker.ietf.org/doc/html/rfc7636)

This document provides a comprehensive overview. Specific implementation details may vary based on your requirements and constraints. 