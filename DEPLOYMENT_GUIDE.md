# Deployment Guide for CommunityConnect

This guide covers deploying both the frontend and backend (functions) of CommunityConnect to various platforms.

## 📋 Prerequisites

1. **Environment Variables**: Ensure you have all required environment variables ready (see `env.example`)
2. **Firebase Setup**: Your Firebase project should be configured and accessible
3. **Service Account**: Download Firebase service account JSON file from Firebase Console
4. **Build the Project**: Test the build locally first:
   ```bash
   npm run build
   ```

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Easiest)

Railway is great for full-stack apps with minimal configuration.

#### Steps:

1. **Install Railway CLI** (optional, or use web UI):
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Create a new project**:
   ```bash
   railway init
   ```

3. **Set Environment Variables** in Railway dashboard:
   - `NODE_ENV=production`
   - `PORT=5000` (Railway sets this automatically, but include for safety)
   - `VITE_FIREBASE_API_KEY=your_key`
   - `VITE_FIREBASE_PROJECT_ID=your_project_id`
   - `VITE_FIREBASE_APP_ID=your_app_id`
   - `VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain`
   - `VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id`
   - `VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id`
   - `VITE_API_URL=https://your-app.railway.app` (set after first deploy)
   - `FIREBASE_SERVICE_ACCOUNT_JSON=<paste entire JSON content>`
   - `SESSION_SECRET=<generate random string>`
   - `ALLOWED_ORIGINS=https://your-app.railway.app` (optional, comma-separated)

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Update API URL**: After deployment, update `VITE_API_URL` to your Railway URL

**Note**: Railway automatically detects Node.js projects and runs `npm start` after build.

---

### Option 2: Render

Render provides free tier hosting with automatic deployments.

#### Steps:

1. **Create `render.yaml`** (already created in project root)

2. **Connect GitHub repository** to Render

3. **Create a new Web Service**:
   - Select your repository
   - Render will auto-detect the `render.yaml` configuration
   - Or manually configure:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: Node

4. **Set Environment Variables** in Render dashboard (same as Railway)

5. **Deploy**: Render will automatically deploy on every push to main branch

---

### Option 3: Vercel

Vercel works well but requires some configuration for Express apps.

#### Steps:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configure**:
   - Vercel will create `vercel.json` automatically
   - Set environment variables in Vercel dashboard
   - Update `VITE_API_URL` to your Vercel URL

**Note**: For Express apps on Vercel, you may need to use Vercel Serverless Functions. See `vercel.json` configuration.

---

### Option 4: Fly.io

Fly.io provides global edge deployment.

#### Steps:

1. **Install Fly CLI**:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Launch** (uses `fly.toml`):
   ```bash
   fly launch
   ```

4. **Set Secrets**:
   ```bash
   fly secrets set VITE_FIREBASE_API_KEY=your_key
   fly secrets set VITE_FIREBASE_PROJECT_ID=your_project_id
   # ... set all other environment variables
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

---

### Option 5: Google Cloud Run

Since you're using Firebase, Google Cloud Run integrates seamlessly.

#### Steps:

1. **Install Google Cloud SDK**

2. **Build and push container**:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/communityconnect
   ```

3. **Deploy**:
   ```bash
   gcloud run deploy communityconnect \
     --image gcr.io/PROJECT_ID/communityconnect \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

4. **Set Environment Variables** in Cloud Run console

---

### Option 6: DigitalOcean App Platform

#### Steps:

1. **Create `app.yaml`** (already created in project root)

2. **Connect GitHub** to DigitalOcean

3. **Create App** from GitHub repository

4. **Configure**:
   - DigitalOcean will auto-detect `app.yaml`
   - Set environment variables in dashboard

5. **Deploy**: Automatic on push to main branch

---

## 🔧 Environment Variables Setup

For all platforms, you need to set these environment variables:

### Required Variables:

```bash
# Firebase Client Config (for frontend)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# API URL (update after deployment)
VITE_API_URL=https://your-deployed-url.com

# Firebase Admin (for backend)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...} # Full JSON as string
# OR use base64 encoded:
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64_encoded_json>

# Server Config
NODE_ENV=production
PORT=5000  # Most platforms set this automatically
SESSION_SECRET=<generate_random_string>
```

### Generating SESSION_SECRET:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator
```

---

## 📦 Build Process

The project uses a unified build process:

```bash
npm run build
```

This command:
1. Builds the frontend (Vite) → `dist/public/`
2. Bundles the backend (esbuild) → `dist/index.js`

In production, the Express server:
- Serves static files from `dist/public/`
- Handles API routes at `/api/*`

---

## 🔍 Post-Deployment Checklist

- [ ] Verify frontend loads correctly
- [ ] Test health check endpoint: `GET /api/health`
- [ ] Test API endpoints (`/api/communities`, etc.)
- [ ] Verify Firebase connection works
- [ ] Test authentication flow
- [ ] Check CORS settings (set `ALLOWED_ORIGINS` env var if needed)
- [ ] Update `VITE_API_URL` to production URL
- [ ] Test file uploads (if using Cloudinary)
- [ ] Monitor logs for errors

## ⚙️ Recent Fixes Applied

The following production-ready fixes have been applied to the codebase:

1. **CORS Configuration**: Now supports multiple origins via `ALLOWED_ORIGINS` environment variable
2. **Server Host Binding**: Changed from `localhost` to `0.0.0.0` in production for proper network binding
3. **Static File Path**: Fixed production static file serving path to `dist/public`
4. **Health Check Endpoint**: Added `/api/health` endpoint for monitoring and load balancer checks

---

## 🐛 Troubleshooting

### CORS Issues

CORS is now configurable via environment variables. Set `ALLOWED_ORIGINS` to a comma-separated list:

```bash
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

The server automatically allows the origin from `VITE_API_URL` as well.

### Build Failures

1. Check Node.js version (should be 18+)
2. Ensure all dependencies are in `package.json`
3. Check build logs for specific errors

### Firebase Connection Issues

1. Verify service account JSON is correctly set
2. Check Firebase project ID matches
3. Ensure Firebase Admin SDK has proper permissions

### Static Files Not Loading

1. Verify `dist/public` directory exists after build
2. Check server is serving static files correctly
3. Verify file paths in production build

---

## 🔄 Continuous Deployment

Most platforms support automatic deployments:

1. **GitHub Actions**: See `.github/workflows/` (if configured)
2. **Platform Auto-Deploy**: Enable in platform dashboard
3. **Manual Deploy**: Use platform CLI or dashboard

---

## 📝 Platform-Specific Notes

### Railway
- Free tier: $5 credit/month
- Auto-detects Node.js projects
- Easy environment variable management

### Render
- Free tier available
- Automatic SSL certificates
- Zero-downtime deployments

### Vercel
- Excellent for frontend
- Serverless functions for backend
- Global CDN

### Fly.io
- Global edge deployment
- Docker-based
- Good for low latency

### Google Cloud Run
- Pay per use
- Integrates with Firebase
- Auto-scaling

---

## 🆘 Need Help?

- Check platform-specific documentation
- Review build logs in platform dashboard
- Test locally with production environment variables
- Check Firebase Console for connection issues

