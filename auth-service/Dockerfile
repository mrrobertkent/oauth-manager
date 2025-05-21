FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=productionv

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Doppler CLI (requires gnupg for signature verification)
RUN apk add --no-cache curl gnupg && \
    curl -Ls https://cli.doppler.com/install.sh | sh

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build


# Non-root user for better security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -G nodejs && \
    chown -R nodejs:nodejs /app

# Ensure the data directory exists and is owned by nodejs
RUN mkdir -p /app/auth-service/data && \
    chown -R nodejs:nodejs /app/auth-service/data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Create volume for persistent data
VOLUME /app/data

# Run the application
CMD ["node", "dist/index.js"]