# FatBurn Challenge 2026

## Setup

### 1. Create JSONBin database
1. Go to https://jsonbin.io and sign up free
2. Click "Create Bin" and paste: `{ "participants": [] }`
3. Copy the Bin ID from the URL
4. Go to API Keys and copy your Master Key

### 2. Push to GitHub
1. Create a new GitHub repository
2. Upload all these files to it

### 3. Connect to Netlify
1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub → select your repo
4. Build settings:
   - Build command: (leave empty)
   - Publish directory: .
5. Click "Deploy site"

### 4. Add Environment Variables
In Netlify → Site configuration → Environment variables:
- JSONBIN_ID = (your bin ID)
- JSONBIN_API_KEY = (your master key)
- ADMIN_PASSWORD = Fatburn2026

### 5. Trigger redeploy
After adding env vars, go to Deploys → Trigger deploy → Deploy site
