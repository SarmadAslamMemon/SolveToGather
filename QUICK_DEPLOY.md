# Quick Deployment Commands

## 🚀 Railway (Fastest)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard or via CLI:
railway variables set NODE_ENV=production
railway variables set VITE_FIREBASE_API_KEY=your_key
# ... set all other variables
```

## 🌐 Render

1. Connect GitHub repo to Render
2. Create new Web Service
3. Render auto-detects `render.yaml`
4. Set environment variables in dashboard
5. Deploy automatically on push

## ✈️ Fly.io

```bash
# Install Fly CLI
# Windows PowerShell:
iwr https://fly.io/install.ps1 -useb | iex

# Login and launch
fly auth login
fly launch

# Set secrets
fly secrets set VITE_FIREBASE_API_KEY=your_key
fly secrets set VITE_FIREBASE_PROJECT_ID=your_project_id
# ... set all other secrets

# Deploy
fly deploy
```

## ▲ Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## 🐳 Docker (Any Platform)

```bash
# Build image
docker build -t communityconnect .

# Run locally
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e VITE_FIREBASE_API_KEY=your_key \
  # ... add all other env vars
  communityconnect

# Push to registry (example: Docker Hub)
docker tag communityconnect yourusername/communityconnect
docker push yourusername/communityconnect
```

## 📝 Environment Variables Quick Reference

Copy these to your platform's environment variables:

```bash
NODE_ENV=production
PORT=5000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_API_URL=https://your-deployed-url.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
SESSION_SECRET=your_random_secret_string
ALLOWED_ORIGINS=https://your-deployed-url.com
```

## ✅ Verify Deployment

1. Check health: `curl https://your-url.com/api/health`
2. Visit frontend: `https://your-url.com`
3. Test API: `curl https://your-url.com/api/communities`










