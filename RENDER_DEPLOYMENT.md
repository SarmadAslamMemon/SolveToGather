# 🚀 Deploy to Render (Free Tier) - Quick Guide

This guide will help you deploy your full-stack CommunityConnect app to Render's free tier for testing.

## 📋 Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Render Account** - Sign up at https://render.com (free)

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub

If your code isn't already on GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Render Account & New Web Service

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your `CommunityConnect` repository
5. Render will auto-detect the `render.yaml` configuration

### Step 3: Configure Environment Variables

In the Render dashboard, go to **Environment** tab and add these variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Firebase Client Configuration (from your env.example)
VITE_FIREBASE_API_KEY=AIzaSyDhQZhmelEU5SeV4trChALR_ei0TyCkpFo
VITE_FIREBASE_PROJECT_ID=savetogather-19574
VITE_FIREBASE_APP_ID=1:986993003813:web:7b4dc10bffb0d8e26ddecc
VITE_FIREBASE_AUTH_DOMAIN=savetogather-19574.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=savetogather-19574.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=986993003813
VITE_FIREBASE_MEASUREMENT_ID=G-WM7FRZ6XC4

# API URL (will be set after first deployment)
# VITE_API_URL=https://your-app-name.onrender.com

# Firebase Admin SDK (Service Account JSON)
# Get this from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
# Copy the ENTIRE JSON content and paste it here (as a single line, or use base64)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"savetogather-19574",...}

# Session Secret (generate a random string)
SESSION_SECRET=YOUR_GENERATED_SECRET_HERE

# CORS (optional, will auto-allow your Render URL)
ALLOWED_ORIGINS=https://your-app-name.onrender.com
```

### Step 4: Get Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/project/savetogather-19574/settings/serviceaccounts/adminsdk)
2. Click **"Generate New Private Key"**
3. Download the JSON file
4. Copy the **entire JSON content** (as a single line)
5. Paste it into Render's `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable

**Important**: The JSON must be on a single line or escaped properly. You can also use base64 encoding.

### Step 5: Deploy

1. Click **"Create Web Service"** in Render
2. Render will:
   - Clone your repository
   - Run `npm install && npm run build`
   - Start with `npm start`
3. Wait for deployment to complete (5-10 minutes)

### Step 6: Update API URL

After deployment completes:

1. Copy your Render URL (e.g., `https://communityconnect-xxxx.onrender.com`)
2. Go back to Render dashboard → **Environment** tab
3. Add/Update: `VITE_API_URL=https://your-app-name.onrender.com`
4. **Redeploy** (Render will auto-redeploy when you save env vars, or click "Manual Deploy")

## ✅ Verify Deployment

1. Visit your Render URL: `https://your-app-name.onrender.com`
2. Test health endpoint: `https://your-app-name.onrender.com/api/health`
3. Test API: `https://your-app-name.onrender.com/api/communities`

## 🔧 Render Configuration

The `render.yaml` file is already configured with:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js
- **Port**: 5000 (auto-set by Render)

## 💡 Tips

1. **Free Tier Limits**: 
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - 750 hours/month free

2. **Environment Variables**: 
   - All `VITE_*` variables are needed for frontend
   - `FIREBASE_SERVICE_ACCOUNT_JSON` is needed for backend
   - Update `VITE_API_URL` after first deployment

3. **CORS**: 
   - Render URL is automatically allowed
   - Add Firebase Hosting URL to `ALLOWED_ORIGINS` if needed

4. **Logs**: 
   - View logs in Render dashboard
   - Check for any startup errors

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies in `package.json`
- Check build logs in Render dashboard

### Service Account Error
- Verify JSON is properly formatted (single line)
- Check Firebase project ID matches
- Ensure service account has proper permissions

### CORS Errors
- Add Render URL to `ALLOWED_ORIGINS`
- Check `VITE_API_URL` is set correctly

### Slow First Request
- Normal after spin-down (free tier limitation)
- Consider upgrading for always-on service

## 🎉 Success!

Once deployed, you'll have:
- ✅ Full-stack app running on Render
- ✅ Frontend + Backend in one service
- ✅ No Firebase Blaze plan needed
- ✅ Free tier for testing

Your app will be available at: `https://your-app-name.onrender.com`

