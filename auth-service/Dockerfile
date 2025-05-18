FROM node:18-alpine

WORKDIR /app

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

# Expose port
EXPOSE 3001

# Create volume for persistent data
VOLUME /app/data

# Run the application
CMD ["npm", "start"]