# Setting Up GitHub Repository

Follow these steps to create a new GitHub repository and commit your OAuth Manager project:

## 1. Create a New GitHub Repository

1. Log in to GitHub
2. Click the "+" icon in the top right corner and select "New repository"
3. Name your repository (e.g., "oauth-manager")
4. Add a description (e.g., "OAuth 2.0 token management service")
5. Choose repository visibility (public or private)
6. Initialize with a README (optional)
7. Click "Create repository"

## 2. Initialize Local Git Repository

```bash
# Navigate to your project directory
cd ~/Projects/oauth-manager

# Initialize git repository
git init

# Add remote origin
git remote add origin git@github.com:yourusername/oauth-manager.git
```

## 3. Create and Configure .env File

```bash
# Generate secure keys
node scripts/generate-keys.js > .env.keys

# Create .env file using the generated keys
cp .env.example .env
cat .env.keys >> .env

# Configure .env with your actual service credentials
nano .env
```

## 4. Add Files and Make Initial Commit

```bash
# Add files to staging, excluding .env
git add .

# Commit
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main
```

## 5. Deploy to VPS

1. SSH into your Hostinger VPS
2. Clone the repository
3. Configure environment
4. Deploy using Docker stack

```bash
# SSH to VPS
ssh user@your-vps-hostname

# Clone the repository (using HTTPS instead of SSH)
git clone https://github.com/mrrobertkent/oauth-manager.git
cd oauth-manager

# Configure environment
cp .env.example .env
nano .env

# Make scripts executable
chmod +x scripts/deploy.sh

# Deploy
./scripts/deploy.sh
``` 